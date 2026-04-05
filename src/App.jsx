import { useState, useMemo, useEffect } from 'react'
import { useEvents } from './hooks/useEvents'
import { Sidebar } from './components/Sidebar'
import { MapCanvas } from './components/MapCanvas'
import { Timeline, usePlayback } from './components/Timeline'

const DEFAULT_TYPES = new Set([
  'Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm', 'Loot'
])

export default function App() {
  const { events, loading, error, datesByMap, matchesByMapDate } = useEvents()

  const [filters, setFilters] = useState({
    map:            'AmbroseValley',
    date:           '',
    match:          '',
    showHumans:     true,
    showBots:       true,
    visibleTypes:   new Set(DEFAULT_TYPES),
    heatmap:        null,
    pathsOnHeatmap: false,
  })

  const availableDates   = datesByMap[filters.map] || []
  const matchKey         = `${filters.map}|${filters.date}`
  const availableMatches = matchesByMapDate[matchKey] || []

  // Reset date when map changes
  useEffect(() => {
    if (availableDates.length > 0 && !availableDates.includes(filters.date)) {
      setFilters(prev => ({ ...prev, date: availableDates[0], match: '' }))
    }
  }, [filters.map, availableDates.join(',')])

  // Reset match when date/map changes
  useEffect(() => {
    if (availableMatches.length > 0 && !availableMatches.includes(filters.match)) {
      setFilters(prev => ({ ...prev, match: availableMatches[0] }))
    }
  }, [filters.date, filters.map, availableMatches.length])

  // Events for the selected match (paths, markers, timeline)
  const matchEvents = useMemo(() => {
    if (!filters.match) return []
    return events.filter(e => e.map === filters.map && e.mid === filters.match)
  }, [events, filters.map, filters.match])

  // All events for the selected map + date (used for heatmap — day-level aggregate)
  const dayEvents = useMemo(() => {
    if (!filters.date) return []
    return events.filter(e => e.map === filters.map && e.date === filters.date)
  }, [events, filters.map, filters.date])

  // Timeline range
  const maxTs = useMemo(() => {
    if (!matchEvents.length) return 0
    return Math.max(...matchEvents.map(e => e.ts))
  }, [matchEvents])

  const { currentTs, playing, seek, togglePlay } = usePlayback(maxTs)

  // Match stats for sidebar
  const stats = useMemo(() => {
    if (!matchEvents.length) return null
    const humans = new Set(matchEvents.filter(e => !e.bot).map(e => e.uid)).size
    const bots   = new Set(matchEvents.filter(e => e.bot).map(e => e.uid)).size
    return { humans, bots, events: matchEvents.length }
  }, [matchEvents])

  if (loading) return (
    <div className="fullscreen-center">
      <div className="spinner" />
      <p>Loading 89,000 events…</p>
    </div>
  )

  if (error) return (
    <div className="fullscreen-center error">
      <p>Failed to load data: {error}</p>
    </div>
  )

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="header-logo">◈</span>
          <h1>LILA BLACK</h1>
          <span className="header-subtitle">Player Journey Visualization</span>
        </div>
        <div className="header-right">
          <span className="header-chip">89,104 events · 796 matches · 3 maps</span>
        </div>
      </header>

      <div className="layout">
        <Sidebar
          filters={filters}
          setFilters={setFilters}
          dates={availableDates}
          matches={availableMatches}
          stats={stats}
        />

        <main className="map-area">
          <div className="map-col">
            <MapCanvas
              events={matchEvents}
              dayEvents={dayEvents}
              filters={filters}
              currentTs={currentTs}
              maxTs={maxTs}
            />
            {matchEvents.length > 0 && (
              <Timeline
                events={matchEvents}
                currentTs={currentTs}
                maxTs={maxTs}
                onSeek={seek}
                playing={playing}
                onTogglePlay={togglePlay}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
