<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import {
  parseReelSource,
  extractYouTubeId,
  extractInstagramShortcode,
  extractTikTokVideoId,
} from '@/lib/learnReels'

const props = defineProps<{
  url: string
  active: boolean
}>()

const source = computed(() => parseReelSource(props.url))

// YouTube — swap src to include autoplay/loop when active
const youtubeEmbedSrc = computed(() => {
  if (source.value !== 'youtube') return null
  const id = extractYouTubeId(props.url)
  if (!id) return null
  return props.active
    ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&rel=0&controls=0&playsinline=1&iv_load_policy=3`
    : `https://www.youtube.com/embed/${id}?rel=0&controls=0&playsinline=1&iv_load_policy=3`
})

// Instagram — clear src when inactive to stop playback
const instagramEmbedSrc = computed(() => {
  if (source.value !== 'instagram') return null
  if (!props.active) return ''
  const shortcode = extractInstagramShortcode(props.url)
  return shortcode ? `https://www.instagram.com/reel/${shortcode}/embed/?hidecaption=1` : null
})

const tiktokVideoId = computed(() => {
  if (source.value !== 'tiktok') return null
  return extractTikTokVideoId(props.url)
})

function loadTikTokScript() {
  if (document.getElementById('tiktok-embed-script')) {
    return
  }
  const script = document.createElement('script')
  script.id = 'tiktok-embed-script'
  script.src = 'https://www.tiktok.com/embed.js'
  script.async = true
  document.body.appendChild(script)
}

onMounted(() => {
  if (source.value === 'tiktok') loadTikTokScript()
})
watch(source, (s) => {
  if (s === 'tiktok') loadTikTokScript()
})
</script>

<template>
  <div class="reel-embed">
    <!-- YouTube Shorts -->
    <template v-if="source === 'youtube' && youtubeEmbedSrc">
      <iframe
        class="reel-embed__youtube"
        :src="youtubeEmbedSrc"
        frameborder="0"
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
        "
        allowfullscreen
        title="YouTube Shorts"
      />
    </template>

    <!-- Instagram Reel — clip wrapper crops header + engagement chrome -->
    <template v-else-if="source === 'instagram' && instagramEmbedSrc !== null">
      <div class="reel-embed__instagram-clip">
        <iframe
          class="reel-embed__instagram"
          :src="instagramEmbedSrc"
          frameborder="0"
          scrolling="no"
          allowtransparency
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
          title="Instagram Reel"
        />
      </div>
    </template>

    <!-- TikTok — embed.js autoplays natively, no src control available -->
    <template v-else-if="source === 'tiktok' && tiktokVideoId">
      <blockquote
        class="tiktok-embed reel-embed__tiktok"
        :cite="url"
        :data-video-id="tiktokVideoId"
      >
        <section />
      </blockquote>
    </template>

    <div v-else class="reel-embed__unsupported">
      <v-icon icon="fas fa-video-slash" size="large" />
      <span>Unable to load video</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reel-embed {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.reel-embed__youtube {
  width: min(360px, 90vw);
  // 9:16 aspect ratio for Shorts
  height: min(640px, calc(90vw * 16 / 9));
  border: none;
  border-radius: 0.75rem;
}

.reel-embed__instagram-clip {
  // Viewport is video-only (9:16). Instagram chrome is cropped via iframe offset.
  width: min(360px, 90vw);
  aspect-ratio: 9 / 16;
  overflow: hidden;
  border-radius: 0.75rem;
  position: relative;
  background: #000;
}

.reel-embed__instagram {
  position: absolute;
  // Profile header ~8.5%, engagement footer ~27% of the video viewport height.
  top: -9%;
  left: -22%;
  width: 145%;
  height: 160%;
  border: none;
  display: block;
}

.reel-embed__tiktok {
  max-width: 325px;
  width: 100%;
}

.reel-embed__unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
