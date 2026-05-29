import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { PlayerModel, RosterPlayer } from '@/models/player'
import type {
  FormationGroup,
  FormationLibrary,
  FormationVariant,
  PlayerCoordinates,
  SavedRotations,
} from '@/models/rotation'
import { isAdvancedDefenseGroup } from '@/config/advancedDefenseGroups'
import { featureFlags } from '@/config/featureFlags'
import { getBallPlacement } from '@/lib/ballPlacement'
import {
  decodeFormationPayload,
  encodeFormationPayload,
  FREE_PLAY_GROUP_ID,
  FREE_PLAY_LINEUP,
} from '@/lib/formationShare'
import bundledFormationsJson from '../../public/volleyball-formations.json'

const roster: RosterPlayer[] = [
  { id: 'setter-1', name: 'Setter', abbreviation: 'S' },
  { id: 'opposite-1', name: 'Opposite', abbreviation: 'O' },
  /** Middle 2 is further from the setter*/
  { id: 'middle-2', name: 'Middle 2', abbreviation: 'MB' },
  { id: 'left-1', name: 'Left', abbreviation: 'LE' },
  { id: 'libero', name: 'Libero', abbreviation: 'L' },
  { id: 'left-2', name: 'Left', abbreviation: 'LE' },
  /** Middle 1 is closer to the setter */
  { id: 'middle-1', name: 'Middle 1', abbreviation: 'MB' },
]

type Lineup = string[]

/** M1 front; M2 out, libero in. */
export const M1_LINEUP: Lineup = [
  'setter-1',
  'opposite-1',
  'middle-1',
  'left-1',
  'libero',
  'left-2',
]

/** M2 front; M1 out, libero in. */
const M2_LINEUP: Lineup = ['setter-1', 'opposite-1', 'middle-2', 'left-1', 'libero', 'left-2']

/** When middle blocker serves, both are on the court. */
const DOUBLE_MIDDLE_LINEUP: Lineup = [
  'setter-1',
  'opposite-1',
  'middle-1',
  'left-1',
  'middle-2',
  'left-2',
]

const ROTATION_LINEUPS: Partial<Record<string, Lineup>> = {
  'p1-serve': M2_LINEUP,
  'p1-receive': M2_LINEUP,
  'p6-receive': M2_LINEUP,
  'p6-serve': M2_LINEUP,
  'p5-serve': DOUBLE_MIDDLE_LINEUP,
  'p5-receive': M1_LINEUP,
  'p4-serve': M1_LINEUP,
  'p4-receive': M1_LINEUP,
  'p3-serve': M1_LINEUP,
  'p3-receive': M1_LINEUP,
  'p2-serve': DOUBLE_MIDDLE_LINEUP,
  'p2-receive': M2_LINEUP,
  'free-play': M1_LINEUP,
}

const STORAGE_KEY = 'volleyball-formations-v1'

const defaultPlayerCoordinates: PlayerCoordinates = {
  'setter-1': { x: 0.83, y: 0.88 },
  'opposite-1': { x: 0.72, y: 0.65 },
  'middle-1': { x: 0.5, y: 0.62 },
  'middle-2': { x: 0.45, y: 0.64 },
  'left-1': { x: 0.22, y: 0.62 },
  libero: { x: 0.3, y: 0.86 },
  'left-2': { x: 0.57, y: 0.87 },
}

function cloneCoordinates(source: PlayerCoordinates = defaultPlayerCoordinates): PlayerCoordinates {
  return Object.fromEntries(
    Object.entries(source).map(([playerId, coordinate]) => [playerId, { ...coordinate }]),
  )
}

function isRosterPlayerId(playerId: string): boolean {
  return roster.some((player) => player.id === playerId)
}

function lineupForRotation(rotationId: string): Lineup {
  return ROTATION_LINEUPS[rotationId] ?? M1_LINEUP
}

function createVariant(
  id: string,
  name: string,
  coordinates?: PlayerCoordinates,
): FormationVariant {
  return {
    id,
    name,
    coordinates: cloneCoordinates(coordinates ?? defaultPlayerCoordinates),
  }
}

