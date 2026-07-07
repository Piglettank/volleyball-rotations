<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  label: string
  imagePath: string | null
  fallbackIcon: string
  active?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const imageError = ref(false)

function onImageError() {
  imageError.value = true
}

const showImage = () => props.imagePath !== null && !imageError.value
</script>

<template>
  <v-btn
    class="learn-menu-btn"
    :class="{ 'learn-menu-btn--active': active }"
    variant="outlined"
    density="comfortable"
    :aria-label="label"
    :aria-current="active ? 'page' : undefined"
    @click="emit('click')"
  >
    <span class="learn-menu-btn__content">
      <span class="learn-menu-btn__thumb-wrap">
        <img
          v-if="showImage()"
          class="learn-menu-btn__thumb"
          :src="imagePath!"
          :alt="label"
          width="56"
          height="56"
          @error="onImageError"
        />
        <v-icon v-else :icon="fallbackIcon" size="small" class="learn-menu-btn__icon" />
      </span>
      <span class="learn-menu-btn__label">{{ label }}</span>
    </span>
  </v-btn>
</template>

<style scoped lang="scss">
$btn-padding-v: 0.6rem;
$thumb-size: 3.5rem;

.learn-menu-btn {
  width: 100%;
  min-width: 0;
  height: auto !important;
  min-height: 3rem;
  // Left padding matches vertical so the image sits with equal breathing room
  padding: $btn-padding-v $btn-padding-v !important;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  border-color: rgba(var(--v-theme-on-surface), var(--v-field-border-opacity, 0.38)) !important;
  transition: border-color 0.15s, background 0.15s;

  :deep(.v-btn__content) {
    flex: none;
    width: 100%;
  }

  :deep(.v-icon) {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
  }

  &--active {
    border-color: rgba(var(--v-theme-primary), 0.7) !important;
    background: rgba(var(--v-theme-primary), 0.07) !important;
  }
}

.learn-menu-btn__content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  width: 100%;
}

.learn-menu-btn__thumb-wrap {
  flex-shrink: 0;
  width: $thumb-size;
  height: $thumb-size;
  display: flex;
  align-items: center;
  justify-content: center;
}

.learn-menu-btn__thumb {
  width: $thumb-size;
  height: $thumb-size;
  border-radius: 0.5rem;
  object-fit: cover;
  object-position: center;
  display: block;
}

.learn-menu-btn__label {
  font-family: var(--font-sport-display);
  font-size: 1.5rem;
  letter-spacing: 0.04em;
  line-height: 1;
  transform: translateY(0.05em);
}
</style>
