import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      name: 'locations',
      component: () => import('../views/Locations.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/Admin.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/games/:id',
      name: 'game-detail',
      component: () => import('../views/GameDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/locations/:id',
      name: 'location-detail',
      component: () => import('../views/LocationDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/locations/:id/play',
      name: 'location-play',
      component: () => import('../views/GameSelector.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/locations/:id/history/new',
      name: 'location-history-new',
      component: () => import('../views/HistoryForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/locations/:id/history/:historyId/edit',
      name: 'location-history-edit',
      component: () => import('../views/HistoryForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dice-playground',
      name: 'dice-playground',
      component: () => import('../views/DicePlayground.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/physics-with-rapier-and-three-variations',
      name: 'physics-with-rapier-and-three-variations',
      component: () => import('../views/PhysicsWithRapierAndThreeVariations.vue'),
      // meta: { requiresAuth: true },
    },
    {
      path: '/stack',
      name: 'stack',
      component: () => import('../views/Stack.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'locations' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: auth.isAdmin ? 'admin' : 'locations' }
  }
})

export default router
