<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { learnReels } from '@/lib/learnReels'
import type { LearnCategory } from '@/lib/learnMenu'
import SocialReelEmbed from './SocialReelEmbed.vue'

const props = defineProps<{
  category: LearnCategory
}>()

const reels = computed(() => learnReels[props.category] ?? [])
const currentIndex = ref(0)

// Reset to first reel when category changes
watch(() => props.category, () => {
  currentIndex.value = 0
  nextTick(() => feedRef.value?.scrollTo({ top: 0 }))
})

const feedRef = ref<HTMLElement | null>(null)

function scrollToIndex(index: number) {
  slideRefs.value[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function prev() {
  if (currentIndex.value > 0) scrollToIndex(currentIndex.value - 1)
}
function next() {
  if (currentIndex.value < reels.value.length - 1) scrollToIndex(currentIndex.value + 1)
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
          if (entry?.isIntersecting) currentIndex.value = index
        },
        { threshold: 0.6 },
      )
      o.observe(el)
      observers.push(o)
    })
  })
}

watch(reels, () => {
  slideRefs.value = []
  setupObservers()
  nextTick(() => feedRef.value?.scrollTo({ top: 0 }))
}, { immediate: true })

onBeforeUnmount(() => {
  observers.forEach((o) => o.disconnect())
  observers = []
})
</script>

<template>
  <div class="reels-panel">
    <div v-if="reels.length === 0" class="reels-panel__empty">
      <v-icon icon="fas fa-film" size="x-large" />
      <span>No videos yet — check back soon!</span>
    </div>

    <template v-else>
      <div class="reels-panel__shell">
        <!-- Scroll-snap feed (mobile + desktop) -->
        <div ref="feedRef" class="reels-panel__feed">
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

        <!-- Desktop: arrow helpers overlaid on the feed -->
        <div class="reels-panel__desktop-chrome">
          <div class="reels-panel__nav-group">
            <v-btn
              class="reels-panel__nav-btn"
              variant="text"
              icon
              size="large"
              :disabled="currentIndex === 0"
              aria-label="Previous reel"
              @click="prev"
            >
              <v-icon icon="fas fa-chevron-up" />
            </v-btn>

            <v-btn
              class="reels-panel__nav-btn"
              variant="text"
              icon
              size="large"
              :disabled="currentIndex === reels.length - 1"
              aria-label="Next reel"
              @click="next"
            >
              <v-icon icon="fas fa-chevron-down" />
            </v-btn>
          </div>

          <div class="reels-panel__dots">
            <span
              v-for="(_, i) in reels"
              :key="i"
              class="reels-panel__dot"
              :class="{ 'reels-panel__dot--active': i === currentIndex }"
            />
          </div>
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

// ── Scroll-snap feed ─────────────────────────────────────────────────────────
.reels-panel__shell {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.reels-panel__feed {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.reels-panel__slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  box-sizing: border-box;
}

.reels-panel__desktop-chrome {
  display: none;
}

@media (min-width: $desktop-breakpoint) {
  .reels-panel__desktop-chrome {
    display: block;
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }

  .reels-panel__nav-group {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0 2.75rem;
    pointer-events: none;

    .reels-panel__nav-btn {
      pointer-events: auto;
    }
  }

  .reels-panel__nav-btn {
    flex-shrink: 0;
    width: 3rem !important;
    height: 3rem !important;
    background: rgba(0, 0, 0, 0.55) !important;
    border-radius: 50% !important;
    opacity: 1;
    transition: opacity 0.15s, background 0.15s;

    :deep(.v-icon) {
      color: #fff !important;
    }

    &:not(:disabled):hover {
      background: rgba(0, 0, 0, 0.7) !important;
    }

    &:disabled {
      opacity: 0.35;
    }
  }

  .reels-panel__dots {
    position: absolute;
    bottom: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: row;
    gap: 0.4rem;
    pointer-events: auto;
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
