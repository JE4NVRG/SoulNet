import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, signUp, signIn, signOut, getCurrentUser, getSession } from '../lib/supabaseClient'
import type { AuthCredentials } from '../types/api'

interface AuthState {
  // State
  user: User | null
  session: Session | null
  loading: boolean
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  
  // Actions
  login: (credentials: AuthCredentials) => Promise<{ success: boolean; error?: string }>
  register: (credentials: AuthCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    // Initial state
    user: null,
    session: null,
    loading: false,
    get isLoading() { return get().loading },
    error: null,
    isAuthenticated: false,

    // Login action
    login: async (credentials: AuthCredentials) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await signIn(credentials.email, credentials.password)
        
        if (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
        
        set({ 
          user: data.user, 
          session: data.session, 
          loading: false, 
          error: null, 
          isAuthenticated: !!data.user 
        })
        
        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed'
        set({ loading: false, error: errorMessage })
        return { success: false, error: errorMessage }
      }
    },

    // Register action
    register: async (credentials: AuthCredentials) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await signUp(credentials.email, credentials.password)
        
        if (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
        
        set({ 
          user: data.user, 
          session: data.session, 
          loading: false, 
          error: null, 
          isAuthenticated: !!data.user 
        })
        
        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed'
        set({ loading: false, error: errorMessage })
        return { success: false, error: errorMessage }
      }
    },

    // Logout action
    logout: async () => {
      set({ loading: true })
      
      try {
        await signOut()
        set({ 
          user: null, 
          session: null, 
          loading: false, 
          error: null, 
          isAuthenticated: false 
        })
      } catch (error) {
        console.error('Logout error:', error)
        // Even if logout fails, clear local state
        set({ 
          user: null, 
          session: null, 
          loading: false, 
          error: null, 
          isAuthenticated: false 
        })
      }
    },

    // Check authentication status
    checkAuth: async () => {
      set({ loading: true })
      
      try {
        const { session } = await getSession()
        const { user } = await getCurrentUser()
        
        set({ 
          user, 
          session, 
          loading: false, 
          isAuthenticated: !!user 
        })
      } catch (error) {
        console.error('Auth check error:', error)
        set({ 
          user: null, 
          session: null, 
          loading: false, 
          isAuthenticated: false 
        })
      }
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Set loading state
    setLoading: (loading: boolean) => set({ loading })
  }),
  {
    name: 'soulnet-auth',
    partialize: (state) => ({ 
      user: state.user, 
      session: state.session, 
      isAuthenticated: state.isAuthenticated 
    })
  }
))

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  const { user } = session || { user: null }
  
  useAuthStore.setState({ 
    user, 
    session, 
    isAuthenticated: !!user,
    loading: false 
  })
  
  if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ 
      user: null, 
      session: null, 
      isAuthenticated: false 
    })
  }
})