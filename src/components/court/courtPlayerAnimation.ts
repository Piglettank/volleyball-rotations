import type { CourtCoordinate, PlayerModel } from '@/models/player'

export type PlayerCoordinateMap = Record<string, CourtCoordinate>

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function createPlayerPositionAnimator(durationMs = 450) {
  let displayCoords: PlayerCoordinateMap = {}
  let rafId: number | null = null

  function cancel() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function setImmediate(players: PlayerModel[]) {
    cancel()
    displayCoords = Object.fromEntries(
      players.map((player) => [player.id, { ...player.coordinate }]),
    )
  }

  function setPlayerCoordinate(playerId: string, coordinate: CourtCoordinate) {
    displayCoords[playerId] = { ...coordinate }
  }

  function animate(players: PlayerModel[], onFrame: () => void) {
    cancel()

    const targets = Object.fromEntries(
      players.map((player) => [player.id, player.coordinate]),
    )
    const from: PlayerCoordinateMap = {}

    for (const [playerId, target] of Object.entries(targets)) {
      from[playerId] = displayCoords[playerId]
        ? { ...displayCoords[playerId] }
        : { ...target }
    }

    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = easeOutCubic(progress)

      for (const [playerId, target] of Object.entries(targets)) {
        const origin = from[playerId]!
        displayCoords[playerId] = {
          x: origin.x + (target.x - origin.x) * eased,
          y: origin.y + (target.y - origin.y) * eased,
        }
      }

      onFrame()

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = null
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  function getDisplayPlayers(players: PlayerModel[]): PlayerModel[] {
    return players.map((player) => ({
      ...player,
      coordinate: displayCoords[player.id] ?? player.coordinate,
    }))
  }

  return {
    animate,
    cancel,
    getDisplayPlayers,
    setImmediate,
    setPlayerCoordinate,
  }
}
