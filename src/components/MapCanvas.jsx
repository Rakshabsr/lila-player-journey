import { useEffect, useRef, useMemo } from 'react'

const MAP_IMAGES = {
  AmbroseValley: '/minimaps/AmbroseValley_Minimap.png',
  GrandRift:     '/minimaps/GrandRift_Minimap.png',
  Lockdown:      '/minimaps/Lockdown_Minimap.jpg',
}

// Canvas fills available height minus header (52px) minus padding (40px)
const CANVAS_SIZE = Math.min(
  typeof window !== 'undefined' ? window.innerHeight - 92 : 700,
  700
)
const SCALE = CANVAS_SIZE / 1024

// Marker drawing helpers
function drawX(ctx, x, y, size, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.globalAlpha = 0.95
  ctx.beginPath()
  ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size)
  ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size)
  ctx.stroke()
}

function drawDiamond(ctx, x, y, size, color) {
  ctx.fillStyle = color
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x + size, y)
  ctx.lineTo(x, y + size)
  ctx.lineTo(x - size, y)
  ctx.closePath()
  ctx.fill()
}

function drawCircle(ctx, x, y, r, color) {
  ctx.fillStyle = color
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function drawSquare(ctx, x, y, size, color) {
  ctx.fillStyle = color
  ctx.globalAlpha = 0.85
  ctx.fillRect(x - size, y - size, size * 2, size * 2)
}

const EVENT_RENDERERS = {
  Kill:          (ctx, x, y) => drawX(ctx, x, y, 5, '#f85149'),
  Killed:        (ctx, x, y) => { drawCircle(ctx, x, y, 5, '#f85149'); drawX(ctx, x, y, 4, '#fff') },
  BotKill:       (ctx, x, y) => drawX(ctx, x, y, 5, '#d29922'),
  BotKilled:     (ctx, x, y) => { drawCircle(ctx, x, y, 5, '#d29922'); drawX(ctx, x, y, 4, '#fff') },
  KilledByStorm: (ctx, x, y) => drawDiamond(ctx, x, y, 6, '#bc8cff'),
  Loot:          (ctx, x, y) => drawSquare(ctx, x, y, 4, '#3fb950'),
}

export function MapCanvas({ events, filters }) {
  const canvasRef = useRef(null)

  // Separate position events (paths) from action events (markers)
  const { paths, markers } = useMemo(() => {
    const playerPositions = {}
    const markers = []

    for (const e of events) {
      if (e.evt === 'Position' || e.evt === 'BotPosition') {
        if (!playerPositions[e.uid]) playerPositions[e.uid] = []
        playerPositions[e.uid].push(e)
      } else {
        markers.push(e)
      }
    }

    return { paths: playerPositions, markers }
  }, [events])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Handle high-DPI screens
    const dpr = window.devicePixelRatio || 1
    canvas.width  = CANVAS_SIZE * dpr
    canvas.height = CANVAS_SIZE * dpr
    canvas.style.width  = CANVAS_SIZE + 'px'
    canvas.style.height = CANVAS_SIZE + 'px'
    ctx.scale(dpr * SCALE, dpr * SCALE)   // now all coords are in 0-1024 space

    const img = new Image()
    img.src = MAP_IMAGES[filters.map]
    img.onload = () => {
      // 1. Draw minimap background
      ctx.globalAlpha = 1
      ctx.drawImage(img, 0, 0, 1024, 1024)

      // 2. Dark overlay to make paths pop
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.globalAlpha = 1
      ctx.fillRect(0, 0, 1024, 1024)

      // 3. Draw player paths
      for (const [uid, posEvents] of Object.entries(paths)) {
        const isBot = posEvents[0].bot === 1
        if (isBot && !filters.showBots)    continue
        if (!isBot && !filters.showHumans) continue

        const sorted = [...posEvents].sort((a, b) => a.ts - b.ts)

        ctx.beginPath()
        ctx.strokeStyle = isBot ? '#f0883e' : '#58a6ff'
        ctx.lineWidth   = 1.5
        ctx.globalAlpha = isBot ? 0.45 : 0.6
        ctx.lineJoin    = 'round'
        ctx.lineCap     = 'round'

        ctx.moveTo(sorted[0].px, sorted[0].py)
        for (let i = 1; i < sorted.length; i++) {
          ctx.lineTo(sorted[i].px, sorted[i].py)
        }
        ctx.stroke()

        // Draw start dot
        ctx.globalAlpha = 0.9
        ctx.fillStyle = isBot ? '#f0883e' : '#58a6ff'
        ctx.beginPath()
        ctx.arc(sorted[0].px, sorted[0].py, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // 4. Draw event markers on top
      ctx.globalAlpha = 1
      for (const e of markers) {
        if (!filters.visibleTypes.has(e.evt)) continue
        const renderer = EVENT_RENDERERS[e.evt]
        if (renderer) renderer(ctx, e.px, e.py)
      }
    }
  }, [paths, markers, filters])

  return (
    <div className="canvas-wrapper">
      <canvas ref={canvasRef} className="map-canvas" />
      {events.length === 0 && (
        <div className="canvas-empty">Select a match to visualize</div>
      )}
    </div>
  )
}
