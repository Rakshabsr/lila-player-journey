# Architecture — LILA Player Journey Visualization Tool

## What I Built and Why

A **fully client-side React web app** that loads pre-processed event data and renders it on an HTML Canvas over minimap images. No backend, no database — just a static deploy on Vercel.

**Why no backend?** The raw data is 1,243 parquet files (~33MB). A one-time Python preprocessing script consolidates them into a single `events.json` (~15MB, ~3MB gzip-compressed). This file is served as a static asset. The browser loads it once, then all filtering and rendering happens in-memory. This means:
- Zero server costs (fits Vercel free tier)
- No latency on filter/match changes (instant redraws)
- No moving parts to break

---

## Data Flow

```
1,243 .nakama-0 files (Parquet, ~33MB raw)
  └── scripts/process_data.py  [run once locally]
       ├── Reads each file with pyarrow
       ├── Decodes event bytes → UTF-8 strings
       ├── Detects human vs bot from filename (UUID = human, numeric = bot)
       ├── Normalises timestamps: ts_min subtracted per file → seconds from match start
       ├── Converts world (x, z) → minimap pixel coords (0–1024)
       └── Outputs public/events.json  (89,104 rows, ~15MB)

Browser loads /events.json on first visit
  └── React state (useEvents hook)
       ├── Filtered by: map + date → available matches
       ├── Filtered by: map + match → matchEvents (paths, markers, timeline)
       ├── Filtered by: map + date  → dayEvents (heatmap aggregate)
       └── HTML Canvas (MapCanvas component)
            ├── Minimap image (background)
            ├── Player paths (Position/BotPosition events, sorted by ts)
            ├── Event markers (Kill, Death, Loot, Storm)
            └── Heatmap overlay (Heatmap.js — custom radial gradient kernel)
```

---

## Coordinate Mapping — The Tricky Part

Each map has a `scale` and `origin (x, z)` defined in the README. World coordinates from the game engine are mapped to 1024×1024 minimap pixel space using:

```
u       = (world_x - origin_x) / scale
v       = (world_z - origin_z) / scale
pixel_x = u × 1024
pixel_y = (1 - v) × 1024      ← Y axis is FLIPPED (image origin is top-left)
```

**Note:** The `y` column in the data is elevation (3D height), not a map coordinate. Only `x` and `z` are used for 2D plotting.

| Map           | Scale | Origin X | Origin Z |
|---------------|-------|----------|----------|
| AmbroseValley | 900   | −370     | −473     |
| GrandRift     | 581   | −290     | −290     |
| Lockdown      | 1000  | −500     | −500     |

---

## Data Nuances Encountered

| Nuance | What Happened | How I Handled It |
|--------|--------------|-----------------|
| **Timestamp unit mismatch** | Parquet column is typed `timestamp[ms]` but values are Unix timestamps in **seconds**, not ms. A "729-unit" diff = 12.9 min match, not 729ms. | Timeline displays in MM:SS treating ts delta as seconds |
| **event column stored as bytes** | `b'Position'` not `"Position"` — raw parquet readers return binary | Decoded with `.decode('utf-8')` in preprocessing script |
| **No .parquet file extension** | Files named `{user_id}_{match_id}.nakama-0` — tools that rely on extension fail silently | Pass filepath directly to `pq.read_table()` |
| **y = elevation, not map Y** | Data has x, y, z but y is height in 3D space | Used x and z only for all 2D coordinate mapping |
| **Bot detection from filename** | No in-file flag needed — UUID user_id = human, numeric = bot | Parse filename before opening the parquet file |
| **February 14 is partial** | Only 79 files vs 400+ on other days | Noted in UI; no special treatment needed |

---

## Major Tradeoffs

| Decision | Chosen | Alternative | Why |
|----------|--------|-------------|-----|
| **Data loading** | Pre-process to JSON once | Parse parquet in browser (DuckDB-WASM) | Simpler, no browser WASM complexity, no extension-detection issues |
| **Rendering** | HTML Canvas | SVG or WebGL | Canvas handles 1K+ elements without DOM overhead; SVG would be slow at scale |
| **Heatmap** | Custom radial gradient kernel | heatmap.js library | Zero dependencies; full control over colour ramps per mode |
| **Hosting** | Vercel (static) | Railway / Render (server) | No backend = nothing to maintain or pay for |
| **Timeline scope** | One match at a time | Multi-match scrubber | Cleaner UX for level designers focused on specific match analysis |
| **Heatmap scope** | Full day aggregate | Per-match only | Day-level heatmap reveals structural map patterns better than single-match noise |
