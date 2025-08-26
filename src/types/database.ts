export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          id: string
          user_id: string
          type: 'profile' | 'preference' | 'goal' | 'skill' | 'fact'
          content: string
          importance: number
          source: Json
          sentiment: 'positive' | 'negative' | 'neutral'
          confidence: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'profile' | 'preference' | 'goal' | 'skill' | 'fact'
          content: string
          importance?: number
          source?: Json
          sentiment?: 'positive' | 'negative' | 'neutral'
          confidence?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'profile' | 'preference' | 'goal' | 'skill' | 'fact'
          content?: string
          importance?: number
          source?: Json
          sentiment?: 'positive' | 'negative' | 'neutral'
          confidence?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      interactions: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant' | 'consciousness'
          content: string
          meta: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'user' | 'assistant' | 'consciousness'
          content: string
          meta?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'user' | 'assistant' | 'consciousness'
          content?: string
          meta?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      memory_embeddings: {
        Row: {
          id: string
          memory_id: string
          embedding: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          embedding: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          embedding?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_embeddings_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      semantic_search_memories: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          user_id: string
        }
        Returns: {
          id: string
          user_id: string
          type: 'profile' | 'preference' | 'goal' | 'skill' | 'fact'
          content: string
          importance: number
          source: Json
          sentiment: 'positive' | 'negative' | 'neutral'
          confidence: number
          created_at: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}