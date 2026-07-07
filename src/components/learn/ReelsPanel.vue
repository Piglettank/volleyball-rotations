<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { learnReels } from '@/lib/learnReels'
import type { LearnCategory } from '@/lib/learnMenu'
import SocialReelEmbed from './SocialReelEmbed.vue'

const props = defineProps<{
  category: LearnCategory
}>()

const reels = computed(() => learnReels[props.category] ?? [])
const currentIndex = ref(0)

// Reset to first reel when category changes
watch(() => props.category, () => { currentIndex.value = 0 })

function prev() {
  if (currentIndex.value > 0) currentIndex.value--
}
function next() {
  if (currentIndex.value < reels.value.length - 1) currentIndex.value++
}

// ── Mobile: IntersectionObserver tracks which slide has scrolled into view ──
const slideRefs = ref<HTMLElement[]>([])

function registerSlide(el: HTMLElement | null, index: number) {
  if (el) slideRefs.value[index] = el
}

let observers: IntersectionObserver[] = []

function setupObservers() {
  observers.forEach((o) => o.disconnect())
  observers = []

  nextTick(() => {
    slideRefs.value.forEach((el, index) => {
      if (!el) return
      const o = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) currentIndex.value = index
        },
        { threshold: 0.6 },
      )
      o.observe(el)
      observers.push(o)
    })
  })
}

watch(reels, setupObservers, { immediate: true })

// ── Desktop: wheel to navigate ───────────────────────────────────────────────
const desktopRef = ref<HTMLElement | null>(null)
let wheelCooldown = false

function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (wheelCooldown) return
  if (e.deltaY > 0) next()
  else if (e.deltaY < 0) prev()
  // Brief cooldown so one trackpad swipe doesn't skip multiple reels
  wheelCooldown = true
  setTimeout(() => { wheelCooldown = false }, 600)
}

onMounted(() => {
  // passive: false required so we can call preventDefault and block page scroll
  desktopRef.value?.addEventListener('wheel', onWheel, { passive: false })
})
onBeforeUnmount(() => {
  desktopRef.value?.removeEventListener('wheel', onWheel)
})
</script>

<template>
  <div class="reels-panel">
    <div v-if="reels.length === 0" class="reels-panel__empty">
      <v-icon icon="fas fa-film" size="x-large" />
      <span>No videos yet — check back soon!</span>
    </div>

    <template v-else>
      <!-- ── Desktop: single slide + up/down buttons ── -->
      <div ref="desktopRef" class="reels-panel__desktop">
        <v-btn
          class="reels-panel__nav-btn reels-panel__nav-btn--up"
          variant="text"
          icon
          :disabled="currentIndex === 0"
          aria-label="Previous reel"
          @click="prev"
        >
          <v-icon icon="fas fa-chevron-up" />
        </v-btn>

        <div class="reels-panel__desktop-slide">
          <SocialReelEmbed
            :url="reels[currentIndex].url"
            :active="true"
          />
        </div>

        <v-btn
          class="reels-panel__nav-btn reels-panel__nav-btn--down"
          variant="text"
          icon
          :disabled="currentIndex === reels.length - 1"
          aria-label="Next reel"
          @click="next"
        >
          <v-icon icon="fas fa-chevron-down" />
        </v-btn>

        <!-- Dot indicators -->
        <div class="reels-panel__dots">
          <span
            v-for="(_, i) in reels"
            :key="i"
            class="reels-panel__dot"
            :class="{ 'reels-panel__dot--active': i === currentIndex }"
          />
        </div>
      </div>

      <!-- ── Mobile: scroll-snap feed ── -->
      <div class="reels-panel__mobile-feed">
        <div
          v-for="(reel, index) in reels"
          :key="reel.id"
          :ref="(el) => registerSlide(el as HTMLElement | null, index)"
          class="reels-panel__slide"
        >
          <SocialReelEmbed
            :url="reel.url"
            :active="index === currentIndex"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
$desktop-breakpoint: 801px;

.reels-panel {
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
}

// ── Empty state ──────────────────────────────────────────────────────────────
.reels-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex: 1;
  opacity: 0.45;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

// ── Desktop layout ───────────────────────────────────────────────────────────
.reels-panel__desktop {
  display: none;
}

.reels-panel__mobile-feed {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: contain;
}

.reels-panel__slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  box-sizing: border-box;
}

@media (min-width: $desktop-breakpoint) {
  .reels-panel__desktop {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    position: relative;
    gap: 0.5rem;
  }

  .reels-panel__mobile-feed {
    display: none;
  }

  .reels-panel__desktop-slide {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .reels-panel__nav-btn {
    flex-shrink: 0;
    opacity: 0.7;
    transition: opacity 0.15s;

    &:not(:disabled):hover {
      opacity: 1;
    }

    &:disabled {
      opacity: 0.2;
    }
  }

  .reels-panel__dots {
    display: flex;
    flex-direction: row;
    gap: 0.4rem;
    padding-bottom: 0.25rem;
  }

  .reels-panel__dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: rgba(var(--v-theme-on-surface), 0.25);
    transition: background 0.2s;

    &--active {
      background: rgba(var(--v-theme-on-surface), 0.8);
    }
  }
}
</style>
