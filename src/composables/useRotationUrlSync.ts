import { onMounted, onUnmounted, ref, watch } from 'vue'

import {
  FORMATION_QUERY,
  formationPayloadFromUrl,
  FREE_PLAY_GROUP_ID,
  ROTATION_QUERY,
  setFormationInUrl,
} from '@/lib/formationShare'
import { usePlayerStore } from '@/stores/player'

export { setFormationInUrl }

function rotationIdFromUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get(ROTATION_QUERY)?.trim()
  return id && id.length > 0 ? id : null
}

function replaceUrl(url: URL): void {
  const next = url.toString()
  if (next === window.location.href) {
    return
  }

  window.history.replaceState(window.history.state, '', url)
}

function syncRotationInUrl(rotationId: string, previousId?: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set(ROTATION_QUERY, rotationId)

  if (rotationId !== FREE_PLAY_GROUP_ID) {
    url.searchParams.delete(FORMATION_QUERY)
  } else if (previousId !== undefined && previousId !== FREE_PLAY_GROUP_ID) {
    url.searchParams.delete(FORMATION_QUERY)
  }

  replaceUrl(url)
}

/** Keeps `?rotation=<id>` in sync; reads `?p=` on load; writes `?p=` only via setFormationInUrl. */
export function useRotationUrlSync() {
  const playerStore = usePlayerStore()
  const shareLoadError = ref('')

  function applyRotationFromUrl(): void {
    const rotationId = rotationIdFromUrl()
    if (!rotationId) {
      return
    }

    playerStore.setActiveRotation(rotationId)
  }

  function applyFormationFromUrl(): boolean {
    const payload = formationPayloadFromUrl()
    if (!payload) {
      return false
    }

    if (playerStore.applyFreePlayShareString(payload)) {
      shareLoadError.value = ''
      return true
    }

    shareLoadError.value = 'Could not load formation from link'
    playerStore.setActiveRotation(FREE_PLAY_GROUP_ID)
    return true
  }

  function applyUrlState(): void {
    if (applyFormationFromUrl()) {
      return
    }

    shareLoadError.value = ''
    applyRotationFromUrl()
  }

  function onPopState() {
    applyUrlState()
  }

  watch(
    () => playerStore.currentRotationId,
    (rotationId, previousId) => {
      syncRotationInUrl(rotationId, previousId)
    },
  )

  watch(
    () => playerStore.formations,
    () => {
      applyUrlState()
    },
  )

  onMounted(() => {
    applyUrlState()
    syncRotationInUrl(playerStore.currentRotationId)
    window.addEventListener('popstate', onPopState)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState)
  })

  return { shareLoadError }
}
