import { useState, useEffect, useMemo } from 'react'

export function useEvents() {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetch('/events.json')
      .then(r => r.json())
      .then(data => { setEvents(data.events); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  // Unique dates per map: { AmbroseValley: ['Feb 10', ...], ... }
  const datesByMap = useMemo(() => {
    const result = {}
    for (const e of events) {
      if (!result[e.map]) result[e.map] = new Set()
      result[e.map].add(e.date)
    }
    return Object.fromEntries(
      Object.entries(result).map(([k, v]) => [k, Array.from(v).sort()])
    )
  }, [events])

  // Unique matches per map+date, sorted by event count descending (busiest first)
  const matchesByMapDate = useMemo(() => {
    const counts = {}
    for (const e of events) {
      const key = `${e.map}|${e.date}`
      if (!counts[key]) counts[key] = {}
      counts[key][e.mid] = (counts[key][e.mid] || 0) + 1
    }
    return Object.fromEntries(
      Object.entries(counts).map(([k, matchCounts]) => [
        k,
        Object.entries(matchCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([mid]) => mid)
      ])
    )
  }, [events])

  return { events, loading, error, datesByMap, matchesByMapDate }
}
