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
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'profile' | 'preference' | 'goal' | 'skill' | 'fact'
          content: string
          importance?: number
          source?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'profile' | 'preference' | 'goal' | 'skill' | 'fact'
          content?: string
          importance?: number
          source?: Json
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}