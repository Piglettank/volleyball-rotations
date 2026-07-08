import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  MatchConfig,
  MatchState,
  TeamSide,
  MatchHistoryEvent,
} from '@/models/match'
import {
  nextRotation,
  stepRotationNumber,
  DEFAULT_ROTATION,
  leadingTeam,
  opponentTeam,
  COURT_ROLE_IDS,
} from '@/models/match'

const STORAGE_KEY = 'bolleyvoll-active-match-v2'

const DEFAULT_CONFIG: MatchConfig = {
  homeTeamName: 'Home',
  awayTeamName: 'Away',
  rosterPlayerIds: [],
  initialServingTeam: 'home',
}

function buildInitialAssignments(): Record<string, string | null> {
  const result: Record<string, string | null> = {}
  for (const roleId of COURT_ROLE_IDS) {
    result[roleId] = null
  }
  return result
}

function saveToStorage(state: MatchState | null) {
  if (typeof window === 'undefined') return
  if (state === null) {
    window.localStorage.removeItem(STORAGE_KEY)
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
}

function loadFromStorage(): MatchState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MatchState
    return { ...parsed, sidesSwapped: parsed.sidesSwapped ?? false }
  } catch {
    return null
  }
}

export const useMatchStore = defineStore('match', () => {
  const matchState = ref<MatchState | null>(loadFromStorage())

  const isActive = computed(() => matchState.value !== null)
  const state = computed(() => matchState.value)

  function startMatch(config: MatchConfig = DEFAULT_CONFIG) {
    matchState.value = {
      config,
      homeRotation: DEFAULT_ROTATION,
      awayRotation: DEFAULT_ROTATION,
      servingTeam: config.initialServingTeam,
      homeScore: 0,
      awayScore: 0,
      homeSetsWon: 0,
      awaySetsWon: 0,
      currentSet: 1,
      homeAssignments: buildInitialAssignments(),
      awayAssignments: buildInitialAssignments(),
      pointHistory: [],
      sidesSwapped: false,
    }
    saveToStorage(matchState.value)
  }

  function canAdjustRotation(): boolean {
    const s = matchState.value
    if (!s) return false
    return s.homeScore === 0 && s.awayScore === 0
  }

  const canAdjustRotationComputed = computed(() => canAdjustRotation())

  function stepTeamRotation(team: TeamSide, delta: 1 | -1) {
    if (!matchState.value || !canAdjustRotation()) return
    if (team === 'home') {
      matchState.value.homeRotation = stepRotationNumber(matchState.value.homeRotation, delta)
    } else {
      matchState.value.awayRotation = stepRotationNumber(matchState.value.awayRotation, delta)
    }
    saveToStorage(matchState.value)
  }

  function toggleSides() {
    if (!matchState.value || !canAdjustRotation()) return
    matchState.value.sidesSwapped = !matchState.value.sidesSwapped
    saveToStorage(matchState.value)
  }

  function setServingTeam(team: TeamSide) {
    if (!matchState.value) return
    const { homeScore, awayScore } = matchState.value
    if (homeScore !== 0 || awayScore !== 0) return // Only allowed at 0-0
    matchState.value.servingTeam = team
    saveToStorage(matchState.value)
  }

  function awardPoint(scoringTeam: TeamSide) {
    const s = matchState.value
    if (!s) return

    const event: MatchHistoryEvent = {
      type: 'point',
      scoringTeam,
      homeScoreBefore: s.homeScore,
      awayScoreBefore: s.awayScore,
      servingTeamBefore: s.servingTeam,
      homeRotationBefore: s.homeRotation,
      awayRotationBefore: s.awayRotation,
      sidesSwappedBefore: s.sidesSwapped,
    }
    s.pointHistory.push(event)

    const wasServing = s.servingTeam
    const sideOut = scoringTeam !== wasServing

    if (sideOut) {
      if (scoringTeam === 'home') {
        s.homeRotation = nextRotation(s.homeRotation)
      } else {
        s.awayRotation = nextRotation(s.awayRotation)
      }
      s.servingTeam = scoringTeam
    }

    if (scoringTeam === 'home') {
      s.homeScore += 1
    } else {
      s.awayScore += 1
    }

    saveToStorage(matchState.value)
  }

  function completeSet(winner?: TeamSide) {
    const s = matchState.value
    if (!s) return

    const resolvedWinner = winner ?? leadingTeam(s.homeScore, s.awayScore)
    if (!resolvedWinner) return // tied and no winner provided

    const event: MatchHistoryEvent = {
      type: 'setComplete',
      winnerTeam: resolvedWinner,
      homeScoreBefore: s.homeScore,
      awayScoreBefore: s.awayScore,
      homeSetsWonBefore: s.homeSetsWon,
      awaySetsWonBefore: s.awaySetsWon,
      currentSetBefore: s.currentSet,
      servingTeamBefore: s.servingTeam,
      homeRotationBefore: s.homeRotation,
      awayRotationBefore: s.awayRotation,
      sidesSwappedBefore: s.sidesSwapped,
    }
    s.pointHistory.push(event)

    if (resolvedWinner === 'home') {
      s.homeSetsWon += 1
    } else {
      s.awaySetsWon += 1
    }

    s.homeScore = 0
    s.awayScore = 0
    s.currentSet += 1
    s.homeRotation = DEFAULT_ROTATION
    s.awayRotation = DEFAULT_ROTATION
    s.sidesSwapped = !s.sidesSwapped
    s.servingTeam = opponentTeam(s.servingTeam)

    saveToStorage(matchState.value)
  }

  function undo() {
    const s = matchState.value
    if (!s || s.pointHistory.length === 0) return

    const event = s.pointHistory.pop()!

    if (event.type === 'point') {
      s.homeScore = event.homeScoreBefore
      s.awayScore = event.awayScoreBefore
      s.servingTeam = event.servingTeamBefore
      s.homeRotation = event.homeRotationBefore
      s.awayRotation = event.awayRotationBefore
      s.sidesSwapped = event.sidesSwappedBefore
    } else {
      s.homeScore = event.homeScoreBefore
      s.awayScore = event.awayScoreBefore
      s.homeSetsWon = event.homeSetsWonBefore
      s.awaySetsWon = event.awaySetsWonBefore
      s.currentSet = event.currentSetBefore
      s.servingTeam = event.servingTeamBefore
      s.homeRotation = event.homeRotationBefore
      s.awayRotation = event.awayRotationBefore
      s.sidesSwapped = event.sidesSwappedBefore
    }

    saveToStorage(matchState.value)
  }

  function assignPlayer(team: TeamSide, roleId: string, profilePlayerId: string | null) {
    if (!matchState.value) return
    // Clear any existing slot this player occupies across both teams
    if (profilePlayerId) {
      for (const rid of Object.keys(matchState.value.homeAssignments)) {
        if (matchState.value.homeAssignments[rid] === profilePlayerId) {
          matchState.value.homeAssignments[rid] = null
        }
      }
      for (const rid of Object.keys(matchState.value.awayAssignments)) {
        if (matchState.value.awayAssignments[rid] === profilePlayerId) {
          matchState.value.awayAssignments[rid] = null
        }
      }
    }
    if (team === 'home') {
      matchState.value.homeAssignments[roleId] = profilePlayerId
    } else {
      matchState.value.awayAssignments[roleId] = profilePlayerId
    }
    saveToStorage(matchState.value)
  }

  function setTeamName(team: TeamSide, name: string) {
    if (!matchState.value) return
    const trimmed = name.trim()
    if (team === 'home') {
      matchState.value.config.homeTeamName = trimmed || 'Home'
    } else {
      matchState.value.config.awayTeamName = trimmed || 'Away'
    }
    saveToStorage(matchState.value)
  }

  function setRosterPlayerIds(ids: string[]) {
    if (!matchState.value) return
    matchState.value.config.rosterPlayerIds = ids
    // Clear assignments for players no longer in the roster
    const idSet = new Set(ids)
    for (const roleId of Object.keys(matchState.value.homeAssignments)) {
      const assigned = matchState.value.homeAssignments[roleId]
      if (assigned && !idSet.has(assigned)) {
        matchState.value.homeAssignments[roleId] = null
      }
    }
    for (const roleId of Object.keys(matchState.value.awayAssignments)) {
      const assigned = matchState.value.awayAssignments[roleId]
      if (assigned && !idSet.has(assigned)) {
        matchState.value.awayAssignments[roleId] = null
      }
    }
    saveToStorage(matchState.value)
  }

  function endMatch() {
    matchState.value = null
    saveToStorage(null)
  }

  return {
    state,
    isActive,
    startMatch,
    canAdjustRotation: canAdjustRotationComputed,
    stepTeamRotation,
    toggleSides,
    setServingTeam,
    awardPoint,
    completeSet,
    undo,
    assignPlayer,
    setTeamName,
    setRosterPlayerIds,
    endMatch,
  }
})
