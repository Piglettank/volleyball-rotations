<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <v-app class="app-shell">
    <RouterView class="app-shell__view" />
  </v-app>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: 100dvh;
}

.app-shell__view {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}
</style>
