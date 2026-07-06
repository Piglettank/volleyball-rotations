import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type Profile,
  type ProfilePlayer,
  type PlayerFolder,
  UNCATEGORIZED_FOLDER_ID,
} from '@/models/profile'

const STORAGE_KEY = 'bolleyvoll-profile-v1'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function buildDefaultProfile(): Profile {
  return {
    players: [],
    folders: [{ id: UNCATEGORIZED_FOLDER_ID, name: 'Players', playerIds: [] }],
  }
}

function loadProfile(): Profile {
  if (typeof window === 'undefined') return buildDefaultProfile()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return buildDefaultProfile()
    const parsed: Profile = JSON.parse(raw)
    if (!parsed.players || !parsed.folders) return buildDefaultProfile()
    // Ensure uncategorized folder exists
    if (!parsed.folders.some((f) => f.id === UNCATEGORIZED_FOLDER_ID)) {
      parsed.folders.unshift({ id: UNCATEGORIZED_FOLDER_ID, name: 'Players', playerIds: [] })
    }
    return parsed
  } catch {
    return buildDefaultProfile()
  }
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile>(loadProfile())

  function saveProfile() {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.value))
  }

  const players = computed(() => profile.value.players)
  const folders = computed(() => profile.value.folders)

  function addPlayer(name: string, folderId: string = UNCATEGORIZED_FOLDER_ID): ProfilePlayer {
    const player: ProfilePlayer = { id: generateId(), name: name.trim(), createdAt: Date.now() }
    profile.value.players.push(player)

    const folder = profile.value.folders.find((f) => f.id === folderId)
    if (folder) {
      folder.playerIds.push(player.id)
    } else {
      const uncategorized = profile.value.folders.find((f) => f.id === UNCATEGORIZED_FOLDER_ID)
      uncategorized?.playerIds.push(player.id)
    }

    saveProfile()
    return player
  }

  function removePlayer(playerId: string) {
    profile.value.players = profile.value.players.filter((p) => p.id !== playerId)
    for (const folder of profile.value.folders) {
      folder.playerIds = folder.playerIds.filter((id) => id !== playerId)
    }
    saveProfile()
  }

  function addFolder(name: string): PlayerFolder {
    const folder: PlayerFolder = { id: generateId(), name: name.trim(), playerIds: [] }
    profile.value.folders.push(folder)
    saveProfile()
    return folder
  }

  function removeFolder(folderId: string) {
    if (folderId === UNCATEGORIZED_FOLDER_ID) return
    const folder = profile.value.folders.find((f) => f.id === folderId)
    if (!folder) return

    // Move orphaned players to uncategorized
    const uncategorized = profile.value.folders.find((f) => f.id === UNCATEGORIZED_FOLDER_ID)
    if (uncategorized) {
      uncategorized.playerIds.push(...folder.playerIds)
    }

    profile.value.folders = profile.value.folders.filter((f) => f.id !== folderId)
    saveProfile()
  }

  function renameFolder(folderId: string, name: string) {
    const folder = profile.value.folders.find((f) => f.id === folderId)
    if (folder) {
      folder.name = name.trim()
      saveProfile()
    }
  }

  function movePlayerToFolder(playerId: string, targetFolderId: string) {
    for (const folder of profile.value.folders) {
      folder.playerIds = folder.playerIds.filter((id) => id !== playerId)
    }
    const target = profile.value.folders.find((f) => f.id === targetFolderId)
    target?.playerIds.push(playerId)
    saveProfile()
  }

  function getPlayerById(id: string): ProfilePlayer | undefined {
    return profile.value.players.find((p) => p.id === id)
  }

  function getFolderForPlayer(playerId: string): PlayerFolder | undefined {
    return profile.value.folders.find((f) => f.playerIds.includes(playerId))
  }

  return {
    players,
    folders,
    addPlayer,
    removePlayer,
    addFolder,
    removeFolder,
    renameFolder,
    movePlayerToFolder,
    getPlayerById,
    getFolderForPlayer,
    saveProfile,
    loadProfile: () => {
      profile.value = loadProfile()
    },
  }
})