function buildInitialFormations(): FormationLibrary {
  return [
    {
      id: 'start-position',
      name: 'Start position',
      variants: [
        createVariant('p1-serve', 'P1 serve'),
        createVariant('p1-receive', 'P1 receive'),
        createVariant('p6-serve', 'P6 serve (Left 1 serve)'),
        createVariant('p6-receive', 'P6 receive'),
        createVariant('p5-serve', 'P5 serve (Middle Blocker 1 serve)'),
        createVariant('p5-receive', 'P5 receive'),
        createVariant('p4-serve', 'P4 serve (Opposite serve)'),
        createVariant('p4-receive', 'P4 receive'),
        createVariant('p3-serve', 'P3 serve (Left 2 serve)'),
        createVariant('p3-receive', 'P3 receive'),
        createVariant('p2-serve', 'P2 serve (Middle Blocker 2 serve)'),
        createVariant('p2-receive', 'P2 receive'),
      ],
    },
    {
      id: 'defense-a',
      name: 'Defense (A-defense)',
      variants: [
        createVariant('attack-left', 'Attack from left'),
        createVariant('attack-middle', 'Attack from middle'),
        createVariant('attack-right', 'Attack from right'),
      ],
    },
    {
      id: 'defense-b',
      name: 'Defense (B-defense)',
      variants: [
        createVariant('b-attack-left', 'Attack from left'),
        createVariant('b-attack-middle', 'Attack from middle'),
        createVariant('b-attack-right', 'Attack from right'),
      ],
    },
    {
      id: 'free-ball-setter-back',
      name: 'Free ball (setter in back)',
      coordinates: cloneCoordinates(),
    },
    {
      id: 'free-ball-setter-front',
      name: 'Free ball (setter in front)',
      coordinates: cloneCoordinates(),
    },
    {
      id: FREE_PLAY_GROUP_ID,
      name: 'Free play',
      coordinates: cloneCoordinates(),
    },
  ]
}

function cloneLibrary(library: FormationLibrary): FormationLibrary {
  return library.map((group) => ({
    ...group,
    coordinates: group.coordinates ? cloneCoordinates(group.coordinates) : undefined,
    variants: group.variants?.map((variant) => ({
      ...variant,
      coordinates: cloneCoordinates(variant.coordinates),
    })),
  }))
}

function rotationIds(library: FormationLibrary): string[] {
  const ids: string[] = []
  for (const group of library) {
    if (group.variants?.length) {
      for (const variant of group.variants) {
        ids.push(variant.id)
      }
      continue
    }
    ids.push(group.id)
  }
  return ids
}

function normalizeCoordinates(raw: unknown): PlayerCoordinates {
  const coordinates = cloneCoordinates()
  if (!raw || typeof raw !== 'object') {
    return coordinates
  }

  for (const [key, coordinate] of Object.entries(raw as Record<string, unknown>)) {
    if (!coordinate || typeof coordinate !== 'object') {
      continue
    }

    const x = Number((coordinate as { x?: unknown }).x)
    const y = Number((coordinate as { y?: unknown }).y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue
    }

    const playerId = String(key).trim()
    if (!isRosterPlayerId(playerId)) {
      continue
    }

    coordinates[playerId] = {
      x: Math.min(Math.max(x, 0), 1),
      y: Math.min(Math.max(y, 0), 1),
    }
  }

  return coordinates
}

function serializeFormations(library: FormationLibrary): SavedRotations {
  const saved: SavedRotations = {}

  for (const group of library) {
    if (group.variants?.length) {
      for (const variant of group.variants) {
        saved[variant.id] = cloneCoordinates(variant.coordinates)
      }
      continue
    }

    if (group.coordinates) {
      saved[group.id] = cloneCoordinates(group.coordinates)
    }
  }

  return saved
}

function applySavedRotations(library: FormationLibrary, saved: SavedRotations): FormationLibrary {
  const knownIds = new Set(rotationIds(library))

  return library.map((group) => {
    if (group.variants?.length) {
      return {
        ...group,
        variants: group.variants.map((variant) => ({
          ...variant,
          coordinates: knownIds.has(variant.id)
            ? cloneCoordinates(saved[variant.id] ?? variant.coordinates)
            : variant.coordinates,
        })),
      }
    }

    return {
      ...group,
      coordinates: knownIds.has(group.id)
        ? cloneCoordinates(saved[group.id] ?? group.coordinates)
        : group.coordinates,
    }
  })
}

function normalizeSavedRotations(raw: unknown): SavedRotations | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }

  const saved: SavedRotations = {}

  for (const [rotationId, coordinates] of Object.entries(raw as Record<string, unknown>)) {
    const id = rotationId.trim()
    if (!id) {
      continue
    }

    const normalized = normalizeCoordinates(coordinates)
    if (Object.keys(normalized).length > 0) {
      saved[id] = normalized
    }
  }

  return Object.keys(saved).length > 0 ? saved : null
}

const bundledFormations = normalizeSavedRotations(bundledFormationsJson)

