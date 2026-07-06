<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { createPlayerPositionAnimator } from '@/components/court/courtPlayerAnimation'
import { useMatchStore } from '@/stores/match'
import { useProfileStore } from '@/stores/profile'
import { getBallPlacement } from '@/lib/ballPlacement'
import {
  formationIdForTeam,
  getFormationCoordinates,
  lineupForRotation,
  ROLE_DISPLAY,
} from '@/lib/matchRotation'
import { learnToPlaySvgCoord, PLAY_COURT_SVG } from '@/lib/courtPlayLayout'
import { physicalCourtSide } from '@/models/match'
import {
  PLAY_BALL_RADIUS,
  PLAY_MARKER_FONT,
  PLAY_MARKER_RADIUS,
  PLAY_MARKER_STROKE_PX,
  PLAY_TEAM_COLORS,
} from '@/lib/playCourtMarkers'
import PlayCourtSurface from '@/components/play/PlayCourtSurface.vue'
import { abbreviationFromName } from '@/models/profile'
import type { PlayerModel } from '@/models/player'
import type { TeamSide } from '@/models/match'

type AnimPlayer = PlayerModel & {
  team: TeamSide
  roleId: string
  roleName: string
}

type CourtMarker = {
  team: TeamSide
  roleId: string
  roleName: string
  label: string
  x: number
  y: number
}

const emit = defineEmits<{
  'player-click': [{ team: TeamSide; roleId: string; roleName: string; screenX: number; screenY: number }]
}>()

const matchStore = useMatchStore()
const profileStore = useProfileStore()
const svgRef = ref<SVGSVGElement | null>(null)
const animFrame = ref(0)

const { viewWidth: VW, viewHeight: VH } = PLAY_COURT_SVG
const playerAnimator = createPlayerPositionAnimator(450)

function markerId(team: TeamSide, roleId: string): string {
  return `${team}:${roleId}`
}

const formationKey = computed(() => {
  const s = matchStore.state
  if (!s) return ''
  return `${s.homeRotation}:${s.awayRotation}:${s.servingTeam}:${s.currentSet}:${s.sidesSwapped}`
})

function buildAnimPlayers(): AnimPlayer[] {
  const s = matchStore.state
  if (!s) return []

  const players: AnimPlayer[] = []

  for (const team of ['home', 'away'] as const) {
    const rotation = team === 'home' ? s.homeRotation : s.awayRotation
    const formationId = formationIdForTeam(rotation, s.servingTeam, team)
    const coords = getFormationCoordinates(formationId)
    const lineup = lineupForRotation(formationId)
    const assignments = team === 'home' ? s.homeAssignments : s.awayAssignments

    for (const roleId of lineup) {
      const learnCoord = coords[roleId] ?? { x: 0.5, y: 0.75 }
      const assigned = assignments[roleId] ?? null
      const profilePlayer = assigned ? profileStore.getPlayerById(assigned) : null
      const role = ROLE_DISPLAY[roleId] ?? { name: roleId, abbr: '?' }
      const label = profilePlayer ? abbreviationFromName(profilePlayer.name) : role.abbr

      players.push({
        id: markerId(team, roleId),
        name: label,
        abbreviation: label,
        coordinate: { ...learnCoord },
        team,
        roleId,
        roleName: role.name,
      })
    }
  }

  return players
}

const animPlayers = computed(() => buildAnimPlayers())

function toCourtMarker(player: AnimPlayer): CourtMarker {
  const s = matchStore.state!
  const courtSide = physicalCourtSide(player.team, s.sidesSwapped)
  const { x, y } = learnToPlaySvgCoord(player.coordinate, courtSide)
  return {
    team: player.team,
    roleId: player.roleId,
    roleName: player.roleName,
    label: player.abbreviation,
    x,
    y,
  }
}

const homeMarkers = computed(() => {
  animFrame.value
  return playerAnimator
    .getDisplayPlayers(animPlayers.value)
    .map((player) => toCourtMarker(player as AnimPlayer))
    .filter((marker) => marker.team === 'home')
})

