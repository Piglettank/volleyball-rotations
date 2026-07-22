<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import Court from '@/components/court/Court.vue'
import ControlsPanel from '@/components/ControlsPanel.vue'
import { COURT_COLORS, type ViewMode } from '@/components/court/courtGeometry'
import { ROTATIONS_CAMERA_3D } from '@/components/court/courtProjection'
import { useRotationUrlSync } from '@/composables/useRotationUrlSync'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()

const playerStore = usePlayerStore()
const { shareLoadError } = useRotationUrlSync()

const viewMode = ref<ViewMode>('3d')
const controlsPanelVisible = ref(true)
const importStatus = ref('')

const courtAreaColor = COURT_COLORS.outside

const statusMessage = computed(() => importStatus.value || shareLoadError.value)
</script>

<template>
  <v-main class="rotations-main">
    <Teleport to="body">
      <button
        v-if="controlsPanelVisible"
        class="rotations-mobile-back"
        type="button"
        aria-label="Back to home"
        @click="router.push({ name: 'home' })"
      >
        <v-icon icon="fas fa-chevron-left" />
      </button>
    </Teleport>

    <div class="workspace">
      <section class="court-area" :class="{ 'court-area--3d': viewMode === '3d' }">
        <div class="court-stage">
          <Court
            v-model:view-mode="viewMode"
            v-model:controls-panel-visible="controlsPanelVisible"
            class="court-fill"
            :initial-camera3-d="ROTATIONS_CAMERA_3D"
            :formation-key="playerStore.formationAnimationKey"
            :ball-placement="playerStore.ballPlacement"
            :players="playerStore.playersOnCourt"
            @player-coordinate-change="
              playerStore.setActiveCoordinate($event.playerId, $event.coordinate)
            "
          />
        </div>

        <v-alert
          v-if="statusMessage"
          class="import-alert"
          density="compact"
          type="info"
          variant="tonal"
        >
          {{ statusMessage }}
        </v-alert>
      </section>

      <ControlsPanel v-show="controlsPanelVisible" @import-status="importStatus = $event">
        <template #bottom>
          <button
            class="rotations-back-btn"
            type="button"
            aria-label="Back to home"
            @click="router.push({ name: 'home' })"
          >
            <v-icon icon="fas fa-chevron-left" />
            <span>Back</span>
          </button>
        </template>
      </ControlsPanel>
    </div>
  </v-main>
</template>

<style scoped lang="scss">
$desktop-breakpoint: 801px;

.rotations-main {
  height: 100dvh;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
}

.rotations-mobile-back {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: max(0.75rem, env(safe-area-inset-top, 0.75rem));
  left: max(0.75rem, env(safe-area-inset-left, 0.75rem));
  z-index: 50;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(6px);
  color: rgba(var(--v-theme-on-surface), 0.75);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);

  :deep(.v-icon) {
    font-size: 0.875rem !important;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.92);
    color: rgba(var(--v-theme-on-surface), 0.95);
  }
}

@media (min-width: $desktop-breakpoint) {
  .rotations-mobile-back {
    display: none;
  }
}

// Desktop only
.rotations-back-btn {
  display: none;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-size: 0.9375rem;
  font-weight: 400;
  cursor: pointer;
  border-radius: 0.375rem;
  transition:
    color 0.15s,
    background 0.15s;
  align-self: flex-start;

  :deep(.v-icon) {
    font-size: 0.75rem !important;
  }

  &:hover {
    color: rgba(var(--v-theme-on-surface), 0.75);
    background: rgba(var(--v-border-color), 0.08);
  }
}

@media (min-width: $desktop-breakpoint) {
  .rotations-back-btn {
    display: inline-flex;
  }
}

.workspace {
  display: flex;
  height: 100%;
  min-height: 0;
}

.court-area {
  flex: 1;
  background-color: v-bind(courtAreaColor);
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 0.5rem;
}

.court-stage {
  flex: 1;
  width: 100%;
  min-height: 0;
  display: flex;
}

.court-fill {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.import-alert {
  margin-top: 0.75rem;
  max-width: 24rem;
}

.court-area--3d {
  padding: 0;
}

@media (min-width: $desktop-breakpoint) {
  .workspace {
    flex-direction: row;
  }

  .court-area {
    padding: 0;
  }
}

@media (max-width: ($desktop-breakpoint - 1px)) {
  .workspace {
    flex-direction: column;
  }

  .court-area {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
}
</style>
