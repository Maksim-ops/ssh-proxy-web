import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import UserView from '../views/UserView.vue'
import StreamView from '../views/StreamView.vue'
import ShareView from '../views/ShareView.vue'
import { authStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, adminOnly: true } },
    { path: '/app', name: 'user', component: UserView, meta: { requiresAuth: true } },
    { path: '/stream', name: 'stream', component: StreamView, meta: { requiresAuth: true } },
    { path: '/share', name: 'share', component: ShareView },
  ],
})

router.beforeEach(async (to) => {
  if (!authStore.state.ready) {
    await authStore.hydrate()
  }

  const loggedIn = Boolean(authStore.state.token && authStore.state.user)
  const isAdmin = authStore.state.user?.role === 'admin'

  if (to.path === '/login' && loggedIn) {
    return isAdmin ? '/admin' : '/app'
  }

  if (to.meta.requiresAuth && !loggedIn) {
    return '/login'
  }

  if (to.meta.adminOnly && !isAdmin) {
    return '/app'
  }

  return true
})

export default router
