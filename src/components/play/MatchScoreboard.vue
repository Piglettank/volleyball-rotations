<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useMatchStore } from '@/stores/match'
import type { TeamSide } from '@/models/match'
import { rotationLabel, teamOnLeft, teamOnRight } from '@/models/match'

const matchStore = useMatchStore()
const s = computed(() => matchStore.state!)

const leftTeam = computed(() => teamOnLeft(s.value.sidesSwapped))
const rightTeam = computed(() => teamOnRight(s.value.sidesSwapped))
const isPlanning = computed(() => matchStore.canAdjustRotation)

function teamName(team: TeamSide) {
  return team === 'home' ? s.value.config.homeTeamName : s.value.config.awayTeamName
}

function teamScore(team: TeamSide) {
  return team === 'home' ? s.value.homeScore : s.value.awayScore
}

function teamRotation(team: TeamSide) {
  return team === 'home' ? s.value.homeRotation : s.value.awayRotation
}

function teamSetsWon(team: TeamSide) {
  return team === 'home' ? s.value.homeSetsWon : s.value.awaySetsWon
}

function isServing(team: TeamSide) {
  return s.value.servingTeam === team
}

const editingTeam = ref<TeamSide | null>(null)
const draftName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)

const canChangeServe = computed(() => {
  const ms = matchStore.state
  if (!ms) return false
  return ms.homeScore === 0 && ms.awayScore === 0
})

function stepRotation(team: TeamSide, delta: 1 | -1) {
  matchStore.stepTeamRotation(team, delta)
}

function setServe(team: TeamSide) {
  if (!canChangeServe.value || !matchStore.state) return
  if (matchStore.state.servingTeam === team) return
  matchStore.setServingTeam(team)
}

async function startEditName(team: TeamSide) {
  editingTeam.value = team
  draftName.value = team === 'home' ? s.value.config.homeTeamName : s.value.config.awayTeamName
  await nextTick()
  nameInputRef.value?.focus()
  nameInputRef.value?.select()
}

function commitEditName() {
  if (!editingTeam.value) return
  matchStore.setTeamName(editingTeam.value, draftName.value)
  editingTeam.value = null
}

function cancelEditName() {
  editingTeam.value = null
}

function toggleSides() {
  matchStore.toggleSides()
}
</script>

