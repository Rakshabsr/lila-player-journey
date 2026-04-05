# LILA Player Journey Visualization

A browser-based tool for Level Designers to explore player behaviour in **LILA BLACK** — an extraction shooter. Visualises 5 days of production telemetry across 3 maps, 796 matches, and 89,104 recorded events.

**Live URL:** https://lila-player-journey-zeta.vercel.app

---

## Features

| Feature | Description |
|---------|-------------|
| **Player paths** | Human paths (blue) and bot paths (orange) drawn on the minimap |
| **Event markers** | Kill (red ✕), Death (circled ✕), Loot (green square), Storm death (purple diamond) |
| **Map selector** | Switch between AmbroseValley, GrandRift, and Lockdown |
| **Date + Match filter** | Filter by day (Feb 10–14) and individual match; matches sorted busiest first |
| **Match stats** | Human count, bot count, event count per selected match |
| **Timeline + Playback** | Scrub or play through a match in real time; density bars show when events cluster |
| **Heatmap overlays** | Traffic (player movement), Kills, or Deaths — aggregated over the full selected day |
| **Show/Hide toggles** | Independently toggle human paths, bot paths, and each event type |

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite | Fast build, component model, no config overhead |
| Rendering | HTML Canvas API | Handles 1,000+ draw calls without DOM slowdown |
| Data | Static JSON (pre-processed) | No backend needed; Vercel serves with gzip compression |
| Heatmap | Custom (no library) | Full control over colour ramps per mode |
| Hosting | Vercel (free tier) | Auto-deploys on every GitHub push |

---

## Setup (Local Development)

**Prerequisites:** Node.js, Python 3.9+

```bash
# 1. Clone the repo
git clone https://github.com/Rakshabsr/lila-player-journey.git
cd lila-player-journey

# 2. Install frontend dependencies
npm install

# 3. (Optional) Re-generate events.json from raw data
#    Place the player_data/ folder in the project root first
pip3 install pyarrow pandas
python3 scripts/process_data.py

# 4. Run the dev server
npm run dev
```

Open `http://localhost:5173`

---

## Data Pipeline

The raw data (1,243 Parquet files, ~33MB) is **not** committed to the repo. A one-time preprocessing script (`scripts/process_data.py`) reads all files and outputs `public/events.json` — a clean, compact JSON file that the React app fetches on load.

```
player_data/  ← raw parquet files (gitignored)
  └── scripts/process_data.py  →  public/events.json  ←  React app
```

`events.json` is committed to the repo and served as a static asset (~15MB uncompressed, ~3MB with Vercel's automatic gzip).

---

## Environment Variables

None. The tool is fully static — no API keys, no backend, no secrets.

---

## Feature Walkthrough

1. **Select a map** using the three buttons in the sidebar (Ambrose Valley selected by default)
2. **Choose a date** from the dropdown (Feb 10 has the most data)
3. **Choose a match** — matches are sorted by event count, busiest first. The stat line shows human/bot/event counts.
4. **Player paths** appear on the minimap — blue = human, orange = bot
5. **Event markers** are drawn on top: red ✕ = kill, circled ✕ = death, green square = loot, purple diamond = storm death
6. **Use the timeline** at the bottom to scrub or press ▶ to play the match from start to finish (always 30 seconds of real time for any match length)
7. **Enable a heatmap** (Traffic / Kills / Deaths) to see day-level aggregate patterns across all matches on that map and date. Toggle "Show paths over heatmap" to overlay both.
8. **Use Show/Hide toggles** to isolate specific player types or event categories

---

## Repository Structure

```
lila-player-journey/
├── public/
│   ├── events.json              # Pre-processed event data (89,104 rows)
│   └── minimaps/                # Minimap images for all 3 maps
├── scripts/
│   └── process_data.py          # One-time data preprocessing script
├── src/
│   ├── components/
│   │   ├── MapCanvas.jsx        # Canvas rendering (paths, markers, heatmap)
│   │   ├── Sidebar.jsx          # All filter controls
│   │   ├── Timeline.jsx         # Playback scrubber + usePlayback hook
│   │   └── Heatmap.js           # Custom heatmap kernel (no library)
│   ├── hooks/
│   │   └── useEvents.js         # Data loading + derived state
│   ├── App.jsx                  # Root component + state management
│   └── index.css                # All styles
├── ARCHITECTURE.md              # System design decisions
├── INSIGHTS.md                  # Three data insights with actionable items
└── README.md                    # This file
```
