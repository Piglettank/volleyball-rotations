<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MatchScoreboard from '@/components/play/MatchScoreboard.vue'
import MatchCourt from '@/components/play/MatchCourt.vue'
import PlayerAssignPopover from '@/components/play/PlayerAssignPopover.vue'
import RosterDrawer from '@/components/play/RosterDrawer.vue'
import ConfirmDialog from '@/components/play/ConfirmDialog.vue'
import { COURT_COLORS, APP_THEME_COLORS } from '@/components/court/courtGeometry'
import { useMatchStore } from '@/stores/match'
import { isSetEndEligible, leadingTeam, teamOnLeft, teamOnRight } from '@/models/match'
import type { TeamSide } from '@/models/match'

const router = useRouter()
const matchStore = useMatchStore()

const s = computed(() => matchStore.state!)

const leftTeam = computed(() => teamOnLeft(s.value.sidesSwapped))
const rightTeam = computed(() => teamOnRight(s.value.sidesSwapped))
const isPlanning = computed(() => matchStore.canAdjustRotation)

function teamName(team: TeamSide) {
  return team === 'home' ? s.value.config.homeTeamName : s.value.config.awayTeamName
}

type PopoverState = {
  team: TeamSide
  roleId: string
  roleName: string
  x: number
  y: number
}

const popover = ref<PopoverState | null>(null)
const showRosterDrawer = ref(false)

function onPlayerClick(payload: {
  team: TeamSide
  roleId: string
  roleName: string
  screenX: number
  screenY: number
}) {
  if (
    popover.value?.team === payload.team &&
    popover.value?.roleId === payload.roleId
  ) {
    popover.value = null
    return
  }
  popover.value = {
    team: payload.team,
    roleId: payload.roleId,
    roleName: payload.roleName,
    x: payload.screenX,
    y: payload.screenY,
  }
}

function closePopover() {
  popover.value = null
}

function endMatch() {
  matchStore.endMatch()
  router.push({ name: 'home' })
}

// ── Set complete dialog ──────────────────────────────────────────────────────

const showSetCompleteDialog = ref(false)

const setCompleteLeader = computed(() =>
  leadingTeam(s.value.homeScore, s.value.awayScore),
)

const setCompleteLeaderName = computed(() => {
  const leader = setCompleteLeader.value
  if (leader === 'home') return s.value.config.homeTeamName
  if (leader === 'away') return s.value.config.awayTeamName
  return null
})

function openSetComplete() {
  showSetCompleteDialog.value = true
}

function confirmSetComplete(winner?: TeamSide) {
  showSetCompleteDialog.value = false
  matchStore.completeSet(winner)
}

// ── Auto 25+ prompt ──────────────────────────────────────────────────────────

const showAutoEndPrompt = ref(false)
/** Set number for which the auto end prompt has already been shown */
const autoEndPromptShownForSet = ref<number | null>(null)

watch(
  () => ({
    home: s.value?.homeScore ?? 0,
    away: s.value?.awayScore ?? 0,
    currentSet: s.value?.currentSet ?? 1,
  }),
  ({ home, away, currentSet }) => {
    if (autoEndPromptShownForSet.value !== currentSet) {
      showAutoEndPrompt.value = false
    }

    if (!isSetEndEligible(home, away)) return
    if (autoEndPromptShownForSet.value === currentSet) return

    autoEndPromptShownForSet.value = currentSet
    showAutoEndPrompt.value = true
  },
)

function dismissAutoEnd() {
  showAutoEndPrompt.value = false
}

function acceptAutoEnd() {
  showAutoEndPrompt.value = false
  matchStore.completeSet()
}
</script>

