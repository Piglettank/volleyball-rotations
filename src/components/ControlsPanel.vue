<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import { clearFormationFromUrl, setFormationInUrl } from '@/lib/formationShare'
import { featureFlags } from '@/config/featureFlags'
import { usePlayerStore } from '@/stores/player'

const emit = defineEmits<{
  importStatus: [message: string]
}>()

const playerStore = usePlayerStore()
const { activeGroupId, activeVariantId, visibleFormations } = storeToRefs(playerStore)

const importInputRef = ref<HTMLInputElement | null>(null)
const copiedTooltip = ref(false)

let copiedTooltipTimeout: ReturnType<typeof setTimeout> | null = null

const hasVariants = computed(() => (playerStore.activeVariantOptions.length ?? 0) > 0)

function showCopiedTooltip() {
  copiedTooltip.value = true
  if (copiedTooltipTimeout) {
    clearTimeout(copiedTooltipTimeout)
  }
  copiedTooltipTimeout = setTimeout(() => {
    copiedTooltip.value = false
    copiedTooltipTimeout = null
  }, 2000)
}

async function copyShareLink() {
  const encoded = playerStore.getFreePlayShareString()
  if (!encoded) {
    emit('importStatus', 'Could not encode formation')
    return
  }

  const url = setFormationInUrl(encoded)

  try {
    await navigator.clipboard.writeText(url)
    showCopiedTooltip()
  } catch {
    emit('importStatus', 'Could not copy link')
  }
}

onUnmounted(() => {
  if (copiedTooltipTimeout) {
    clearTimeout(copiedTooltipTimeout)
  }
})

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
  emit('importStatus', success ? `Imported ${file.name}` : `Could not import ${file.name}`)
  input.value = ''
}

function resetLayout() {
  playerStore.resetFreePlayLayout()
  clearFormationFromUrl()
}
</script>

<template>
  <v-sheet class="controls-panel" elevation="1" rounded="0">
    <h1 class="controls-panel__title">Rotations</h1>

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

    <div v-if="playerStore.isFreePlayActive" class="panel-section free-play-actions">
      <v-tooltip v-model="copiedTooltip" location="top" :open-on-hover="false">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            class="free-play-action-btn"
            variant="outlined"
            density="comfortable"
            @click="copyShareLink"
          >
            <span class="file-action-btn__content">
              <v-icon icon="fas fa-link" size="small" />
              <span class="file-action-btn__label">Copy link</span>
            </span>
          </v-btn>
        </template>
        Link copied
      </v-tooltip>

      <v-btn
        v-if="!featureFlags.layoutPersistence"
        class="free-play-action-btn"
        variant="outlined"
        density="comfortable"
        @click="resetLayout"
      >
        <span class="file-action-btn__content">
          <v-icon icon="fas fa-arrow-rotate-left" size="small" />
          <span class="file-action-btn__label">Reset</span>
        </span>
      </v-btn>
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
</template>

<style scoped lang="scss">
$desktop-breakpoint: 801px;

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  /* Match v-select outlined field border (VField outline opacity 0.38) */
  .file-action-btn.v-btn--variant-outlined,
  .free-play-action-btn.v-btn--variant-outlined,
  .variant-stepper-btn.v-btn--variant-outlined {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
    border-color: rgba(var(--v-theme-on-surface), var(--v-field-border-opacity, 0.38)) !important;
  }
}

.controls-panel__title {
  display: none;
  margin: 0;
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

.free-play-actions {
  flex-direction: row;
  gap: 0.5rem;
}

.file-action-btn,
.free-play-action-btn,
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

.free-play-action-btn {
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

@media (min-width: $desktop-breakpoint) {
  .controls-panel {
    order: -1;
    width: min(26rem, 42vw);
    flex-shrink: 0;
    justify-content: center;
    padding: 1.25rem;
    border-left: none;
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .controls-panel__title {
    display: block;
  }
}

@media (max-width: ($desktop-breakpoint - 1px)) {
  .controls-panel {
    order: 2;
    border-left: none;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding: 0.75rem;
  }
}
</style>
