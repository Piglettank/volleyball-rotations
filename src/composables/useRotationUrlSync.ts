import { onMounted, onUnmounted, watch } from 'vue'

import { usePlayerStore } from '@/stores/player'

const ROTATION_QUERY = 'rotation'

function rotationIdFromUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get(ROTATION_QUERY)?.trim()
  return id && id.length > 0 ? id : null
}

function setRotationInUrl(rotationId: string): void {
  const url = new URL(window.location.href)
  if (url.searchParams.get(ROTATION_QUERY) === rotationId) {
    return
  }

  url.searchParams.set(ROTATION_QUERY, rotationId)
  window.history.replaceState(window.history.state, '', url)
}

/** Keeps `?rotation=<id>` in sync with the active formation (shareable deep links). */
export function useRotationUrlSync(): void {
  const playerStore = usePlayerStore()

  function applyRotationFromUrl(): void {
    const rotationId = rotationIdFromUrl()
    if (!rotationId) {
      return
    }

    playerStore.setActiveRotation(rotationId)
  }

  function onPopState() {
    applyRotationFromUrl()
  }

  watch(
    () => playerStore.currentRotationId,
    (rotationId) => {
      setRotationInUrl(rotationId)
    },
  )

  watch(
    () => playerStore.formations,
    () => {
      applyRotationFromUrl()
    },
  )

  onMounted(() => {
    applyRotationFromUrl()
    setRotationInUrl(playerStore.currentRotationId)
    window.addEventListener('popstate', onPopState)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState)
  })
}