<template>
  <!-- Planning (0-0): serve row + switch sides, then team names -->
  <div v-if="isPlanning" class="scoreboard scoreboard--planning">
    <div class="scoreboard__serve scoreboard__serve--left">
      <span
        v-if="isServing(leftTeam)"
        class="scoreboard__serve-badge scoreboard__serve-badge--active"
        aria-label="Serving"
      >
        <v-icon icon="fas fa-volleyball" size="small" />
        <span>Serve</span>
      </span>
      <button
        v-else-if="canChangeServe"
        type="button"
        class="scoreboard__serve-badge scoreboard__serve-badge--pickable"
        title="Set as server"
        @click="setServe(leftTeam)"
      >
        <v-icon icon="fas fa-volleyball" size="small" />
        <span>Serve</span>
      </button>
    </div>

    <button
      type="button"
      class="scoreboard__switch-sides"
      title="Switch sides"
      @click="toggleSides"
    >
      <v-icon icon="fas fa-right-left" size="x-small" />
      <span>Switch sides</span>
    </button>

    <div class="scoreboard__serve scoreboard__serve--right">
      <span
        v-if="isServing(rightTeam)"
        class="scoreboard__serve-badge scoreboard__serve-badge--active"
        aria-label="Serving"
      >
        <v-icon icon="fas fa-volleyball" size="small" />
        <span>Serve</span>
      </span>
      <button
        v-else-if="canChangeServe"
        type="button"
        class="scoreboard__serve-badge scoreboard__serve-badge--pickable"
        title="Set as server"
        @click="setServe(rightTeam)"
      >
        <v-icon icon="fas fa-volleyball" size="small" />
        <span>Serve</span>
      </button>
    </div>

    <div
      class="scoreboard__meta scoreboard__meta--left"
      :class="{ 'scoreboard__meta--serving': isServing(leftTeam) }"
    >
      <button
        v-if="editingTeam !== leftTeam"
        type="button"
        class="scoreboard__name"
        title="Click to edit team name"
        @click="startEditName(leftTeam)"
      >
        {{ teamName(leftTeam) }}
      </button>
      <input
        v-else
        ref="nameInputRef"
        v-model="draftName"
        class="scoreboard__name-input"
        type="text"
        :aria-label="`${teamName(leftTeam)} team name`"
        @keydown.enter="commitEditName"
        @keydown.escape="cancelEditName"
        @blur="commitEditName"
      />
      <div
        class="scoreboard__rotation"
        :aria-label="`${teamName(leftTeam)} starting rotation ${rotationLabel(teamRotation(leftTeam))}`"
      >
        <button
          type="button"
          class="scoreboard__rotation-btn"
          aria-label="Previous rotation"
          @click="stepRotation(leftTeam, -1)"
        >
          <v-icon icon="fas fa-rotate-left" size="x-small" />
        </button>
        <span class="scoreboard__rotation-num">{{ rotationLabel(teamRotation(leftTeam)) }}</span>
        <button
          type="button"
          class="scoreboard__rotation-btn"
          aria-label="Next rotation"
          @click="stepRotation(leftTeam, 1)"
        >
          <v-icon icon="fas fa-rotate-right" size="x-small" />
        </button>
      </div>
    </div>

    <div class="scoreboard__board">
      <span class="scoreboard__points-big" :aria-label="`${teamName(leftTeam)} score`">
        {{ teamScore(leftTeam) }}
      </span>
      <div class="scoreboard__sets" aria-label="Sets won">
        <span>{{ teamSetsWon(leftTeam) }}</span>
        <span>{{ teamSetsWon(rightTeam) }}</span>
      </div>
      <span class="scoreboard__points-big" :aria-label="`${teamName(rightTeam)} score`">
        {{ teamScore(rightTeam) }}
      </span>
    </div>

    <div
      class="scoreboard__meta scoreboard__meta--right"
      :class="{ 'scoreboard__meta--serving': isServing(rightTeam) }"
    >
      <button
        v-if="editingTeam !== rightTeam"
        type="button"
        class="scoreboard__name"
        title="Click to edit team name"
        @click="startEditName(rightTeam)"
      >
        {{ teamName(rightTeam) }}
      </button>
      <input
        v-else
        ref="nameInputRef"
        v-model="draftName"
        class="scoreboard__name-input scoreboard__name-input--right"
        type="text"
        :aria-label="`${teamName(rightTeam)} team name`"
        @keydown.enter="commitEditName"
        @keydown.escape="cancelEditName"
        @blur="commitEditName"
      />
      <div
        class="scoreboard__rotation"
        :aria-label="`${teamName(rightTeam)} starting rotation ${rotationLabel(teamRotation(rightTeam))}`"
      >
        <button
          type="button"
          class="scoreboard__rotation-btn"
          aria-label="Previous rotation"
          @click="stepRotation(rightTeam, -1)"
        >
          <v-icon icon="fas fa-rotate-left" size="x-small" />
        </button>
        <span class="scoreboard__rotation-num">{{ rotationLabel(teamRotation(rightTeam)) }}</span>
        <button
          type="button"
          class="scoreboard__rotation-btn"
          aria-label="Next rotation"
          @click="stepRotation(rightTeam, 1)"
        >
          <v-icon icon="fas fa-rotate-right" size="x-small" />
        </button>
      </div>
    </div>
  </div>

  <!-- Play mode: serve label stacked above team name -->
  <div v-else class="scoreboard scoreboard--play">
    <div
      class="scoreboard__meta scoreboard__meta--left"
      :class="{ 'scoreboard__meta--serving': isServing(leftTeam) }"
    >
      <span
        v-if="isServing(leftTeam)"
        class="scoreboard__serve-badge scoreboard__serve-badge--active"
        aria-label="Serving"
      >
        <v-icon icon="fas fa-volleyball" size="small" />
        <span>Serve</span>
      </span>
      <button
        v-if="editingTeam !== leftTeam"
        type="button"
        class="scoreboard__name"
        title="Click to edit team name"
        @click="startEditName(leftTeam)"
      >
        {{ teamName(leftTeam) }}
      </button>
      <input
        v-else
        ref="nameInputRef"
        v-model="draftName"
        class="scoreboard__name-input"
        type="text"
        :aria-label="`${teamName(leftTeam)} team name`"
        @keydown.enter="commitEditName"
        @keydown.escape="cancelEditName"
        @blur="commitEditName"
      />
    </div>

    <div class="scoreboard__board">
      <span class="scoreboard__points-big" :aria-label="`${teamName(leftTeam)} score`">
        {{ teamScore(leftTeam) }}
      </span>
      <div class="scoreboard__sets" aria-label="Sets won">
        <span>{{ teamSetsWon(leftTeam) }}</span>
        <span>{{ teamSetsWon(rightTeam) }}</span>
      </div>
      <span class="scoreboard__points-big" :aria-label="`${teamName(rightTeam)} score`">
        {{ teamScore(rightTeam) }}
      </span>
    </div>

    <div
      class="scoreboard__meta scoreboard__meta--right"
      :class="{ 'scoreboard__meta--serving': isServing(rightTeam) }"
    >
      <span
        v-if="isServing(rightTeam)"
        class="scoreboard__serve-badge scoreboard__serve-badge--active"
        aria-label="Serving"
      >
        <v-icon icon="fas fa-volleyball" size="small" />
        <span>Serve</span>
      </span>
      <button
        v-if="editingTeam !== rightTeam"
        type="button"
        class="scoreboard__name"
        title="Click to edit team name"
        @click="startEditName(rightTeam)"
      >
        {{ teamName(rightTeam) }}
      </button>
      <input
        v-else
        ref="nameInputRef"
        v-model="draftName"
        class="scoreboard__name-input scoreboard__name-input--right"
        type="text"
        :aria-label="`${teamName(rightTeam)} team name`"
        @keydown.enter="commitEditName"
        @keydown.escape="cancelEditName"
        @blur="commitEditName"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.scoreboard {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 0.75rem 1.25rem;
  padding: 0.65rem 1.25rem 0.4rem;
  background: transparent;
}

