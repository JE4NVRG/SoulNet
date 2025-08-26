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
export type SentimentType = 'positive' | 'negative' | 'neutral'

// Sentiment analysis types
export interface SentimentAnalysis {
  sentiment: SentimentType
  confidence: number
}

export interface SentimentStats {
  positive: number
  negative: number
  neutral: number
  total: number
}

export interface SentimentTrend {
  date: string
  positive: number
  negative: number
  neutral: number
}

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
  newAchievements?: AchievementType[]
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

// Semantic search types
export interface SemanticSearchRequest {
  query: string
  k?: number
}

export interface SemanticSearchResponse {
  memories: Array<Memory & { similarity: number }>
  query: string
  total: number
}

export interface GenerateEmbeddingsRequest {
  ids: string[]
}

export interface GenerateEmbeddingsResponse {
  success: boolean
  processed: number
  failed: number
  errors: string[]
}

// Memory embedding types
export interface MemoryEmbedding {
  id: string
  memory_id: string
  embedding: number[]
  created_at: string
  updated_at: string
}

// Achievement types
export type AchievementType = 'primeira_memoria' | 'reflexivo' | 'nostalgico' | 'explorador'

export interface Achievement {
  id: string
  user_id: string
  achievement_type: AchievementType
  unlocked_at: string | null
  progress: number
  created_at: string
}

export interface AchievementDefinition {
  type: AchievementType
  name: string
  description: string
  icon: string
  requirement: string
  maxProgress: number
}

export interface AchievementResponse {
  achievements: Achievement[]
  definitions: AchievementDefinition[]
}

export interface UnlockedAchievement {
  type: AchievementType
  isNew: boolean
  progress: number
}