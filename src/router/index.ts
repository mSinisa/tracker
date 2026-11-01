import { createRouter, createWebHistory } from 'vue-router'
import TodayView from '../views/TodayView.vue'
import CalendarView from '../views/CalendarView.vue'
import SettingsView from '../views/SettingsView.vue'

export const routes = [
  { path: '/', name: 'today', component: TodayView },
  { path: '/calendar', name: 'calendar', component: CalendarView },
  { path: '/settings', name: 'settings', component: SettingsView },
  // Any unknown address goes back to Today.
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
