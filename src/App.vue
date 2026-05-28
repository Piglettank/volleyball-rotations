<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'

import Court from '@/components/court/Court.vue'
import { COURT_COLORS, type ViewMode } from '@/components/court/courtGeometry'
import { useRotationUrlSync } from '@/composables/useRotationUrlSync'
import { featureFlags } from '@/config/featureFlags'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
useRotationUrlSync()
const { activeGroupId, activeVariantId, visibleFormations } = storeToRefs(playerStore)

const viewMode = ref<ViewMode>('2d')
const importInputRef = ref<HTMLInputElement | null>(null)
const importStatus = ref('')

const hasVariants = computed(() => (playerStore.activeVariantOptions.length ?? 0) > 0)

const courtAreaColor = COURT_COLORS.outside

function exportLayouts() {
  const content = playerStore.exportLibraryJson()
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'volleyball-formations.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

function openImportPicker() {
  importInputRef.value?.click()
}

async function importLayouts(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const content = await file.text()
  const success = playerStore.importLibraryJson(content)
  importStatus.value = success ? `Imported ${file.name}` : `Could not import ${file.name}`
  input.value = ''
}
</script>

<template>
  <v-app>
    <v-main class="app-main">
      <div class="workspace">
        <section class="court-area" :class="{ 'court-area--3d': viewMode === '3d' }">
          <div class="court-stage">
            <Court
              v-model:view-mode="viewMode"
              class="court-fill"
              :formation-key="playerStore.currentRotationId"
              :ball-placement="playerStore.ballPlacement"
              :players="playerStore.playersOnCourt"
              @player-coordinate-change="
                playerStore.setActiveCoordinate($event.playerId, $event.coordinate)
              "
            />
          </div>

          <v-alert
            v-if="featureFlags.layoutPersistence && importStatus"
            class="import-alert"
            density="compact"
            type="info"
            variant="tonal"
          >
            {{ importStatus }}
          </v-alert>
        </section>

        <v-sheet class="controls-panel" elevation="1" rounded="0">
          <div class="app-logo">
            <img class="app-logo__icon" src="/favicon.ico" alt="" width="44" height="44" />
            <span class="app-logo__title">Volleyball rotations</span>
          </div>

          <div class="panel-section formation-row">
            <v-select
              class="formation-row__group"
              :model-value="activeGroupId"
              :items="visibleFormations"
              item-title="name"
              item-value="id"
              density="comfortable"
              hide-details
              variant="outlined"
              @update:model-value="playerStore.setActiveGroup"
            />

            <div v-if="hasVariants" class="formation-row__variant-controls">
              <v-select
                class="formation-row__variant"
                :model-value="activeVariantId"
                :items="playerStore.activeVariantOptions"
                item-title="name"
                item-value="id"
                density="comfortable"
                hide-details
                variant="outlined"
                @update:model-value="playerStore.setActiveVariant"
              />
              <div class="formation-row__stepper-buttons">
                <v-btn
                  class="variant-stepper-btn"
                  variant="outlined"
                  density="comfortable"
                  aria-label="Previous rotation"
                  @click="playerStore.stepActiveVariant(-1)"
                >
                  <v-icon icon="fas fa-rotate-left" size="small" />
                </v-btn>
                <v-btn
                  class="variant-stepper-btn"
                  variant="outlined"
                  density="comfortable"
                  aria-label="Next rotation"
                  @click="playerStore.stepActiveVariant(1)"
                >
                  <v-icon icon="fas fa-rotate-right" size="small" />
                </v-btn>
              </div>
            </div>
          </div>

          <template v-if="featureFlags.layoutPersistence">
            <div class="panel-section file-actions">
              <v-btn
                class="file-action-btn"
                variant="outlined"
                density="comfortable"
                @click="playerStore.saveCurrentLayout()"
              >
                <span class="file-action-btn__content">
                  <v-icon icon="fas fa-floppy-disk" size="small" />
                  <span class="file-action-btn__label">Save</span>
                </span>
              </v-btn>
              <v-btn
                class="file-action-btn"
                variant="outlined"
                density="comfortable"
                @click="exportLayouts"
              >
                <span class="file-action-btn__content">
                  <v-icon icon="fas fa-download" size="small" />
                  <span class="file-action-btn__label">Export</span>
                </span>
              </v-btn>
              <v-btn
                class="file-action-btn"
                variant="outlined"
                density="comfortable"
                @click="openImportPicker"
              >
                <span class="file-action-btn__content">
                  <v-icon icon="fas fa-upload" size="small" />
                  <span class="file-action-btn__label">Import</span>
                </span>
              </v-btn>
            </div>

            <input
              ref="importInputRef"
              class="hidden-input"
              type="file"
              accept="application/json"
              @change="importLayouts"
            />
          </template>
        </v-sheet>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped lang="scss">
$desktop-breakpoint: 801px;

.app-main {
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

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  /* Match v-select outlined field border (VField outline opacity 0.38) */
  .file-action-btn.v-btn--variant-outlined,
  .variant-stepper-btn.v-btn--variant-outlined {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
    border-color: rgba(var(--v-theme-on-surface), var(--v-field-border-opacity, 0.38)) !important;
  }
}

.app-logo {
  display: none;
  align-items: center;
  gap: 0.75rem;
}

.app-logo__icon {
  flex-shrink: 0;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
}

.app-logo__title {
  font-family: var(--font-sport-display);
  font-size: 1.875rem;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.03em;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.formation-row {
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
}

.formation-row__group {
  width: 100%;
}

.formation-row__variant-controls {
  --variant-stepper-size: 2.875rem;
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
}

.formation-row__variant {
  flex: 1;
  min-width: 0;
}

.formation-row__stepper-buttons {
  display: flex;
  flex-shrink: 0;
  gap: 0.25rem;
}

.file-actions {
  flex-direction: row;
  gap: 0.5rem;
}

.file-action-btn,
.variant-stepper-btn {
  :deep(.v-btn__content) {
    flex: none;
  }
}

.variant-stepper-btn {
  height: var(--variant-stepper-size) !important;
  min-height: var(--variant-stepper-size) !important;
  max-height: var(--variant-stepper-size) !important;
  width: var(--variant-stepper-size) !important;
  min-width: var(--variant-stepper-size) !important;
  padding: 0;
}

.file-action-btn {
  flex: 1;
  min-width: 0;
  height: auto;
  padding: 0.4rem 0.25rem;
}

.file-action-btn__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.file-action-btn__label {
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.01em;
}

.hidden-input {
  display: none;
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

  .controls-panel {
    order: -1;
    width: min(26rem, 42vw);
    flex-shrink: 0;
    justify-content: center;
    padding: 1.25rem;
    border-left: none;
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .app-logo {
    display: flex;
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

  .controls-panel {
    order: 2;
    border-left: none;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding: 0.75rem;
  }
}
</style>