function getDefaultCoordinatesForRotation(rotationId: string): PlayerCoordinates {
  if (rotationId === FREE_PLAY_GROUP_ID) {
    return cloneCoordinates(defaultPlayerCoordinates)
  }

  if (bundledFormations?.[rotationId]) {
    return cloneCoordinates(bundledFormations[rotationId])
  }

  for (const group of buildInitialFormations()) {
    if (group.variants?.length) {
      const variant = group.variants.find((entry) => entry.id === rotationId)
      if (variant) {
        return cloneCoordinates(variant.coordinates)
      }
      continue
    }

    if (group.id === rotationId && group.coordinates) {
      return cloneCoordinates(group.coordinates)
    }
  }

  return cloneCoordinates()
}

function activeRotationId(groupId: string, variantId: string | null): string {
  return variantId ?? groupId
}

export const usePlayerStore = defineStore('player', () => {
  const players = ref<RosterPlayer[]>([...roster])
  const formations = ref<FormationLibrary>(buildInitialFormations())
  const activeGroupId = ref(formations.value[0]?.id ?? '')
  const activeVariantId = ref(formations.value[0]?.variants?.[0]?.id ?? null)
  const positionRevision = ref(0)

  const visibleFormations = computed(() => {
    if (featureFlags.advancedDefense) {
      return formations.value
    }

    return formations.value.filter((group) => !isAdvancedDefenseGroup(group.id))
  })

  function ensureActiveGroupVisible() {
    if (visibleFormations.value.some((group) => group.id === activeGroupId.value)) {
      return
    }

    const first = visibleFormations.value[0]
    if (!first) {
      return
    }

    activeGroupId.value = first.id
    activeVariantId.value = first.variants?.[0]?.id ?? null
  }

  const activeGroup = computed(() =>
    formations.value.find((group) => group.id === activeGroupId.value),
  )

  const activeVariantOptions = computed(() => activeGroup.value?.variants ?? [])

  const activeVariant = computed(() =>
    activeVariantOptions.value.find((variant) => variant.id === activeVariantId.value),
  )

  const currentRotationId = computed(() =>
    activeRotationId(activeGroupId.value, activeVariantId.value),
  )

  const formationAnimationKey = computed(
    () => `${currentRotationId.value}:${positionRevision.value}`,
  )

  const isFreePlayActive = computed(() => currentRotationId.value === FREE_PLAY_GROUP_ID)

  const ballPlacement = computed(() => getBallPlacement(currentRotationId.value))

  const activeCoordinates = computed(() => {
    if (activeVariant.value) {
      return activeVariant.value.coordinates
    }
    return activeGroup.value?.coordinates ?? cloneCoordinates()
  })

  const activeFormationName = computed(() => {
    if (!activeGroup.value) {
      return ''
    }
    if (activeVariant.value) {
      return `${activeGroup.value.name} · ${activeVariant.value.name}`
    }
    return activeGroup.value.name
  })

  const playersOnCourt = computed((): PlayerModel[] => {
    const coordinates = activeCoordinates.value
    const lineup = lineupForRotation(currentRotationId.value)

    return lineup
      .map((playerId) => {
        const player = players.value.find((entry) => entry.id === playerId)
        if (!player) {
          return null
        }

        return {
          ...player,
          coordinate: coordinates[playerId] ?? { x: 0.5, y: 0.5 },
        }
      })
      .filter((player): player is PlayerModel => player !== null)
  })

  function persistToLocalStorage() {
    if (!featureFlags.layoutPersistence || typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeFormations(formations.value)))
  }

  function applySavedToFormations(saved: SavedRotations) {
    const previousRotationId = activeRotationId(activeGroupId.value, activeVariantId.value)

    formations.value = applySavedRotations(cloneLibrary(buildInitialFormations()), saved)

    if (previousRotationId && setActiveRotation(previousRotationId)) {
      ensureActiveGroupVisible()
      return
    }

    activeGroupId.value = formations.value[0]?.id ?? ''
    activeVariantId.value = formations.value[0]?.variants?.[0]?.id ?? null
    ensureActiveGroupVisible()
  }

  function clearStoredFormations() {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.removeItem(STORAGE_KEY)
  }

  function hydrateFromLocalStorage() {
    if (typeof window === 'undefined') {
      return
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const saved = normalizeSavedRotations(parsed)
      if (saved) {
        applySavedToFormations(saved)
        return
      }
    } catch {
      // Fall through to clear invalid data.
    }

    clearStoredFormations()
  }

  function hydrateFromBundledJson() {
    if (bundledFormations) {
      applySavedToFormations(bundledFormations)
    }
  }

  function hydrateFormations() {
    if (featureFlags.layoutPersistence) {
      hydrateFromLocalStorage()
    } else {
      hydrateFromBundledJson()
    }

    ensureActiveGroupVisible()
  }

  function setActiveRotation(rotationId: string): boolean {
    for (const group of formations.value) {
      if (!featureFlags.advancedDefense && isAdvancedDefenseGroup(group.id)) {
        continue
      }

      if (group.variants?.length) {
        const variant = group.variants.find((entry) => entry.id === rotationId)
        if (!variant) {
          continue
        }

        activeGroupId.value = group.id
        activeVariantId.value = variant.id
        return true
      }

      if (group.id === rotationId) {
        activeGroupId.value = group.id
        activeVariantId.value = null
        return true
      }
    }

    return false
  }

  function setActiveGroup(id: string) {
    const group = visibleFormations.value.find((entry) => entry.id === id)
    if (!group) {
      return
    }
    activeGroupId.value = id
    activeVariantId.value = group.variants?.[0]?.id ?? null
  }

  function setActiveVariant(id: string) {
    if (!activeGroup.value?.variants) {
      return
    }
    if (activeGroup.value.variants.some((variant) => variant.id === id)) {
      activeVariantId.value = id
    }
  }

  function stepActiveVariant(delta: number) {
    const variants = activeGroup.value?.variants
    if (!variants?.length) {
      return
    }

    const currentIndex = variants.findIndex((variant) => variant.id === activeVariantId.value)
    const startIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = (startIndex + delta + variants.length) % variants.length
    activeVariantId.value = variants[nextIndex]!.id
  }

  function setActiveCoordinate(playerId: string, coordinate: { x: number; y: number }) {
    if (!isRosterPlayerId(playerId)) {
      return
    }

    if (activeVariant.value) {
      activeVariant.value.coordinates[playerId] = coordinate
      persistToLocalStorage()
      return
    }

    if (activeGroup.value?.coordinates) {
      activeGroup.value.coordinates[playerId] = coordinate
      persistToLocalStorage()
    }
  }

  function resetFreePlayLayout() {
    const group = formations.value.find((entry) => entry.id === FREE_PLAY_GROUP_ID)
    if (!group?.coordinates) {
      return
    }

    const defaults = getDefaultCoordinatesForRotation(FREE_PLAY_GROUP_ID)
    for (const [playerId, coordinate] of Object.entries(defaults)) {
      group.coordinates[playerId] = { ...coordinate }
    }

    positionRevision.value += 1
    persistToLocalStorage()
  }

  function saveCurrentLayout() {
    persistToLocalStorage()
  }

  function exportLibraryJson() {
    return JSON.stringify(serializeFormations(formations.value), null, 2)
  }

  function importLibraryJson(json: string): boolean {
    try {
      const parsed = JSON.parse(json)
      const saved = normalizeSavedRotations(parsed)
      if (!saved) {
        return false
      }

      applySavedToFormations(saved)
      persistToLocalStorage()
      return true
    } catch {
      return false
    }
  }

  function getFreePlayShareString(): string | null {
    if (!isFreePlayActive.value) {
      return null
    }

    return encodeFormationPayload(activeCoordinates.value, FREE_PLAY_LINEUP)
  }

  function applyFreePlayShareString(payload: string): boolean {
    const decoded = decodeFormationPayload(payload)
    if (!decoded) {
      return false
    }

    const group = formations.value.find((entry) => entry.id === FREE_PLAY_GROUP_ID)
    if (!group?.coordinates) {
      return false
    }

    for (const [playerId, coordinate] of Object.entries(decoded)) {
      group.coordinates[playerId] = { ...coordinate }
    }

    activeGroupId.value = FREE_PLAY_GROUP_ID
    activeVariantId.value = null
    persistToLocalStorage()
    return true
  }

  hydrateFormations()

  return {
    players,
    formations,
    visibleFormations,
    activeGroupId,
    activeVariantId,
    activeGroup,
    activeVariantOptions,
    activeVariant,
    activeCoordinates,
    currentRotationId,
    formationAnimationKey,
    isFreePlayActive,
    ballPlacement,
    activeFormationName,
    playersOnCourt,
    setActiveRotation,
    setActiveGroup,
    setActiveVariant,
    stepActiveVariant,
    setActiveCoordinate,
    resetFreePlayLayout,
    saveCurrentLayout,
    exportLibraryJson,
    importLibraryJson,
    getFreePlayShareString,
    applyFreePlayShareString,
  }
})
