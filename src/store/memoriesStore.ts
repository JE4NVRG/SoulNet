import { create } from 'zustand'
import type { Memory, CreateMemoryRequest, UpdateMemoryRequest, GetMemoriesRequest, MemoryType, MemoryResponse } from '../types/api'
import { toast } from 'sonner'
import { Trophy } from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/apiClient'

interface MemoriesState {
  // State
  memories: Memory[]
  loading: boolean
  error: string | null
  total: number
  page: number
  totalPages: number
  
  // Filters
  currentType: MemoryType | null
  typeFilter: string
  
  // Actions
  fetchMemories: (params?: GetMemoriesRequest) => Promise<void>
  createMemory: (memory: CreateMemoryRequest) => Promise<{ success: boolean; error?: string }>
  updateMemory: (id: string, memory: UpdateMemoryRequest) => Promise<{ success: boolean; error?: string }>
  deleteMemory: (id: string) => Promise<{ success: boolean; error?: string }>
  setFilter: (type: MemoryType | null) => void
  setTypeFilter: (type: string) => void
  clearError: () => void
  reset: () => void
  resetStore: () => void
}

export const useMemoriesStore = create<MemoriesState>()((set, get) => ({
  // Initial state
  memories: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 0,
  currentType: null,
  get typeFilter() { return get().currentType || 'all' },

  // Fetch memories from API
  fetchMemories: async (params?: GetMemoriesRequest) => {
    set({ loading: true, error: null })
    
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.type) queryParams.append('type', params.type)
      
      const data = await apiGet('/api/memories', Object.fromEntries(queryParams))
      
      set({ 
        memories: data.memories || [],
        total: data.total || 0,
        page: data.page || 1,
        totalPages: data.totalPages || 0,
        loading: false,
        error: null
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch memories'
      set({ loading: false, error: errorMessage })
    }
  },

  // Create new memory
  createMemory: async (memory: CreateMemoryRequest) => {
    set({ loading: true, error: null })
    
    try {
      const data: MemoryResponse = await apiPost('/api/memories', memory)
      
      // Show achievement notifications if any new achievements were unlocked
      if (data.newAchievements && data.newAchievements.length > 0) {
        data.newAchievements.forEach(achievementType => {
          const achievementNames = {
            'primeira_memoria': 'Primeira Memória',
            'reflexivo': 'Reflexivo',
            'nostalgico': 'Nostálgico',
            'explorador': 'Explorador'
          }
          
          toast.success(`🏆 Conquista desbloqueada: ${achievementNames[achievementType]}!`, {
            description: 'Parabéns! Você desbloqueou uma nova conquista.',
            duration: 5000,
          })
        })
      }
      
      // Refresh memories list after creation
      await get().fetchMemories({ type: get().currentType || undefined })
      
      set({ loading: false, error: null })
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create memory'
      set({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  // Update memory
  updateMemory: async (id: string, memory: UpdateMemoryRequest) => {
    set({ loading: true, error: null })
    
    try {
      await apiPut(`/api/memories/${id}`, memory)
      
      // Refresh memories list after update
      await get().fetchMemories({ type: get().currentType || undefined })
      
      set({ loading: false, error: null })
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update memory'
      set({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  // Delete memory
  deleteMemory: async (id: string) => {
    set({ loading: true, error: null })
    
    try {
      await apiDelete(`/api/memories/${id}`)
      
      // Remove memory from local state
      set((state) => ({
        memories: state.memories.filter(memory => memory.id !== id),
        total: Math.max(0, state.total - 1),
        loading: false,
        error: null
      }))
      
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete memory'
      set({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  // Set type filter
  setFilter: (type: MemoryType | null) => {
    set({ currentType: type })
    // Automatically fetch memories with new filter
    get().fetchMemories({ type: type || undefined })
  },

  // Set type filter (alias for UI compatibility)
  setTypeFilter: (type: string) => {
    const filterType = type === 'all' ? null : type as MemoryType
    get().setFilter(filterType)
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    memories: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    totalPages: 0,
    currentType: null
  }),

  // Reset store (alias)
  resetStore: () => get().reset()
}))