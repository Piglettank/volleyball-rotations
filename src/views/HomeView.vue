<script setup lang="ts">
import { useRouter } from 'vue-router'
import { getHeroUrl } from '@/lib/heroes'

const router = useRouter()
const heroUrl = getHeroUrl()

function goToPlay() {
  router.push({ name: 'play' })
}

function goToLearn() {
  // Learn hub (serve/spike/set/receive) is hidden for now — go straight to rotations.
  router.push({ name: 'learn-rotations' })
}
</script>

<template>
  <v-main class="home-main">
    <div class="home">
      <aside class="home__sidebar">
        <header class="home__header">
          <img class="home__icon" src="/favicon.ico" alt="" width="52" height="52" />
          <h1 class="home__title">Volley Rotations</h1>
        </header>

        <nav class="home__menu" aria-label="Main menu">
          <v-btn
            class="home__menu-btn"
            variant="outlined"
            density="comfortable"
            aria-label="Play"
            @click="goToPlay"
          >
            <span class="home__menu-btn-content">
              <v-icon icon="fas fa-play" size="small" />
              <span class="home__menu-label">Play</span>
            </span>
          </v-btn>

          <v-btn class="home__menu-btn" variant="outlined" density="comfortable" @click="goToLearn">
            <span class="home__menu-btn-content">
              <v-icon icon="fas fa-graduation-cap" size="small" />
              <span class="home__menu-label">Learn</span>
            </span>
          </v-btn>
        </nav>
      </aside>

      <div class="home__hero" aria-hidden="true">
        <img
          class="home__hero-image"
          :src="heroUrl"
          alt=""
          width="1600"
          height="1067"
          decoding="async"
        />
      </div>
    </div>
  </v-main>
</template>

<style scoped lang="scss">
$sidebar-width: min(36rem, 44vw);
$desktop-breakpoint: 801px;
$mobile-breakpoint: 640px;

.home-main {
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

.home {
  display: flex;
  flex-direction: row;
  flex: 1;
  width: 100%;
  min-height: 0;
  height: 100%;
}

.home__sidebar {
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

.home__header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.home__icon {
  flex-shrink: 0;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
}

.home__title {
  margin: 0;
  font-family: var(--font-sport-display);
  font-size: 2.75rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  line-height: 1;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  transform: translateY(0.06em);
}

.home__menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.home__menu-btn {
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

.home__menu-btn-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.65rem;
  width: 100%;
}

.home__menu-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
}

.home__menu-label {
  font-family: var(--font-sport-display);
  font-size: 1.375rem;
  letter-spacing: 0.04em;
  line-height: 1;
  // Adjusted for font offset
  transform: translateY(0.05em);
}

.home__menu-hint {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
  opacity: 0.55;
}

.home__hero {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: rgb(var(--v-theme-surface-variant));
}

.home__hero-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

@media (max-width: ($desktop-breakpoint - 1px)) {
  .home__sidebar {
    padding: 0.75rem;
  }
}

@media (max-width: $mobile-breakpoint) {
  .home__icon {
    width: 3rem;
    height: 3rem;
  }

  .home__title {
    font-size: 2.5rem;
  }

  .home {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    min-height: 0;
    height: 100%;
  }

  // Hero fills all space above the bottom menu box
  .home__hero {
    order: 1;
    flex: 1;
    min-height: 0;
  }

  // Bottom menu box — hugs its content, even padding on all sides
  .home__sidebar {
    order: 2;
    flex: 0 0 auto;
    width: 100%;
    border-right: none;
    border-bottom: none;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    justify-content: center;
    position: relative;
    z-index: 1;
    border-radius: 1.25rem 1.25rem 0 0;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
    padding: 1.5rem;
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 1.5rem));
  }
}
</style>
