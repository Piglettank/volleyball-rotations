const BALL_IMAGE_SRC = '/ball.png'

let cached: HTMLImageElement | null = null
let loadPromise: Promise<HTMLImageElement> | null = null

export function getBallImage(): HTMLImageElement | null {
  return cached
}

export function loadBallImage(): Promise<HTMLImageElement> {
  if (cached) {
    return Promise.resolve(cached)
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      cached = img
      resolve(img)
    }
    img.onerror = () => {
      loadPromise = null
      reject(new Error(`Failed to load ball image: ${BALL_IMAGE_SRC}`))
    }
    img.src = BALL_IMAGE_SRC
  })

  return loadPromise
}
