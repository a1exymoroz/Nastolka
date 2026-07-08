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
      name: 'game-selector',
      component: () => import('../views/GameSelector.vue'),
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
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'game-selector' }
  }
})

export default router