const awayMarkers = computed(() => {
  animFrame.value
  return playerAnimator
    .getDisplayPlayers(animPlayers.value)
    .map((player) => toCourtMarker(player as AnimPlayer))
    .filter((marker) => marker.team === 'away')
})

const ballPosition = computed(() => {
  const s = matchStore.state
  if (!s) return null

  const team = s.servingTeam
  const rotation = team === 'home' ? s.homeRotation : s.awayRotation
  const formationId = formationIdForTeam(rotation, s.servingTeam, team)
  const placement = getBallPlacement(formationId)
  if (!placement) return null

  return learnToPlaySvgCoord(placement.normalized, physicalCourtSide(team, s.sidesSwapped))
})

function onPlayerClick(marker: CourtMarker, _event: MouseEvent) {
  const svgEl = svgRef.value
  if (!svgEl) return
  const rect = svgEl.getBoundingClientRect()
  const scaleX = rect.width / VW
  const scaleY = rect.height / VH

  emit('player-click', {
    team: marker.team,
    roleId: marker.roleId,
    roleName: marker.roleName,
    screenX: rect.left + marker.x * scaleX,
    screenY: rect.top + marker.y * scaleY,
  })
}

watch(formationKey, () => {
  playerAnimator.animate(animPlayers.value, () => {
    animFrame.value += 1
  })
})

onMounted(() => {
  playerAnimator.setImmediate(animPlayers.value)
})

onUnmounted(() => {
  playerAnimator.cancel()
})
</script>

<template>
  <div class="match-court">
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${VW} ${VH}`"
      class="match-court__svg"
      :aria-label="`Play court — ${matchStore.state?.config.homeTeamName} vs ${matchStore.state?.config.awayTeamName}`"
    >
      <PlayCourtSurface />

      <g v-for="marker in homeMarkers" :key="`home-${marker.roleId}`">
        <circle
          :cx="marker.x"
          :cy="marker.y"
          :r="PLAY_MARKER_RADIUS"
          :fill="PLAY_TEAM_COLORS.home.fill"
          :stroke="PLAY_TEAM_COLORS.home.stroke"
          :stroke-width="PLAY_MARKER_STROKE_PX"
          vector-effect="non-scaling-stroke"
          class="match-court__player"
          @click="onPlayerClick(marker, $event)"
        />
        <text
          :x="marker.x"
          :y="marker.y"
          :font-size="PLAY_MARKER_FONT"
          fill="#ffffff"
          font-weight="700"
          text-anchor="middle"
          dominant-baseline="central"
          alignment-baseline="central"
          pointer-events="none"
        >{{ marker.label }}</text>
      </g>

      <g v-for="marker in awayMarkers" :key="`away-${marker.roleId}`">
        <circle
          :cx="marker.x"
          :cy="marker.y"
          :r="PLAY_MARKER_RADIUS"
          :fill="PLAY_TEAM_COLORS.away.fill"
          :stroke="PLAY_TEAM_COLORS.away.stroke"
          :stroke-width="PLAY_MARKER_STROKE_PX"
          vector-effect="non-scaling-stroke"
          class="match-court__player"
          @click="onPlayerClick(marker, $event)"
        />
        <text
          :x="marker.x"
          :y="marker.y"
          :font-size="PLAY_MARKER_FONT"
          fill="#ffffff"
          font-weight="700"
          text-anchor="middle"
          dominant-baseline="central"
          alignment-baseline="central"
          pointer-events="none"
        >{{ marker.label }}</text>
      </g>

      <g v-if="ballPosition">
        <circle
          :cx="ballPosition.x"
          :cy="ballPosition.y"
          :r="PLAY_BALL_RADIUS"
          fill="#ffffff"
          stroke="#c62828"
          :stroke-width="PLAY_MARKER_STROKE_PX"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped lang="scss">
.match-court {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.match-court__svg {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.match-court__player {
  cursor: pointer;
  transition: opacity 0.1s;

  &:hover {
    opacity: 0.85;
  }
}
</style>
