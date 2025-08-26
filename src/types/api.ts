import type { Database } from './database'

// Database table types
export type User = Database['public']['Tables']['users']['Row']
export type Memory = Database['public']['Tables']['memories']['Row']
export type Interaction = Database['public']['Tables']['interactions']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type MemoryInsert = Database['public']['Tables']['memories']['Insert']
export type InteractionInsert = Database['public']['Tables']['interactions']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type MemoryUpdate = Database['public']['Tables']['memories']['Update']
export type InteractionUpdate = Database['public']['Tables']['interactions']['Update']

// Memory types
export type MemoryType = 'profile' | 'preference' | 'goal' | 'skill' | 'fact'

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface HealthResponse {
  ok: boolean
  timestamp: string
}

export interface MemoryResponse {
  id: string
  success: boolean
}

export interface MemoriesListResponse {
  memories: Memory[]
  total: number
  page: number
  totalPages: number
}

// API Request types
export interface CreateMemoryRequest {
  type: MemoryType
  content: string
  importance?: number
  source?: Record<string, unknown>
}

export interface GetMemoriesRequest {
  page?: number
  limit?: number
  type?: MemoryType
}

export interface UpdateMemoryRequest {
  type?: MemoryType
  content?: string
  importance?: number
  source?: Record<string, unknown>
}

// Onboarding types
export interface OnboardingQuestion {
  id: string
  question: string
  type: 'text' | 'textarea' | 'select' | 'multiselect'
  options?: string[]
  memoryType: MemoryType
  required: boolean
}

export interface OnboardingAnswer {
  questionId: string
  answer: string | string[]
}

export interface OnboardingData {
  answers: OnboardingAnswer[]
}

// Auth types
export interface AuthCredentials {
  email: string
  password: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  displayName?: string
}

export interface AuthUser {
  id: string
  email: string
  displayName?: string
}