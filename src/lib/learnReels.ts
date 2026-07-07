import type { LearnCategory } from './learnMenu'

export type ReelSource = 'instagram' | 'youtube' | 'tiktok'

export interface LearnReel {
  id: string
  url: string
  source?: ReelSource // optional: auto-detected from URL if omitted
}

export function parseReelSource(url: string): ReelSource {
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('tiktok.com')) return 'tiktok'
  return 'youtube'
}

export function extractYouTubeId(url: string): string | null {
  // Handles: youtube.com/shorts/ID, youtube.com/watch?v=ID, youtu.be/ID
  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

export function extractInstagramShortcode(url: string): string | null {
  // Matches /reel/SHORTCODE or /p/SHORTCODE
  const m = url.match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/)
  return m?.[1] ?? null
}

export function extractTikTokVideoId(url: string): string | null {
  // Matches both /video/ID and /photo/ID paths
  const m = url.match(/\/(?:video|photo)\/(\d+)/)
  return m?.[1] ?? null
}

export const learnReels: Record<LearnCategory, LearnReel[]> = {
  serve: [
    { id: 'serve-1', url: 'https://www.youtube.com/shorts/zCqJMsVWdBs' },
    { id: 'serve-2', url: 'https://www.youtube.com/shorts/O5u_kCNM3tY' },
  ],
  spike: [
    { id: 'spike-3', url: 'https://www.youtube.com/shorts/F6xUwlqjdGM' },
    { id: 'spike-4', url: 'https://www.tiktok.com/@_volleyvibes_/photo/7602771930235686166' },
    { id: 'spike-5', url: 'https://www.tiktok.com/@volleybratans/video/7317101969728916768' },
  ],
  set: [
    { id: 'set-1', url: 'https://www.youtube.com/shorts/6v0BWJSRFMM' },
    { id: 'set-2', url: 'https://www.youtube.com/shorts/k5o0yj5wJsA' },
  ],
  receive: [
    { id: 'receive-1', url: 'https://www.instagram.com/reel/DaU5UYTvVKJ/' },
    { id: 'receive-2', url: 'https://www.youtube.com/shorts/pJxrP5KPWCQ' },
  ],
  rotations: [],
}