.scoreboard--planning {
  grid-template-rows: auto auto;
  gap: 0.35rem 1.25rem;
}

.scoreboard--play {
  grid-template-rows: auto;
}

.scoreboard__serve {
  align-self: start;
  min-height: 1.625rem;

  &--left {
    grid-column: 1;
    grid-row: 1;
  }

  &--right {
    grid-column: 3;
    grid-row: 1;
    display: flex;
    justify-content: flex-end;
  }
}

.scoreboard__switch-sides {
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 999px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  :deep(.v-icon) {
    font-size: 0.625rem !important;
    opacity: 0.75;
  }

  &:hover {
    background: rgba(var(--v-border-color), 0.08);
    border-color: rgba(var(--v-theme-primary), 0.35);
    color: rgba(var(--v-theme-on-surface), 0.85);
  }
}

.scoreboard__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 0.3rem;
  min-width: 0;

  &--left {
    grid-column: 1;
  }

  &--right {
    grid-column: 3;
    align-items: flex-end;
  }

  &--serving .scoreboard__name {
    color: rgba(var(--v-theme-on-surface), 0.92);
  }
}

.scoreboard--planning .scoreboard__meta {
  grid-row: 2;
}

.scoreboard--play .scoreboard__meta {
  grid-row: 1;
}

.scoreboard__name {
  font-family: var(--font-sport-display);
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  padding: 0.1rem 0.2rem;
  margin: 0;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.72);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s;

  .scoreboard__meta--right & {
    text-align: right;
  }

  &:hover {
    background: rgba(var(--v-border-color), 0.1);
  }
}

.scoreboard__name-input {
  width: 100%;
  max-width: 11rem;
  font-family: var(--font-sport-display);
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.35rem;
  border: 1px solid rgba(var(--v-theme-primary), 0.45);
  border-radius: 0.25rem;
  background: rgb(var(--v-theme-surface));
  color: inherit;
  outline: none;

  &--right {
    text-align: right;
  }

  &:focus {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.15);
  }
}

.scoreboard__board {
  grid-column: 2;
  display: flex;
  align-items: end;
  gap: 0.2rem 0.35rem;
  min-height: 4rem;
}

.scoreboard--planning .scoreboard__board {
  grid-row: 2;
}

.scoreboard--play .scoreboard__board {
  grid-row: 1;
}

.scoreboard__points-big {
  font-size: 3.75rem;
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: rgba(var(--v-theme-on-surface), 0.92);
  min-width: 1.75ch;
  text-align: center;
}

.scoreboard__sets {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  align-self: start;
  padding-top: 0.1rem;
  padding-inline: 0.15rem;
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.scoreboard__rotation {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.1rem;
}

.scoreboard__rotation-num {
  min-width: 2ch;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-align: center;
}

.scoreboard__rotation-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  padding: 0;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 0.375rem;
  background: rgba(var(--v-border-color), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.65);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover {
    background: rgba(var(--v-border-color), 0.12);
    border-color: rgba(var(--v-theme-primary), 0.35);
    color: rgba(var(--v-theme-on-surface), 0.9);
  }
}

.scoreboard__serve-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
  white-space: nowrap;

  :deep(.v-icon) {
    font-size: 0.75rem !important;
  }

  &--active {
    background: rgba(var(--v-theme-primary), 0.14);
    border-color: rgba(var(--v-theme-primary), 0.35);
    color: rgb(var(--v-theme-primary));
    cursor: default;

    :deep(.v-icon) {
      color: rgb(var(--v-theme-primary)) !important;
    }
  }

  &--pickable {
    background: transparent;
    border-color: rgba(var(--v-border-color), 0.35);
    color: rgba(var(--v-theme-on-surface), 0.45);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;

    :deep(.v-icon) {
      opacity: 0.55;
    }

    &:hover {
      background: rgba(var(--v-border-color), 0.08);
      border-color: rgba(var(--v-theme-primary), 0.35);
      color: rgba(var(--v-theme-on-surface), 0.7);

      :deep(.v-icon) {
        opacity: 0.9;
        color: rgb(var(--v-theme-primary)) !important;
      }
    }
  }
}
</style>
