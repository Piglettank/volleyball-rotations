<script setup lang="ts">
import { computed, ref } from 'vue'

import Court from '@/components/court/Court.vue'
import ControlsPanel from '@/components/ControlsPanel.vue'
import { COURT_COLORS, type ViewMode } from '@/components/court/courtGeometry'
import { useRotationUrlSync } from '@/composables/useRotationUrlSync'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
const { shareLoadError } = useRotationUrlSync()

const viewMode = ref<ViewMode>('2d')
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

      <ControlsPanel v-show="controlsPanelVisible" @import-status="importStatus = $event" />
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
