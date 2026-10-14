<script setup lang="ts">
import { useId } from 'vue'

import { locale, t, toggleLocale } from '@/i18n'

// Unique clip-path ids so several toggles can coexist on one page.
const id = useId()
const ukClipId = `${id}-uk-clip`
const ukDiagonalClipId = `${id}-uk-diagonal`
</script>

<template>
  <button
    class="language-toggle"
    type="button"
    :aria-label="t('language.switch')"
    :title="t('language.switch')"
    @click="toggleLocale"
  >
    <svg
      v-if="locale === 'sv'"
      class="language-toggle__flag"
      viewBox="0 0 16 10"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="16" height="10" fill="#006aa7" />
      <rect x="5" width="2" height="10" fill="#fecc02" />
      <rect y="4" width="16" height="2" fill="#fecc02" />
    </svg>
    <svg
      v-else
      class="language-toggle__flag"
      viewBox="0 0 60 30"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <clipPath :id="ukClipId">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath :id="ukDiagonalClipId">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g :clip-path="`url(#${ukClipId})`">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" stroke-width="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          :clip-path="`url(#${ukDiagonalClipId})`"
          stroke="#c8102e"
          stroke-width="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" stroke-width="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6" />
      </g>
    </svg>
  </button>
</template>

<style scoped lang="scss">
$desktop-breakpoint: 801px;

.language-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(6px);
  cursor: pointer;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.92);
  }
}

// Desktop: sits on the white side panel — outlined like the main menu buttons
@media (min-width: $desktop-breakpoint) {
  .language-toggle {
    // Same effective tone as the v-select outline (high-emphasis color × field border opacity)
    border: 1px solid
      rgba(
        var(--v-theme-on-surface),
        calc(var(--v-high-emphasis-opacity, 0.87) * var(--v-field-border-opacity, 0.38))
      );
    background: transparent;
    backdrop-filter: none;
    box-shadow: none;

    &:hover {
      background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity, 0.04));
    }
  }
}

.language-toggle__flag {
  display: block;
  width: 1.5rem;
  height: 1rem;
  border-radius: 0.15rem;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}
</style>
