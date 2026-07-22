// HEROES is generated from `public/heroes` by `npm run heroes:sync` (also
// runs automatically before `dev` and `build`) — drop a file in that folder
// and re-run the app, no manual list editing required. The same pool is
// used for all screen sizes.
import { HEROES } from './heroesManifest'

export { HEROES }

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

/** Chosen once per page load so Home and Learn share the same hero image. */
let cachedHeroUrl: string | null = null

export function getHeroUrl(): string {
  if (!cachedHeroUrl) {
    cachedHeroUrl = encodeURI(pickRandom(HEROES))
  }
  return cachedHeroUrl
}
