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
          <v-btn
            class="rotations-back-btn"
            variant="outlined"
            density="comfortable"
            aria-label="Back to learn menu"
            @click="router.push({ path: '/learn' })"
          >
            <span class="rotations-back-btn__content">
              <v-icon icon="fas fa-chevron-left" size="small" />
              <span class="rotations-back-btn__label">Back</span>
            </span>
          </v-btn>
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

// Desktop only
.rotations-back-btn {
  display: none;
  width: 100%;
  min-width: 0;
  height: auto !important;
  min-height: 3rem;
  padding: 0.65rem 1rem !important;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  border-color: rgba(var(--v-theme-on-surface), var(--v-field-border-opacity, 0.38)) !important;

  :deep(.v-btn__content) {
    flex: none;
    width: 100%;
  }

  :deep(.v-icon) {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
  }
}

@media (min-width: $desktop-breakpoint) {
  .rotations-back-btn {
    display: inline-flex;
  }
}

.rotations-back-btn__content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.65rem;
  width: 100%;
}

.rotations-back-btn__label {
  font-family: var(--font-sport-display);
  font-size: 1.375rem;
  letter-spacing: 0.04em;
  line-height: 1;
  transform: translateY(0.05em);
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
