<script setup lang="ts">
import ReelsPanel from '@/components/learn/ReelsPanel.vue'
import type { LearnCategory } from '@/lib/learnMenu'

defineProps<{
  category: LearnCategory
}>()
</script>

<template>
  <div class="reels-view">
    <ReelsPanel :category="category" />
  </div>
</template>

<style scoped lang="scss">
.reels-view {
  display: flex;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
</style>
