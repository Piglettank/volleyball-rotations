<script setup lang="ts">
import { computed } from 'vue'
import { COURT_COLORS } from '@/components/court/courtGeometry'
import { getPlayCourtDiagram } from '@/lib/playCourtDiagram'
import type { PlayCourtOrientation } from '@/lib/courtPlayLayout'

const props = defineProps<{
  orientation: PlayCourtOrientation
}>()

const D = computed(() => getPlayCourtDiagram(props.orientation))
const S = computed(() => D.value.strokes)

const lineProps = {
  stroke: COURT_COLORS.line,
  'vector-effect': 'non-scaling-stroke',
} as const
</script>

<template>
  <g class="play-court-surface" aria-hidden="true">
    <!-- Outside zone -->
    <rect x="0" y="0" :width="D.vw" :height="D.vh" :fill="COURT_COLORS.outside" />

    <!-- Court surface -->
    <rect :x="D.padX" :y="D.padY" :width="D.courtW" :height="D.courtH" :fill="COURT_COLORS.court" />

    <!-- Court outline -->
    <rect
      :x="D.padX"
      :y="D.padY"
      :width="D.courtW"
      :height="D.courtH"
      fill="none"
      :stroke="COURT_COLORS.line"
      :stroke-width="S.px"
      vector-effect="non-scaling-stroke"
    />

    <!-- Attack lines -->
    <line
      v-for="(line, i) in D.attackLines"
      :key="`attack-${i}`"
      v-bind="lineProps"
      :x1="line.x1"
      :y1="line.y1"
      :x2="line.x2"
      :y2="line.y2"
      :stroke-width="S.px"
    />

    <!-- 3 m extensions (dashes in margins at attack lines) -->
    <line
      v-for="(line, i) in D.threeMeterExtensions"
      :key="`three-${i}`"
      v-bind="lineProps"
      :x1="line.x1"
      :y1="line.y1"
      :x2="line.x2"
      :y2="line.y2"
      :stroke-width="S.px"
      :stroke-dasharray="S.dash"
    />

    <!-- Corner ticks -->
    <line
      v-for="(tick, i) in D.baselineTicks"
      :key="`tick-${i}`"
      v-bind="lineProps"
      :x1="tick.x1"
      :y1="tick.y1"
      :x2="tick.x2"
      :y2="tick.y2"
      :stroke-width="S.px"
    />

    <!-- Net (double stroke) -->
    <line
      v-bind="lineProps"
      :x1="D.net.line.x1"
      :y1="D.net.line.y1"
      :x2="D.net.line.x2"
      :y2="D.net.line.y2"
      :stroke-width="S.netHeavyPx"
    />
    <line
      v-bind="lineProps"
      :x1="D.net.line.x1"
      :y1="D.net.line.y1"
      :x2="D.net.line.x2"
      :y2="D.net.line.y2"
      :stroke-width="S.netLightPx"
    />

    <!-- Net poles -->
    <circle :cx="D.net.poleTopX" :cy="D.net.poleTopY" :r="D.net.poleR" :fill="COURT_COLORS.line" />
    <circle :cx="D.net.poleBottomX" :cy="D.net.poleBottomY" :r="D.net.poleR" :fill="COURT_COLORS.line" />
  </g>
</template>
