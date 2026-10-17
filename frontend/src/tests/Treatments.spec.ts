import Treatments from '@/components/people/Treatments.vue'
import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

// Mock child components to isolate the test to Treatments.vue logic
vi.mock('@/components/people/FoldersTableOpen.vue', () => ({
  default: { template: '<div data-test="folders-table-open"></div>' }
}))
vi.mock('@/components/people/FoldersTableClosed.vue', () => ({
  default: { template: '<div data-test="folders-table-closed"></div>' }
}))

describe('Treatments.vue', () => {
  it('displays select person message when no person is active', () => {
    const wrapper = mount(Treatments, {
      global: {
        plugins: [createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            app: { activePerson: {} } // Empty person
          }
        })],
        mocks: {
          $t: (msg: string) => msg
        }
      }
    })

    // Find the h2 element that contains the message
    const headers = wrapper.findAll('h2')
    const msgHeader = headers.find(h => h.text() === 'selectPersonForDetails')
    
    expect(msgHeader).toBeDefined()
    expect(msgHeader?.isVisible()).toBe(true)
  })

  it('displays treatments tables when person is active', () => {
    const wrapper = mount(Treatments, {
      global: {
        plugins: [createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            app: {
              activePerson: {
                id: 1,
                firstName: 'Test',
                lastName: 'Person',
                folderNumber: 'TP-001'
              }
            }
          }
        })],
        mocks: {
          $t: (msg: string) => msg
        }
      }
    })

    expect(wrapper.text()).toContain('Test Person')
    expect(wrapper.text()).toContain('Folder_Number TP-001')
    
    // Check if child components are rendered and visible
    const openTable = wrapper.find('[data-test="folders-table-open"]')
    expect(openTable.exists()).toBe(true)
    expect(openTable.isVisible()).toBe(true)

    // Check that the select person message is hidden
    const headers = wrapper.findAll('h2')
    const msgHeader = headers.find(h => h.text() === 'selectPersonForDetails')
    
    // With v-if, the element should not exist in the DOM
    expect(msgHeader).toBeUndefined()
  })
})