import type { LearnCategory } from './learnMenu'

export const learnReels: Record<LearnCategory, LearnReel[]> = {
  serve: [
    { id: 'float-1', url: 'https://www.youtube.com/shorts/3rf0ZTwn7Hs' },
    { id: 'float-2', url: 'https://youtube.com/shorts/6MhG-1f2ymU' },
  ],
  receive: [
    // meme
    // { id: 'receive-1', url: 'https://www.instagram.com/reel/DaU5UYTvVKJ/' },
    { id: 'receive-2', url: 'https://youtube.com/shorts/vEEIQmABGys?si=4jCr8d89cPilm3Bc' },
    { id: 'receive-3-tips', url: 'https://youtube.com/shorts/x3UtIOTmNdc' },
  ],
  set: [
    { id: 'set-1', url: 'https://youtube.com/shorts/xNHfA2WbwvI?si=kjxXJvPKX8Hb3V3V' },
    { id: 'set-2', url: 'https://www.youtube.com/shorts/k5o0yj5wJsA' },
  ],
  spike: [
    { id: 'spike-1', url: 'https://www.youtube.com/shorts/yQzvbK93y58' },
    { id: '3-step-kids', url: 'https://www.youtube.com/shorts/Gdz_p2rUOvk' },
    { id: '3-step-side', url: 'https://youtube.com/shorts/Uw1XX3nfYNA?si=M0imxC9utWoJBVKs' },
    { id: '4-step', url: 'https://www.youtube.com/shorts/MjvH5Bf-Ep8' },
    { id: 'more-in-depth', url: 'https://youtube.com/shorts/HO4niF4eHwE?si=2xZVDaE_8qXuyt95' },
    { id: 'spike-4', url: 'https://www.tiktok.com/@_volleyvibes_/photo/7602771930235686166' },
    { id: 'spike-5', url: 'https://www.tiktok.com/@volleybratans/video/7317101969728916768' },
  ],
  rotations: [],
}

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
