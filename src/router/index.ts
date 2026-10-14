import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { locale, t, type MessageKey } from '@/i18n'
import { useMatchStore } from '@/stores/match'

declare module 'vue-router' {
  interface RouteMeta {
    titleKey?: MessageKey
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { titleKey: 'title.home' },
      beforeEnter: (to) => {
        if (to.query.rotation || to.query.p) {
          return { path: '/learn/rotations', query: to.query }
        }
      },
    },
    {
      path: '/learn',
      component: () => import('@/views/learn/LearnLayout.vue'),
      meta: { titleKey: 'title.learn' },
      children: [
        {
          path: 'serve',
          name: 'learn-serve',
          component: () => import('@/views/learn/LearnReelsView.vue'),
          props: { category: 'serve' },
          meta: { titleKey: 'title.serve' },
        },
        {
          path: 'spike',
          name: 'learn-spike',
          component: () => import('@/views/learn/LearnReelsView.vue'),
          props: { category: 'spike' },
          meta: { titleKey: 'title.spike' },
        },
        {
          path: 'set',
          name: 'learn-set',
          component: () => import('@/views/learn/LearnReelsView.vue'),
          props: { category: 'set' },
          meta: { titleKey: 'title.set' },
        },
        {
          path: 'receive',
          name: 'learn-receive',
          component: () => import('@/views/learn/LearnReelsView.vue'),
          props: { category: 'receive' },
          meta: { titleKey: 'title.receive' },
        },
      ],
    },
    {
      path: '/learn/rotations',
      name: 'learn-rotations',
      component: () => import('@/views/learn/RotationsView.vue'),
      meta: { titleKey: 'title.rotations' },
    },
    {
      path: '/play',
      name: 'play',
      component: () => import('@/views/play/MatchView.vue'),
      meta: { titleKey: 'title.match' },
      beforeEnter: () => {
        const matchStore = useMatchStore()
        if (!matchStore.isActive) {
          matchStore.startMatch()
        }
      },
      children: [
        { path: 'players', name: 'play-players' },
      ],
    },
  ],
})

function updateDocumentTitle() {
  const titleKey = router.currentRoute.value.meta.titleKey
  if (titleKey) {
    document.title = t(titleKey)
  }
}

router.afterEach(updateDocumentTitle)
watch(locale, updateDocumentTitle)

export default router
