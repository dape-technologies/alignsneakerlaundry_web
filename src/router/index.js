import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import DashboardPage from '../views/DashboardPage.vue'
import OrdersPage from '../views/OrdersPage.vue'
import NewOrderPage from '../views/NewOrderPage.vue'
import OrderDetailPage from '../views/OrderDetailPage.vue'
import ClientsPage from '../views/ClientsPage.vue'
import ReportsPage from '../views/ReportsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage, meta: { guest: true } },
    { path: '/dashboard', component: DashboardPage, meta: { auth: true } },
    { path: '/orders', component: OrdersPage, meta: { auth: true } },
    { path: '/orders/new', component: NewOrderPage, meta: { auth: true } },
    { path: '/orders/:id', component: OrderDetailPage, meta: { auth: true } },
    { path: '/clients', component: ClientsPage, meta: { auth: true } },
    { path: '/reports', component: ReportsPage, meta: { auth: true, admin: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()

  if (to.meta.auth && !auth.isAuthenticated) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.admin && !auth.isAdmin) return '/dashboard'
  if (to.meta.guest && auth.isAuthenticated) return '/dashboard'
})

export default router
