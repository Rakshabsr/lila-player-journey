const MAPS = ['AmbroseValley', 'GrandRift', 'Lockdown']

const MAP_LABELS = {
  AmbroseValley: 'Ambrose Valley',
  GrandRift:     'Grand Rift',
  Lockdown:      'Lockdown',
}

export function Sidebar({ filters, setFilters, dates, matches, stats }) {
  function set(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function toggleType(type) {
    setFilters(prev => {
      const next = new Set(prev.visibleTypes)
      next.has(type) ? next.delete(type) : next.add(type)
      return { ...prev, visibleTypes: next }
    })
  }

  const eventToggles = [
    { label: 'Human paths',   key: 'showHumans',  color: '#58a6ff' },
    { label: 'Bot paths',     key: 'showBots',    color: '#f0883e' },
  ]

  const markerToggles = [
    { type: 'Kill',           label: 'Kill (human)',  color: '#f85149' },
    { type: 'Killed',         label: 'Death (human)', color: '#f85149' },
    { type: 'BotKill',        label: 'Kill (bot)',    color: '#d29922' },
    { type: 'BotKilled',      label: 'Death (bot)',   color: '#d29922' },
    { type: 'KilledByStorm',  label: 'Storm death',   color: '#bc8cff' },
    { type: 'Loot',           label: 'Loot pickup',   color: '#3fb950' },
  ]

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h3 className="section-title">Map</h3>
        <div className="map-buttons">
          {MAPS.map(m => (
            <button
              key={m}
              className={`map-btn ${filters.map === m ? 'active' : ''}`}
              onClick={() => set('map', m)}
            >
              {MAP_LABELS[m]}
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <h3 className="section-title">Date</h3>
        <select
          className="select"
          value={filters.date}
          onChange={e => set('date', e.target.value)}
        >
          {dates.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </section>

      <section className="sidebar-section">
        <h3 className="section-title">Match</h3>
        <select
          className="select"
          value={filters.match}
          onChange={e => set('match', e.target.value)}
        >
          {matches.map((m, i) => (
            <option key={m} value={m}>Match {i + 1} — {m.slice(0, 8)}</option>
          ))}
        </select>
        {stats && (
          <p className="match-stats">
            {stats.humans} players · {stats.bots} bots · {stats.events} events
          </p>
        )}
      </section>

      <section className="sidebar-section">
        <h3 className="section-title">Heatmap</h3>
        <div className="heatmap-buttons">
          {[
            { mode: null,      label: 'Off',     color: '#8b949e' },
            { mode: 'traffic', label: 'Traffic', color: '#3fb950' },
            { mode: 'kills',   label: 'Kills',   color: '#f85149' },
            { mode: 'deaths',  label: 'Deaths',  color: '#bc8cff' },
          ].map(({ mode, label, color }) => (
            <button
              key={label}
              className={`heatmap-btn ${filters.heatmap === mode ? 'active' : ''}`}
              style={filters.heatmap === mode ? { borderColor: color, color } : {}}
              onClick={() => set('heatmap', mode)}
            >
              {label}
            </button>
          ))}
        </div>
        {filters.heatmap && (
          <label className="toggle-row" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              checked={!!filters.pathsOnHeatmap}
              onChange={() => set('pathsOnHeatmap', !filters.pathsOnHeatmap)}
            />
            <span style={{ fontSize: 12, color: '#8b949e' }}>Show paths over heatmap</span>
          </label>
        )}
      </section>

      <section className="sidebar-section">
        <h3 className="section-title">Show / Hide</h3>
        {eventToggles.map(({ label, key, color }) => (
          <label key={key} className="toggle-row">
            <input
              type="checkbox"
              checked={filters[key]}
              onChange={() => set(key, !filters[key])}
            />
            <span className="toggle-dot" style={{ background: color }} />
            <span>{label}</span>
          </label>
        ))}

        <div className="divider" />

        {markerToggles.map(({ type, label, color }) => (
          <label key={type} className="toggle-row">
            <input
              type="checkbox"
              checked={filters.visibleTypes.has(type)}
              onChange={() => toggleType(type)}
            />
            <span className="toggle-dot" style={{ background: color }} />
            <span>{label}</span>
          </label>
        ))}
      </section>
    </aside>
  )
}
