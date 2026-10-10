import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const LoginPage = () => import('../views/LoginPage.vue')
const DashboardPage = () => import('../views/DashboardPage.vue')
const OrdersPage = () => import('../views/OrdersPage.vue')
const NewOrderPage = () => import('../views/NewOrderPage.vue')
const OrderDetailPage = () => import('../views/OrderDetailPage.vue')
const ClientsPage = () => import('../views/ClientsPage.vue')
const ClientDetailPage = () => import('../views/ClientDetailPage.vue')
const ReportsPage = () => import('../views/ReportsPage.vue')
const NotFoundPage = () => import('../views/NotFoundPage.vue')

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage, meta: { guest: true } },
    { path: '/dashboard', component: DashboardPage, meta: { auth: true } },
    { path: '/orders', component: OrdersPage, meta: { auth: true } },
    { path: '/orders/new', component: NewOrderPage, meta: { auth: true } },
    { path: '/orders/:id', component: OrderDetailPage, meta: { auth: true } },
    { path: '/clients', component: ClientsPage, meta: { auth: true } },
    { path: '/clients/:id', component: ClientDetailPage, meta: { auth: true } },
    { path: '/reports', component: ReportsPage, meta: { auth: true, admin: true } },
    { path: '/:pathMatch(.*)*', component: NotFoundPage },
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
