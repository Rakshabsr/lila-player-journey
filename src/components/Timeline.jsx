import { useEffect, useRef, useState } from 'react'

// NOTE on timestamps: The parquet files store Unix timestamps in SECONDS but the
// column type is timestamp[ms]. When pandas reads them, it treats the value as
// milliseconds — so a delta of "729 units" actually means 729 SECONDS (≈12 min),
// not 729ms. All ts values in events.json are therefore in SECONDS from match start.

const TICK_MS = 50   // real-time tick interval (ms)
const PLAYBACK_DURATION = 30000  // always 30 real seconds for full match

export function Timeline({ events, currentTs, maxTs, onSeek, playing, onTogglePlay }) {
  const trackRef = useRef(null)

  const pct = maxTs > 0 ? Math.min(100, (currentTs / maxTs) * 100) : 0

  function handleTrackClick(e) {
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(ratio * maxTs)
  }

  // Format ts value as MM:SS (ts is in seconds)
  function formatTime(sec) {
    const s = Math.floor(sec)
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  // Event density marks (non-position events only)
  const MARKS = 40
  const density = new Array(MARKS).fill(0)
  for (const e of events) {
    if (e.evt === 'Position' || e.evt === 'BotPosition') continue
    const bucket = Math.min(MARKS - 1, Math.floor((e.ts / maxTs) * MARKS))
    density[bucket]++
  }
  const maxDensity = Math.max(1, ...density)

  return (
    <div className="timeline">
      <button className="play-btn" onClick={onTogglePlay} title={playing ? 'Pause' : 'Play'}>
        {playing ? '⏸' : '▶'}
      </button>

      <div className="track-wrap">
        <div className="density-bars">
          {density.map((d, i) => (
            <div key={i} className="density-bar" style={{ height: `${(d / maxDensity) * 100}%` }} />
          ))}
        </div>
        <div className="track" ref={trackRef} onClick={handleTrackClick}>
          <div className="track-fill"  style={{ width: `${pct}%` }} />
          <div className="track-thumb" style={{ left: `${pct}%` }} />
        </div>
      </div>

      <span className="time-label">
        {formatTime(currentTs)} / {formatTime(maxTs)}
      </span>
    </div>
  )
}

export function usePlayback(maxTs) {
  const [currentTs, setCurrentTs] = useState(0)
  const [playing, setPlaying]     = useState(false)
  const rafRef  = useRef(null)
  const lastRef = useRef(null)

  useEffect(() => { setCurrentTs(0); setPlaying(false) }, [maxTs])

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(rafRef.current); return }

    // Dynamic step: always completes full match in PLAYBACK_DURATION real ms
    const ticksTotal = PLAYBACK_DURATION / TICK_MS
    const stepPerTick = maxTs / ticksTotal   // seconds of match per real tick

    function tick(now) {
      if (lastRef.current != null) {
        const deltaRealMs = now - lastRef.current
        const matchSecondsToAdvance = (deltaRealMs / TICK_MS) * stepPerTick
        setCurrentTs(prev => {
          const next = prev + matchSecondsToAdvance
          if (next >= maxTs) { setPlaying(false); return maxTs }
          return next
        })
      }
      lastRef.current = now
      rafRef.current  = requestAnimationFrame(tick)
    }
    lastRef.current = null
    rafRef.current  = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, maxTs])

  return {
    currentTs,
    playing,
    seek:       (ts) => setCurrentTs(ts),
    togglePlay: () => setPlaying(p => !p),
  }
}
