import { ref, onMounted, onUnmounted } from 'vue'
import type { PlayCourtOrientation } from '@/lib/courtPlayLayout'

const QUERY = '(max-width: 640px) and (orientation: portrait)'

function resolveOrientation(): PlayCourtOrientation {
  // Always use horizontal for now
  return 'horizontal'
}

/**
 * Returns a reactive `PlayCourtOrientation` that is `'vertical'` when the
 * viewport is in portrait mode at ≤640px, and `'horizontal'` otherwise.
 */
export function usePlayCourtOrientation() {
  const orientation = ref<PlayCourtOrientation>(resolveOrientation())

  let mq: MediaQueryList | null = null

  function update() {
    orientation.value = resolveOrientation()
  }

  onMounted(() => {
    orientation.value = resolveOrientation()
    mq = window.matchMedia(QUERY)
    mq.addEventListener('change', update)
  })

  onUnmounted(() => {
    mq?.removeEventListener('change', update)
  })

  return orientation
}
