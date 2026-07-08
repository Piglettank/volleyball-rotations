<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useMatchStore } from '@/stores/match'
import RosterManager from '@/components/play/RosterManager.vue'

const open = defineModel<boolean>({ default: false })

const matchStore = useMatchStore()

const rosterPlayerIds = computed({
  get: () => matchStore.state?.config.rosterPlayerIds ?? [],
  set: (ids: string[]) => matchStore.setRosterPlayerIds(ids),
})

function close() {
  open.value = false
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) close()
}

watch(open, (isOpen) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onMounted(() => {
  document.addEventListener('keydown', onEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onEscape)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

// ── Swipe-right to dismiss ───────────────────────────────────────────────────

const dragOffset = ref(0)
const isDragging = ref(false)
let touchStartX = 0
let touchStartY = 0
let directionLocked = false

/** Minimum rightward drag (px) required to dismiss the drawer. */
const SWIPE_DISMISS_THRESHOLD = 80

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  touchStartX = t.clientX
  touchStartY = t.clientY
  dragOffset.value = 0
  isDragging.value = false
  directionLocked = false
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY

  // Wait until movement is large enough to determine intent
  if (!directionLocked) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    directionLocked = true
    // Vertical-dominant or leftward — let the content scroll normally
    if (Math.abs(dy) >= Math.abs(dx) || dx < 0) return
    isDragging.value = true
  }

  if (!isDragging.value) return

  e.preventDefault()
  dragOffset.value = dx
}

function onTouchEnd() {
  const offset = dragOffset.value
  isDragging.value = false
  dragOffset.value = 0
  directionLocked = false

  if (offset >= SWIPE_DISMISS_THRESHOLD) {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="roster-drawer">
      <div v-if="open" class="roster-drawer" role="dialog" aria-modal="true" aria-label="Players">
        <div class="roster-drawer__backdrop" aria-hidden="true" @click="close" />

        <aside
          class="roster-drawer__panel"
          :style="isDragging ? { transform: `translateX(${dragOffset}px)`, transition: 'none' } : {}"
          @click.stop
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <header class="roster-drawer__header">
            <h2 class="roster-drawer__title">Players</h2>
            <button type="button" class="roster-drawer__close" aria-label="Close" @click="close">
              <v-icon icon="fas fa-xmark" size="small" />
            </button>
          </header>

          <div class="roster-drawer__content">
            <RosterManager v-model:selected-player-ids="rosterPlayerIds" />
          </div>

          <footer class="roster-drawer__footer">
            <button type="button" class="roster-drawer__done" @click="close">
              Done
            </button>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
$drawer-width: min(28rem, 100%);
$desktop-breakpoint: 720px;

.roster-drawer {
  position: fixed;
  inset: 0;
  z-index: 300;
}

.roster-drawer__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}

.roster-drawer__panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: $drawer-width;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
}

.roster-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
}

.roster-drawer__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.2;
}

.roster-drawer__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.65);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(var(--v-border-color), 0.1);
    color: rgba(var(--v-theme-on-surface), 0.95);
  }
}

.roster-drawer__content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1rem 1.5rem;
}

.roster-drawer__footer {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.roster-drawer__done {
  width: 100%;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: none;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s;

  &:hover {
    filter: brightness(1.07);
  }

  &:active {
    filter: brightness(0.95);
  }
}

// Backdrop fade
.roster-drawer-enter-active,
.roster-drawer-leave-active {
  transition: opacity 0.25s ease;

  .roster-drawer__backdrop {
    transition: opacity 0.25s ease;
  }

  .roster-drawer__panel {
    transition: transform 0.25s ease;
  }
}

.roster-drawer-enter-from,
.roster-drawer-leave-to {
  opacity: 1;

  .roster-drawer__backdrop {
    opacity: 0;
  }

  .roster-drawer__panel {
    transform: translateX(100%);
  }
}

@media (min-width: $desktop-breakpoint) {
  .roster-drawer__panel {
    width: min(28rem, 42vw);
  }
}
</style>
