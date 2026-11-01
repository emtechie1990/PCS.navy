export type Branch = 'army' | 'navy' | 'airforce'
export type ListingCategory = 'housing' | 'vehicle' | 'goods'
export type ListingStatus = 'active' | 'sold' | 'expired'
export type ListingTier = 'free' | 'basic' | 'featured' | 'bundle'

export interface Profile {
  id: string
  display_name: string
  rank?: string
  current_base_id?: string
  pcs_date?: string
  verified_at?: string
  avatar_url?: string
  created_at: string
}

export interface Base {
  id: string
  name: string
  slug: string
  state: string
  bah_e5?: number
  lat?: number
  lng?: number
  branch: Branch
}

export interface Listing {
  id: string
  user_id: string
  base_id?: string
  category: ListingCategory
  title: string
  description: string
  price?: number
  photos?: string[]
  status: ListingStatus
  tier: ListingTier
  available_date?: string
  metadata?: Record<string, unknown>
  created_at: string
  expires_at?: string
  profiles?: Profile
  bases?: Base
}

export interface Message {
  id: string
  listing_id: string
  from_id: string
  to_id: string
  body: string
  read_at?: string
  created_at: string
}

export interface Payment {
  id: string
  listing_id?: string
  user_id?: string
  stripe_session_id?: string
  amount_cents: number
  tier: string
  created_at: string
}
