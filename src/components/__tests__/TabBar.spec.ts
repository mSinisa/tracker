import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import TabBar from '../TabBar.vue'

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<p>today</p>' } },
      { path: '/calendar', component: { template: '<p>calendar</p>' } },
      { path: '/settings', component: { template: '<p>settings</p>' } },
    ],
  })
  await router.push(path)
  const wrapper = mount(TabBar, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('TabBar', () => {
  it('shows the Today, Calendar and Settings tabs', async () => {
    const { wrapper } = await mountAt('/')
    expect(wrapper.findAll('a').map((a) => a.text())).toEqual(['Today', 'Calendar', 'Settings'])
  })

  it('marks the tab of the current page', async () => {
    const { wrapper } = await mountAt('/calendar')
    expect(wrapper.get('.router-link-exact-active').text()).toBe('Calendar')
  })

  it('switches section when a tab is tapped', async () => {
    const { wrapper, router } = await mountAt('/')
    await wrapper.findAll('a')[1]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/calendar')
  })
})
