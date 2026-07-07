<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { UNCATEGORIZED_FOLDER_ID } from '@/models/profile'
import ConfirmDialog from '@/components/play/ConfirmDialog.vue'

type Props = {
  selectedPlayerIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedPlayerIds: () => [],
})

const emit = defineEmits<{
  'update:selectedPlayerIds': [ids: string[]]
}>()

const profileStore = useProfileStore()

const newPlayerName = ref('')
const newFolderName = ref('')
const showAddFolder = ref(false)
const folderNameFieldRef = ref<{ focus: () => void; $el: HTMLElement } | null>(null)
const dragPlayerId = ref<string | null>(null)
const dragOverFolderId = ref<string | null>(null)
const suppressPlayerClick = ref(false)
const collapsedFolderIds = ref<Set<string>>(new Set())
const showDeleteFolderDialog = ref(false)
const folderPendingDelete = ref<{ id: string; name: string; playerCount: number } | null>(null)

function toggleFolderCollapsed(folderId: string) {
  const next = new Set(collapsedFolderIds.value)
  if (next.has(folderId)) {
    next.delete(folderId)
  } else {
    next.add(folderId)
  }
  collapsedFolderIds.value = next
}

function addPlayer() {
  const name = newPlayerName.value.trim()
  if (!name) return
  profileStore.addPlayer(name)
  newPlayerName.value = ''
}

function openAddFolder() {
  showAddFolder.value = true
}

watch(showAddFolder, async (visible) => {
  if (!visible) return
  await nextTick()
  folderNameFieldRef.value?.focus()
  const input = folderNameFieldRef.value?.$el.querySelector('input')
  if (input instanceof HTMLInputElement) {
    input.select()
  }
})

function addFolder() {
  const name = newFolderName.value.trim()
  if (!name) return
  profileStore.addFolder(name)
  newFolderName.value = ''
  showAddFolder.value = false
}

function removePlayer(id: string) {
  profileStore.removePlayer(id)
  const next = props.selectedPlayerIds.filter((pid) => pid !== id)
  emit('update:selectedPlayerIds', next)
}

function togglePlayerSelected(id: string) {
  const selected = props.selectedPlayerIds
  if (selected.includes(id)) {
    emit('update:selectedPlayerIds', selected.filter((pid) => pid !== id))
  } else {
    emit('update:selectedPlayerIds', [...selected, id])
  }
}

function onDragStart(playerId: string) {
  dragPlayerId.value = playerId
}

function onDragOver(folderId: string, event: DragEvent) {
  event.preventDefault()
  dragOverFolderId.value = folderId
}

function onDragLeave() {
  dragOverFolderId.value = null
}

function onDrop(targetFolderId: string, event: DragEvent) {
  event.preventDefault()
  if (dragPlayerId.value) {
    profileStore.movePlayerToFolder(dragPlayerId.value, targetFolderId)
  }
  dragPlayerId.value = null
  dragOverFolderId.value = null
}

function onDragEnd() {
  dragPlayerId.value = null
  dragOverFolderId.value = null
  suppressPlayerClick.value = true
  window.setTimeout(() => {
    suppressPlayerClick.value = false
  }, 0)
}

function onPlayerCardClick(playerId: string) {
  if (suppressPlayerClick.value) return
  togglePlayerSelected(playerId)
}

function requestRemoveFolder(folder: { id: string; name: string; players: unknown[] }) {
  if (folder.players.length === 0) {
    profileStore.removeFolder(folder.id)
    return
  }

  folderPendingDelete.value = {
    id: folder.id,
    name: folder.name,
    playerCount: folder.players.length,
  }
  showDeleteFolderDialog.value = true
}

function confirmRemoveFolder() {
  if (!folderPendingDelete.value) return
  profileStore.removeFolder(folderPendingDelete.value.id)
  folderPendingDelete.value = null
  showDeleteFolderDialog.value = false
}

function cancelRemoveFolder() {
  folderPendingDelete.value = null
  showDeleteFolderDialog.value = false
}

