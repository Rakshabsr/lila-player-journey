/**
 * Lightweight canvas heatmap — no external library needed.
 * Uses a radial gradient kernel blended over the minimap.
 */

const RADIUS = 30    // influence radius per event point (in 1024-unit space)
const BLUR   = 20    // gaussian-like softness

export function drawHeatmap(ctx, points, canvasNativeSize, mode) {
  if (points.length === 0) return

  const scale = canvasNativeSize / 1024

  // Offscreen canvas for accumulation
  const off = document.createElement('canvas')
  off.width  = canvasNativeSize
  off.height = canvasNativeSize
  const offCtx = off.getContext('2d')

  // Draw radial gradients for each point
  for (const [px, py] of points) {
    const x = px * scale
    const y = py * scale
    const r = RADIUS * scale

    const grad = offCtx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0,   'rgba(255,255,255,0.25)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.1)')
    grad.addColorStop(1,   'rgba(255,255,255,0)')

    offCtx.fillStyle = grad
    offCtx.beginPath()
    offCtx.arc(x, y, r, 0, Math.PI * 2)
    offCtx.fill()
  }

  // Colorize: map white intensity → color gradient
  const imgData = offCtx.getImageData(0, 0, canvasNativeSize, canvasNativeSize)
  const data    = imgData.data

  for (let i = 0; i < data.length; i += 4) {
    const intensity = data[i] / 255   // 0–1

    if (intensity < 0.01) {
      data[i + 3] = 0
      continue
    }

    const [r, g, b] = intensityToColor(intensity, mode)
    data[i]     = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = Math.min(255, intensity * 420)  // alpha
  }

  offCtx.putImageData(imgData, 0, 0)

  // Composite onto main canvas
  ctx.globalAlpha = 0.78
  ctx.drawImage(off, 0, 0, 1024, 1024)
  ctx.globalAlpha = 1
}

// Color ramp: cold (blue) → warm (yellow) → hot (red)
function intensityToColor(t, mode) {
  if (mode === 'traffic') {
    // Blue → cyan → green → yellow → red
    if (t < 0.25) return lerp([0, 0, 200],   [0, 200, 200], t / 0.25)
    if (t < 0.5)  return lerp([0, 200, 200],  [0, 220, 0],   (t - 0.25) / 0.25)
    if (t < 0.75) return lerp([0, 220, 0],    [255, 220, 0], (t - 0.5)  / 0.25)
    return           lerp([255, 220, 0],   [255, 30, 0],  (t - 0.75) / 0.25)
  }
  if (mode === 'kills') {
    // Black → dark red → red → orange → yellow
    if (t < 0.33) return lerp([20, 0, 0],     [180, 0, 0],   t / 0.33)
    if (t < 0.66) return lerp([180, 0, 0],    [255, 100, 0], (t - 0.33) / 0.33)
    return           lerp([255, 100, 0],  [255, 240, 0], (t - 0.66) / 0.34)
  }
  // deaths: purple spectrum
  if (t < 0.33) return lerp([10, 0, 30],    [120, 0, 180],  t / 0.33)
  if (t < 0.66) return lerp([120, 0, 180],  [200, 50, 255], (t - 0.33) / 0.33)
  return           lerp([200, 50, 255], [255, 180, 255], (t - 0.66) / 0.34)
}

function lerp([r1, g1, b1], [r2, g2, b2], t) {
  return [
    Math.round(r1 + (r2 - r1) * t),
    Math.round(g1 + (g2 - g1) * t),
    Math.round(b1 + (b2 - b1) * t),
  ]
}
