export const LISTING_PRICES = {
  housing: {
    basic:    1299,   // $12.99 — 60 days, 3 photos
    featured: 3999,   // $39.99 — 90 days, 15 photos
  },
  vehicle: {
    basic:    999,    // $9.99  — 30 days
    featured: 1999,   // $19.99 — 60 days
  },
  goods: {
    free:     0,      // $0 — supply builder
    featured: 499,    // $4.99 — boosted
  },
  bundle: {
    pcs: 2999,        // $29.99 — all categories, one move
  },
} as const

export const LISTING_DURATIONS_DAYS = {
  housing: { basic: 60, featured: 90 },
  vehicle: { basic: 30, featured: 60 },
  goods:   { free: 30, featured: 45 },
  bundle:  { pcs: 90 },
} as const