const foldersWithPlayers = computed(() =>
  profileStore.folders.map((folder) => ({
    ...folder,
    players: folder.playerIds
      .map((id) => profileStore.getPlayerById(id))
      .filter((p): p is NonNullable<typeof p> => p != null)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
  })),
)
</script>

<template>
  <div class="roster-manager">
    <div class="roster-manager__add-player">
      <label class="roster-manager__section-title" for="new-player-name">Add player</label>
      <div class="roster-manager__add-row">
        <v-text-field
          id="new-player-name"
          v-model="newPlayerName"
          placeholder="Player name"
          density="comfortable"
          variant="outlined"
          bg-color="white"
          hide-details
          class="roster-manager__add-field"
          @keydown.enter="addPlayer"
        />
        <v-btn
          variant="flat"
          color="primary"
          class="roster-manager__add-btn"
          :disabled="!newPlayerName.trim()"
          @click="addPlayer"
        >
          Add
        </v-btn>
      </div>
    </div>

    <div class="roster-manager__folders">
      <div
        v-for="folder in foldersWithPlayers"
        :key="folder.id"
        class="roster-manager__folder"
        :class="{ 'roster-manager__folder--drag-over': dragOverFolderId === folder.id }"
        @dragover="onDragOver(folder.id, $event)"
        @dragleave="onDragLeave"
        @drop="onDrop(folder.id, $event)"
      >
        <div class="roster-manager__folder-header">
          <button
            class="roster-manager__folder-toggle"
            :aria-expanded="!collapsedFolderIds.has(folder.id)"
            :aria-label="`${collapsedFolderIds.has(folder.id) ? 'Expand' : 'Collapse'} folder ${folder.name}`"
            @click="toggleFolderCollapsed(folder.id)"
          >
            <v-icon
              :icon="collapsedFolderIds.has(folder.id) ? 'fas fa-chevron-right' : 'fas fa-chevron-down'"
              size="small"
              class="roster-manager__chevron"
            />
            <span class="roster-manager__folder-name">{{ folder.name }}</span>
            <span class="roster-manager__folder-count">{{ folder.players.length }}</span>
          </button>
          <v-btn
            v-if="folder.id !== UNCATEGORIZED_FOLDER_ID"
            icon="fas fa-trash"
            variant="plain"
            size="small"
            :aria-label="`Remove folder ${folder.name}`"
            @click.stop="requestRemoveFolder(folder)"
          />
        </div>

        <template v-if="!collapsedFolderIds.has(folder.id)">
          <div v-if="folder.players.length === 0" class="roster-manager__empty">
            Drop players here
          </div>

          <div v-else class="roster-manager__players">
            <div
              v-for="player in folder.players"
              :key="player.id"
              class="roster-manager__player"
              :class="{ 'roster-manager__player--selected': selectedPlayerIds.includes(player.id) }"
              role="button"
              tabindex="0"
              draggable="true"
              @click="onPlayerCardClick(player.id)"
              @keydown.enter.prevent="togglePlayerSelected(player.id)"
              @keydown.space.prevent="togglePlayerSelected(player.id)"
              @dragstart="onDragStart(player.id)"
              @dragend="onDragEnd"
            >
              <v-checkbox
                :model-value="selectedPlayerIds.includes(player.id)"
                density="compact"
                hide-details
                tabindex="-1"
                class="roster-manager__checkbox"
              />
              <span class="roster-manager__player-name">{{ player.name }}</span>
              <v-btn
                icon="fas fa-xmark"
                variant="plain"
                size="x-small"
                class="roster-manager__remove-btn"
                :aria-label="`Remove ${player.name}`"
                @click.stop="removePlayer(player.id)"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="roster-manager__folder-actions">
      <template v-if="showAddFolder">
        <div class="roster-manager__field">
          <label class="roster-manager__section-title" for="new-folder-name">Add folder</label>
          <v-text-field
            id="new-folder-name"
            ref="folderNameFieldRef"
            v-model="newFolderName"
            placeholder="Folder name"
            density="comfortable"
            variant="outlined"
            bg-color="white"
            hide-details
            class="roster-manager__folder-field"
            @keydown.enter="addFolder"
          />
        </div>
        <div class="roster-manager__folder-form-actions">
          <v-btn
            variant="flat"
            color="primary"
            :disabled="!newFolderName.trim()"
            @click="addFolder"
          >
            Create
          </v-btn>
          <v-btn variant="outlined" @click="showAddFolder = false">Cancel</v-btn>
        </div>
      </template>
      <v-btn
        v-else
        class="roster-manager__add-folder-btn"
        variant="outlined"
        block
        prepend-icon="fas fa-folder-plus"
        @click="openAddFolder"
      >
        Add folder
      </v-btn>
    </div>

    <ConfirmDialog
      v-model="showDeleteFolderDialog"
      title="Delete folder?"
      icon="fas fa-folder-minus"
      @close="cancelRemoveFolder"
    >
      <p v-if="folderPendingDelete">
        Delete <strong>{{ folderPendingDelete.name }}</strong>?
        {{ folderPendingDelete.playerCount }}
        {{ folderPendingDelete.playerCount === 1 ? 'player' : 'players' }}
        will be moved to <strong>Players</strong>.
      </p>

      <template #actions>
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--ghost"
          @click="cancelRemoveFolder"
        >
          Cancel
        </button>
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--away"
          @click="confirmRemoveFolder"
        >
          Delete folder
        </button>
      </template>
    </ConfirmDialog>
  </div>
