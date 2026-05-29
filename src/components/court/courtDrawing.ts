export type DrawPoint = {
  nx: number
  ny: number
}

export type DrawStroke = DrawPoint[]

export type DrawPaintOptions = {
  color?: string
  lineWidth?: number
}

const DEFAULT_COLOR = '#d32f2f'
const DEFAULT_LINE_WIDTH = 3

function toPixel(point: DrawPoint, width: number, height: number) {
  return {
    x: point.nx * width,
    y: point.ny * height,
  }
}

export function normalizeDrawPoint(x: number, y: number, width: number, height: number): DrawPoint {
  if (width <= 0 || height <= 0) {
    return { nx: 0, ny: 0 }
  }

  return {
    nx: Math.min(Math.max(x / width, 0), 1),
    ny: Math.min(Math.max(y / height, 0), 1),
  }
}

export function paintStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: DrawStroke[],
  width: number,
  height: number,
  options: DrawPaintOptions = {},
) {
  const color = options.color ?? DEFAULT_COLOR
  const lineWidth = options.lineWidth ?? DEFAULT_LINE_WIDTH

  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const stroke of strokes) {
    if (stroke.length < 2) {
      continue
    }

    const first = toPixel(stroke[0]!, width, height)
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)

    for (let index = 1; index < stroke.length; index += 1) {
      const point = toPixel(stroke[index]!, width, height)
      ctx.lineTo(point.x, point.y)
    }

    ctx.stroke()
  }
}
