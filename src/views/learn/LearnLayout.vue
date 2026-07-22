<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LearnMenuButton from '@/components/learn/LearnMenuButton.vue'
import { learnMenuItems } from '@/lib/learnMenu'
import { getHeroUrl } from '@/lib/heroes'

const router = useRouter()
const route = useRoute()
const heroUrl = getHeroUrl()

// On mobile, we show fullscreen reels when a skill category is active.
// Rotations navigates away entirely, so only reel routes trigger fullscreen.
const reelRouteNames = new Set(['learn-serve', 'learn-spike', 'learn-set', 'learn-receive'])
const isReelActive = computed(() => reelRouteNames.has(route.name as string))

function navigate(routeName: string) {
  router.push({ name: routeName })
}

function goHome() {
  router.push({ name: 'home' })
}

function closeReels() {
  router.push({ path: '/learn' })
}
</script>

<template>
  <v-main class="learn-main">
    <div class="learn" :class="{ 'learn--reel-open': isReelActive }">
      <aside class="learn__sidebar">
        <header class="learn__header">
          <h1 class="learn__title">Learn</h1>
        </header>

        <nav class="learn__menu" aria-label="Learn menu">
          <LearnMenuButton
            v-for="item in learnMenuItems"
            :key="item.category"
            :label="item.label"
            :image-path="item.imagePath"
            :fallback-icon="item.fallbackIcon"
            :active="route.name === item.routeName"
            @click="navigate(item.routeName)"
          />
        </nav>

        <v-btn
          class="learn__back-btn"
          variant="outlined"
          density="comfortable"
          aria-label="Back to main menu"
          @click="goHome"
        >
          <span class="learn__back-btn-content">
            <v-icon icon="fas fa-chevron-left" size="small" />
            <span class="learn__back-label">Back</span>
          </span>
        </v-btn>
      </aside>

      <div class="learn__content">
        <!-- Hero image — always present on desktop, blurs when a reel is active -->
        <div class="learn__hero" :class="{ 'learn__hero--blurred': isReelActive }">
          <img
            class="learn__hero-image"
            :src="heroUrl"
            alt=""
            width="1600"
            height="1067"
            decoding="async"
          />
        </div>

        <!-- Reel panel — fades in over the hero when a category is selected -->
        <div class="learn__reel-overlay" :class="{ 'learn__reel-overlay--visible': isReelActive }">
          <!-- Mobile close button — X in top right, only visible when reels are fullscreen -->
          <v-btn
            class="learn__close-btn"
            variant="text"
            icon
            aria-label="Close"
            @click="closeReels"
          >
            <v-icon icon="fas fa-xmark" size="large" />
          </v-btn>

          <RouterView />
        </div>
      </div>
    </div>
  </v-main>
</template>

<style scoped lang="scss">
$sidebar-width: min(36rem, 44vw);
$desktop-breakpoint: 801px;
$mobile-breakpoint: 640px;

.learn-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
  padding: 0 !important;
  background: rgb(var(--v-theme-background));
}

.learn {
  display: flex;
  flex-direction: row;
  flex: 1;
  width: 100%;
  min-height: 0;
  height: 100%;
}

.learn__sidebar {
  flex: 0 0 $sidebar-width;
  width: $sidebar-width;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
  padding: 1.25rem;
  background: rgb(var(--v-theme-surface));
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.learn__header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.learn__title {
  margin: 0;
  font-family: var(--font-sport-display);
  font-size: 2.75rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  line-height: 1;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  transform: translateY(0.06em);
}

.learn__menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.learn__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: rgb(var(--v-theme-surface-variant));
}

.learn__hero {
  position: absolute;
  inset: 0;
  transition:
    filter 0.5s ease,
    opacity 0.5s ease,
    transform 0.5s ease;

  &--blurred {
    filter: blur(14px);
    opacity: 0.5;
    transform: scale(1.06); // prevents hard edges from blur clipping
  }
}

.learn__hero-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.learn__reel-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease 0.1s; // slight delay so hero starts blurring first
  background: transparent;

  &--visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.learn__back-btn {
  width: 100%;
  min-width: 0;
  height: auto !important;
  min-height: 3rem;
  padding: 0.65rem 1rem !important;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  border-color: rgba(var(--v-theme-on-surface), var(--v-field-border-opacity, 0.38)) !important;

  :deep(.v-btn__content) {
    flex: none;
    width: 100%;
  }

  :deep(.v-icon) {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
  }
}

.learn__back-btn-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.65rem;
  width: 100%;
}

.learn__back-label {
  font-family: var(--font-sport-display);
  font-size: 1.375rem;
  letter-spacing: 0.04em;
  line-height: 1;
  transform: translateY(0.06em);
}

.learn__close-btn {
  display: none;
  position: absolute;
  top: max(0.75rem, env(safe-area-inset-top));
  right: max(0.75rem, env(safe-area-inset-right));
  z-index: 10;
  width: 3.25rem !important;
  height: 3.25rem !important;
  background: rgba(0, 0, 0, 0.55) !important;
  border-radius: 50% !important;

  :deep(.v-icon) {
    color: #fff !important;
  }
}

// Show on desktop when a reel is active
@media (min-width: $desktop-breakpoint) {
  .learn--reel-open .learn__close-btn {
    display: inline-flex;
  }
}

// ── Desktop tweak ──────────────────────────────────────────────────────────
@media (max-width: ($desktop-breakpoint - 1px)) {
  .learn__sidebar {
    padding: 0.75rem;
  }
}

// ── Mobile layout ──────────────────────────────────────────────────────────
@media (max-width: $mobile-breakpoint) {
  .learn {
    flex-direction: column;
  }

  .learn__sidebar {
    flex: 1;
    width: 100%;
    border-right: none;
    border-bottom: none;
    justify-content: center;
  }

  .learn__content {
    // Default: hidden when no reel is active (sidebar fills the screen)
    display: none;
  }

  // When a reel category route is active, content becomes a fullscreen overlay
  .learn--reel-open {
    .learn__sidebar {
      display: none;
    }

    .learn__content {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: block;
    }

    .learn__reel-overlay {
      background: rgb(var(--v-theme-background));
    }

    .learn__close-btn {
      display: inline-flex;
    }
  }
}

// Between 641px and 800px — sidebar full width, reels fullscreen overlay
@media (min-width: ($mobile-breakpoint + 1px)) and (max-width: ($desktop-breakpoint - 1px)) {
  .learn {
    flex-direction: column;
  }

  .learn__sidebar {
    flex: 1;
    width: 100%;
    border-right: none;
    border-bottom: none;
    justify-content: center;
  }

  .learn__content {
    display: none;
  }

  .learn--reel-open {
    .learn__sidebar {
      display: none;
    }

    .learn__content {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: block;
    }

    .learn__reel-overlay {
      background: rgb(var(--v-theme-background));
    }

    .learn__close-btn {
      display: inline-flex;
    }
  }
}
</style>
