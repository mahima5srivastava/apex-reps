export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: string
          sex: 'male' | 'female'
          height: number
        }
        Insert: {
          id?: string
          name?: string
          role?: string
          sex?: 'male' | 'female'
          height?: number
        }
        Update: {
          id?: string
          name?: string
          role?: string
          sex?: 'male' | 'female'
          height?: number
        }
        Relationships: []
      }
      stats: {
        Row: {
          id: string
          user_id: string
          weight: number
          waist: number
          hip: number
          neck: number
          bfp: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          weight: number
          waist: number
          hip: number
          neck: number
          bfp: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          weight?: number
          waist?: number
          hip?: number
          neck?: number
          bfp?: number
          created_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          id: string
          stat_id: string
          user_id: string
          angle: 'front' | 'left' | 'right' | 'back'
          filename: string
          created_at: string
        }
        Insert: {
          id?: string
          stat_id: string
          user_id: string
          angle: 'front' | 'left' | 'right' | 'back'
          filename: string
          created_at?: string
        }
        Update: {
          id?: string
          stat_id?: string
          user_id?: string
          angle?: 'front' | 'left' | 'right' | 'back'
          filename?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
