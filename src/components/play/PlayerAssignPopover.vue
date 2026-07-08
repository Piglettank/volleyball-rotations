<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useMatchStore } from '@/stores/match'
import { useProfileStore } from '@/stores/profile'
import { ROLE_DISPLAY } from '@/lib/matchRotation'
import type { TeamSide } from '@/models/match'

type Props = {
  team: TeamSide
  roleId: string
  roleName: string
  anchorX: number
  anchorY: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  openPlayers: []
}>()

const matchStore = useMatchStore()
const profileStore = useProfileStore()

const popoverRef = ref<HTMLElement | null>(null)

const rosterPlayers = computed(() => {
  const ids = matchStore.state?.config.rosterPlayerIds ?? []
  return ids
    .map((id) => profileStore.getPlayerById(id))
    .filter((p): p is NonNullable<typeof p> => p != null)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
})

// Reverse map: playerId → roleId they're already on for this team (excluding this slot)
const takenByOther = computed<Record<string, string>>(() => {
  const assignments =
    props.team === 'home'
      ? matchStore.state?.homeAssignments
      : matchStore.state?.awayAssignments
  if (!assignments) return {}
  const result: Record<string, string> = {}
  for (const [roleId, playerId] of Object.entries(assignments)) {
    if (playerId && roleId !== props.roleId) {
      result[playerId] = roleId
    }
  }
  return result
})

function takenRoleName(roleId: string): string {
  return ROLE_DISPLAY[roleId]?.name ?? roleId
}

const listItems = computed(() => [
  { title: 'Unassigned', value: null as string | null, takenRoleId: null as string | null },
  ...rosterPlayers.value.map((player) => ({
    title: player.name,
    value: player.id,
    takenRoleId: takenByOther.value[player.id] ?? null,
  })),
])

const currentAssignment = computed(() => {
  const assignments =
    props.team === 'home'
      ? matchStore.state?.homeAssignments
      : matchStore.state?.awayAssignments
  return assignments?.[props.roleId] ?? null
})

const selectedValue = ref<string | null>(currentAssignment.value)

watch(currentAssignment, (val) => {
  selectedValue.value = val
})

function onSelect(value: string | null) {
  matchStore.assignPlayer(props.team, props.roleId, value)
  emit('close')
}

// Computed position, flipped from viewport edge
const style = computed(() => {
  const x = props.anchorX
  const y = props.anchorY
  const vw = window.innerWidth
  const vh = window.innerHeight
  const popW = 220
  const popH = 260

  const left = x + popW > vw ? Math.max(0, x - popW) : x
  const top = y + popH > vh ? Math.max(0, y - popH) : y

  return {
    position: 'fixed' as const,
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 200,
  }
})

function onOutsideClick(e: MouseEvent) {
  if (popoverRef.value && !popoverRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('pointerdown', onOutsideClick)
  document.addEventListener('keydown', onEscape)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onOutsideClick)
  document.removeEventListener('keydown', onEscape)
})
</script>

<template>
  <div ref="popoverRef" class="assign-popover" :style="style">
    <div class="assign-popover__header">
      <span class="assign-popover__role">{{ roleName }}</span>
      <v-btn icon="fas fa-xmark" variant="plain" size="x-small" aria-label="Close" @click="emit('close')" />
    </div>

    <v-list density="compact" class="assign-popover__list">
      <v-list-item
        v-for="item in listItems"
        :key="item.value ?? '__unassigned'"
        :value="item.value"
        :active="selectedValue === item.value"
        active-color="primary"
        @click="onSelect(item.value)"
      >
        <v-list-item-title class="assign-popover__item-row">
          <span>{{ item.title }}</span>
          <span v-if="item.takenRoleId" class="assign-popover__taken-badge">
            {{ takenRoleName(item.takenRoleId) }}
          </span>
        </v-list-item-title>
      </v-list-item>

    </v-list>

    <div class="assign-popover__footer">
      <button
        type="button"
        class="assign-popover__open-players-btn"
        @click="emit('openPlayers')"
      >
        + Add players
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.assign-popover {
  width: 220px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.assign-popover__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.assign-popover__role {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

.assign-popover__list {
  max-height: 220px;
  overflow-y: auto;
  padding: 0.25rem 0;
}

.assign-popover__item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
}

.assign-popover__taken-badge {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(var(--v-theme-on-surface), 0.45);
  white-space: nowrap;
}

.assign-popover__footer {
  padding: 0.35rem 0.75rem 0.5rem;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.assign-popover__open-players-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.45);
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: rgba(var(--v-theme-on-surface), 0.75);
  }
}
</style>
