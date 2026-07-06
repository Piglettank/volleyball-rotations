<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
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
</script>

<template>
  <Teleport to="body">
    <Transition name="roster-drawer">
      <div v-if="open" class="roster-drawer" role="dialog" aria-modal="true" aria-label="Players">
        <div class="roster-drawer__backdrop" aria-hidden="true" @click="close" />

        <aside class="roster-drawer__panel" @click.stop>
          <header class="roster-drawer__header">
            <h2 class="roster-drawer__title">Players</h2>
            <button type="button" class="roster-drawer__close" aria-label="Close" @click="close">
              <v-icon icon="fas fa-xmark" size="small" />
            </button>
          </header>

          <div class="roster-drawer__content">
            <RosterManager v-model:selected-player-ids="rosterPlayerIds" />
          </div>
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
