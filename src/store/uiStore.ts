import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface UIState {
  // Theme state
  theme: Theme
  
  // Navigation state
  sidebarOpen: boolean
  
  // Loading states
  pageLoading: boolean
  
  // Actions
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setPageLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>()(persist(
  (set, get) => ({
    // Initial state
    theme: 'dark',
    sidebarOpen: false,
    pageLoading: false,

    // Toggle theme between light and dark
    toggleTheme: () => {
      const currentTheme = get().theme
      const newTheme = currentTheme === 'light' ? 'dark' : 'light'
      set({ theme: newTheme })
      
      // Apply theme to document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },

    // Set specific theme
    setTheme: (theme: Theme) => {
      set({ theme })
      
      // Apply theme to document
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },

    // Toggle sidebar
    toggleSidebar: () => {
      set((state) => ({ sidebarOpen: !state.sidebarOpen }))
    },

    // Set sidebar open state
    setSidebarOpen: (open: boolean) => {
      set({ sidebarOpen: open })
    },

    // Set page loading state
    setPageLoading: (loading: boolean) => {
      set({ pageLoading: loading })
    }
  }),
  {
    name: 'soulnet-ui',
    partialize: (state) => ({ 
      theme: state.theme,
      sidebarOpen: state.sidebarOpen
    })
  }
))

// Initialize theme on app start
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('soulnet-ui')
  if (storedTheme) {
    try {
      const { state } = JSON.parse(storedTheme)
      if (state?.theme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    } catch (error) {
      console.error('Error parsing stored theme:', error)
    }
  }
}