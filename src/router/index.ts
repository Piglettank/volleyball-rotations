import { createRouter, createWebHistory } from 'vue-router'
import { useMatchStore } from '@/stores/match'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Bolleyvoll' },
      beforeEnter: (to) => {
        if (to.query.rotation || to.query.p) {
          return { path: '/learn/rotations', query: to.query }
        }
      },
    },
    {
      path: '/learn',
      component: () => import('@/views/learn/LearnLayout.vue'),
      meta: { title: 'Learn — Bolleyvoll' },
      children: [
        { path: '' }, // no default selection — hero shown instead
        {
          path: 'serve',
          name: 'learn-serve',
          component: () => import('@/views/learn/LearnReelsView.vue'),
          props: { category: 'serve' },
          meta: { title: 'Serve — Bolleyvoll' },
        },
        {
          path: 'spike',
          name: 'learn-spike',
          component: () => import('@/views/learn/LearnReelsView.vue'),
          props: { category: 'spike' },
          meta: { title: 'Spike — Bolleyvoll' },
        },
        {
          path: 'set',
          name: 'learn-set',
          component: () => import('@/views/learn/LearnReelsView.vue'),
          props: { category: 'set' },
          meta: { title: 'Set — Bolleyvoll' },
        },
        {
          path: 'receive',
          name: 'learn-receive',
          component: () => import('@/views/learn/LearnReelsView.vue'),
          props: { category: 'receive' },
          meta: { title: 'Receive — Bolleyvoll' },
        },
      ],
    },
    {
      path: '/learn/rotations',
      name: 'learn-rotations',
      component: () => import('@/views/learn/RotationsView.vue'),
      meta: { title: 'Rotations — Bolleyvoll' },
    },
    {
      path: '/play',
      name: 'play',
      component: () => import('@/views/play/MatchView.vue'),
      meta: { title: 'Match — Bolleyvoll' },
      beforeEnter: () => {
        const matchStore = useMatchStore()
        if (!matchStore.isActive) {
          matchStore.startMatch()
        }
      },
    },
  ],
})

router.afterEach((to) => {
  const title = to.meta.title
  if (typeof title === 'string') {
    document.title = title
  }
})

export default router
