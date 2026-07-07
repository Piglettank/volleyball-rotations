<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

type Props = {
  title: string
  icon?: string
}

defineProps<Props>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  close: []
}>()

function close() {
  open.value = false
  emit('close')
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
    <Transition name="confirm-dialog">
      <div v-if="open" class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="title">
        <div class="confirm-dialog__backdrop" aria-hidden="true" @click="close" />

        <div class="confirm-dialog__panel" @click.stop>
          <header class="confirm-dialog__header">
            <span v-if="icon" class="confirm-dialog__icon" aria-hidden="true">
              <v-icon :icon="icon" size="small" />
            </span>
            <h2 class="confirm-dialog__title">{{ title }}</h2>
          </header>

          <div class="confirm-dialog__body">
            <slot />
          </div>

          <footer v-if="$slots.actions" class="confirm-dialog__actions">
            <slot name="actions" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.confirm-dialog {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
}

.confirm-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(26, 42, 58, 0.52);
  backdrop-filter: blur(2px);
}

.confirm-dialog__panel {
  position: relative;
  width: min(22rem, 100%);
  border-radius: 0.875rem;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow:
    0 16px 40px rgba(26, 42, 58, 0.22),
    0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.confirm-dialog__header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1.1rem 1.25rem 0.5rem;
}

.confirm-dialog__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));

  :deep(.v-icon) {
    font-size: 0.875rem !important;
  }
}

.confirm-dialog__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: rgba(var(--v-theme-on-surface), 0.95);
}

.confirm-dialog__body {
  padding: 0.35rem 1.25rem 1.1rem;
  font-size: 0.9375rem;
  line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.72);

  :deep(p) {
    margin: 0;
  }

  :deep(strong) {
    font-weight: 700;
    color: rgba(var(--v-theme-on-surface), 0.92);
  }
}

.confirm-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0 1.25rem 1.15rem;
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 0.2s ease;

  .confirm-dialog__panel {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;

  .confirm-dialog__panel {
    opacity: 0;
    transform: translateY(0.5rem) scale(0.98);
  }
}
</style>

<style lang="scss">
.confirm-dialog__btn {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2.5rem;
  padding: 0.55rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;

  &:active {
    transform: scale(0.98);
  }

  &--ghost {
    background: transparent;
    border-color: rgba(var(--v-border-color), 0.45);
    color: rgba(var(--v-theme-on-surface), 0.72);

    &:hover {
      background: rgba(var(--v-border-color), 0.08);
      color: rgba(var(--v-theme-on-surface), 0.9);
    }
  }

  &--primary {
    background: rgb(var(--v-theme-primary));
    border-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));

    &:hover {
      filter: brightness(1.05);
    }
  }

  &--home {
    background: rgb(var(--v-theme-primary));
    border-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));

    &:hover {
      filter: brightness(1.05);
    }
  }

  &--away {
    background: rgb(var(--v-theme-error));
    border-color: rgb(var(--v-theme-error));
    color: rgb(var(--v-theme-on-error));

    &:hover {
      filter: brightness(1.05);
    }
  }
}
</style>