<template>
  <v-main class="match-main">
    <div class="match-layout">
      <!-- Court -->
      <div class="match-court-wrapper">
        <MatchCourt @player-click="onPlayerClick" />
        <p v-if="isPlanning" class="match-planning-label">Planning mode</p>
      </div>

      <!-- Score & controls -->
      <div class="match-bottom">
        <MatchScoreboard />

        <div class="match-controls">
          <button
            type="button"
            class="match-point-btn"
            :class="`match-point-btn--${leftTeam}`"
            @click="matchStore.awardPoint(leftTeam)"
          >
            <span class="match-point-btn__value">+1</span>
            <span class="match-point-btn__team">{{ teamName(leftTeam) }}</span>
          </button>

          <button
            type="button"
            class="match-undo-btn"
            :disabled="s.pointHistory.length === 0"
            @click="matchStore.undo()"
          >
            <v-icon icon="fas fa-rotate-left" size="small" class="match-undo-btn__icon" />
            <span class="match-undo-btn__label">Undo</span>
          </button>

          <button
            type="button"
            class="match-point-btn"
            :class="`match-point-btn--${rightTeam}`"
            @click="matchStore.awardPoint(rightTeam)"
          >
            <span class="match-point-btn__value">+1</span>
            <span class="match-point-btn__team">{{ teamName(rightTeam) }}</span>
          </button>
        </div>

        <div class="match-footer">
          <button
            type="button"
            class="match-footer-btn"
            @click="showRosterDrawer = true"
          >
            <v-icon icon="fas fa-users" size="x-small" />
            <span>Players</span>
          </button>

          <button
            type="button"
            class="match-footer-btn match-footer-btn--set"
            @click="openSetComplete"
          >
            <v-icon icon="fas fa-flag-checkered" size="x-small" />
            <span>Set complete</span>
          </button>

          <button
            type="button"
            class="match-footer-btn match-footer-btn--end"
            @click="endMatch"
          >
            <v-icon icon="fas fa-door-open" size="x-small" />
            <span>End match</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Set complete dialog -->
    <ConfirmDialog
      v-model="showSetCompleteDialog"
      title="Complete set"
      icon="fas fa-flag-checkered"
    >
      <p v-if="setCompleteLeader">
        Award this set to <strong>{{ setCompleteLeaderName }}</strong>?
      </p>
      <p v-else>Scores are tied — pick a winner:</p>

      <template v-if="setCompleteLeader" #actions>
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--ghost"
          @click="showSetCompleteDialog = false"
        >
          Cancel
        </button>
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--primary"
          @click="confirmSetComplete()"
        >
          Confirm
        </button>
      </template>
      <template v-else #actions>
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--home"
          @click="confirmSetComplete('home')"
        >
          {{ s.config.homeTeamName }}
        </button>
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--away"
          @click="confirmSetComplete('away')"
        >
          {{ s.config.awayTeamName }}
        </button>
      </template>
    </ConfirmDialog>

    <!-- Auto 25+ end-set prompt -->
    <ConfirmDialog v-model="showAutoEndPrompt" title="End this set?" icon="fas fa-volleyball">
      <p>
        <strong>{{ setCompleteLeaderName }}</strong> leads
        {{ s.homeScore }}–{{ s.awayScore }}.
      </p>

      <template #actions>
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--ghost"
          @click="dismissAutoEnd"
        >
          Keep playing
        </button>
        <button
          type="button"
          class="confirm-dialog__btn confirm-dialog__btn--primary"
          @click="acceptAutoEnd"
        >
          End set
        </button>
      </template>
    </ConfirmDialog>

    <!-- Player assign popover (teleported to body to avoid clip) -->
    <Teleport to="body">
      <PlayerAssignPopover
        v-if="popover"
        :team="popover.team"
        :role-id="popover.roleId"
        :role-name="popover.roleName"
        :anchor-x="popover.x"
        :anchor-y="popover.y"
        @close="closePopover"
      />
    </Teleport>

    <RosterDrawer v-model="showRosterDrawer" />
  </v-main>
</template>

<style scoped lang="scss">
.match-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-height: 100dvh;
  padding: 0 !important;
  background: rgb(var(--v-theme-background));
}

.match-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
}

.match-court-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 0.5rem;
  background: v-bind('COURT_COLORS.outside');
}

.match-planning-label {
  position: absolute;
  left: 50%;
  bottom: 0.35rem;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: v-bind('APP_THEME_COLORS.text');
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 10px rgba(26, 42, 58, 0.35);
}

.match-bottom {
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.match-controls {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem 0.65rem;
  flex-shrink: 0;
}

.match-point-btn {
  flex: 1;
  max-width: 10rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  min-height: 3.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.625rem;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
}

.match-point-btn__value {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.match-point-btn__team {
  font-size: 0.6875rem;
  font-weight: 500;
  opacity: 0.85;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-point-btn--home {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.match-point-btn--away {
  background: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
}

.match-undo-btn {
  flex-shrink: 0;
  align-self: stretch;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.5rem;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.625rem;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.87);
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s, background 0.15s;

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }

  &:not(:disabled):hover {
    background: rgba(var(--v-border-color), 0.08);
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
}

.match-undo-btn__icon {
  line-height: 1;

  :deep(.v-icon) {
    font-size: 1.125rem !important;
  }
}

.match-undo-btn__label {
  font-size: 0.6875rem;
  font-weight: 500;
  opacity: 0.85;
  line-height: 1;
}

.match-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 0.75rem 0.6rem;
  flex-shrink: 0;
}

.match-footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 0.375rem;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.65);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  :deep(.v-icon) {
    font-size: 0.75rem !important;
    opacity: 0.7;
  }

  &:hover:not(:disabled) {
    background: rgba(var(--v-border-color), 0.08);
    color: rgba(var(--v-theme-on-surface), 0.9);

    :deep(.v-icon) {
      opacity: 1;
    }
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &--set {
    border-color: rgba(var(--v-theme-primary), 0.35);
    color: rgb(var(--v-theme-primary));

    :deep(.v-icon) {
      color: rgb(var(--v-theme-primary)) !important;
      opacity: 0.85;
    }

    &:hover:not(:disabled) {
      background: rgba(var(--v-theme-primary), 0.07);
      color: rgb(var(--v-theme-primary));
    }
  }

  &--end {
    color: rgba(var(--v-theme-on-surface), 0.45);
  }
}

@media (max-width: 640px) {
  .match-court-wrapper {
    padding: 0.25rem;
  }

  .match-controls {
    gap: 0.5rem;
    padding: 0.35rem 0.75rem 0.5rem;
  }

  .match-point-btn {
    min-height: 2.75rem;
    border-radius: 0.5rem;
    padding: 0.4rem 0.5rem;
  }

  .match-point-btn__value {
    font-size: 1.125rem;
  }

  .match-point-btn__team {
    font-size: 0.625rem;
  }

  .match-undo-btn {
    border-radius: 0.5rem;
    padding: 0.4rem;
  }

  .match-footer {
    gap: 0.35rem;
    padding: 0 0.5rem 0.5rem;
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0.5rem));
  }

  .match-footer-btn {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
    gap: 0.3rem;
  }

  .match-bottom {
    padding-bottom: 0;
  }
}
</style>