</template>

<style scoped lang="scss">
.roster-manager {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.roster-manager__add-player {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.roster-manager__section-title {
  display: block;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.roster-manager__add-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: stretch;
}

.roster-manager__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.roster-manager__add-field {
  min-width: 0;
}

.roster-manager__add-btn {
  min-width: 4rem;
  height: 100% !important;
}

.roster-manager__folders {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.roster-manager__folder {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 2px dashed transparent;
  border-radius: 0.5rem;
  transition: border-color 0.15s, background 0.15s;

  &--drag-over {
    border-color: rgba(var(--v-theme-primary), 0.5);
    background: rgba(var(--v-theme-primary), 0.04);
  }
}

.roster-manager__folder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 2rem;
}

.roster-manager__folder-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  color: inherit;

  &:hover .roster-manager__folder-name {
    color: rgba(var(--v-theme-on-surface), 0.9);
  }
}

.roster-manager__chevron {
  flex-shrink: 0;
  opacity: 0.55;
}

.roster-manager__folder-name {
  font-weight: 600;
  font-size: 0.9375rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.65);
  transition: color 0.15s;
}

.roster-manager__folder-count {
  flex-shrink: 0;
  min-width: 1.375rem;
  height: 1.375rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: rgba(var(--v-border-color), 0.12);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.375rem;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.roster-manager__empty {
  font-size: 0.9375rem;
  color: rgba(var(--v-theme-on-surface), 0.45);
  padding: 0.75rem 1rem;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.5rem;
  font-style: italic;
  text-align: center;
}

.roster-manager__players {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.roster-manager__player {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2.375rem;
  padding: 0.2rem 0.5rem 0.2rem 0.35rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.4375rem;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(var(--v-theme-on-surface), 0.22);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  &--selected {
    border-color: rgba(var(--v-theme-primary), 0.3);
    background: rgb(var(--v-theme-accent));
  }
}

.roster-manager__checkbox {
  flex-shrink: 0;
  pointer-events: none;
}

.roster-manager__player-name {
  flex: 1;
  min-width: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.25;
}

.roster-manager__remove-btn {
  flex-shrink: 0;
  opacity: 0.45;

  &:hover {
    opacity: 1;
  }
}

.roster-manager__folder-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.roster-manager__folder-field {
  width: 100%;
}

.roster-manager__folder-form-actions {
  display: flex;
  gap: 0.5rem;
}

.roster-manager__add-folder-btn {
  height: 2.75rem !important;
  font-size: 0.9375rem;
  font-weight: 600;
  border-color: rgba(var(--v-theme-on-surface), var(--v-field-border-opacity, 0.38)) !important;
}
</style>
