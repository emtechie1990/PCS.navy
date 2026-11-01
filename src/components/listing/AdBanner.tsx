'use client'

// Placeholder advertising banners for PCS-adjacent services.
// These are revenue-generating ad slots. Replace with real ads
// from Google AdSense, direct sponsors, or affiliate partners.

interface AdBannerProps {
  slot: 'sidebar' | 'leaderboard' | 'inline'
  label?: string
}

const SIDEBAR_ADS = [
  {
    title: 'Need Movers?',
    sub: 'Military discounts on household goods shipments',
    cta: 'Get a Free Quote',
    bg: '#1a3a5c',
    emoji: '🚛',
  },
  {
    title: 'Auto Transport',
    sub: 'Ship your vehicle to your next duty station',
    cta: 'Ship My Car',
    bg: '#4B5320',
    emoji: '🚗',
  },
  {
    title: 'Storage Units',
    sub: 'First month free near all major installations',
    cta: 'Reserve Now',
    bg: '#6b3a1a',
    emoji: '📦',
  },
  {
    title: 'VA Home Loans',
    sub: '$0 down payment — use your BAH benefit',
    cta: 'Check Your Rate',
    bg: '#2d5016',
    emoji: '🏠',
  },
]

const LEADERBOARD_ADS = [
  {
    title: 'Military OneSource',
    sub: 'Free relocation assistance for PCS moves — call anytime',
    cta: 'Learn More',
    bg: '#1a1a2e',
    emoji: '📞',
  },
  {
    title: 'PCS Move Insurance',
    sub: 'Protect your belongings during every move — starting at $29/mo',
    cta: 'Get Coverage',
    bg: '#3a1a2e',
    emoji: '🛡️',
  },
]

export function AdBanner({ slot, label = 'Advertisement' }: AdBannerProps) {
  if (slot === 'sidebar') {
    const ad = SIDEBAR_ADS[Math.floor(Math.random() * SIDEBAR_ADS.length)]
    return (
      <div className="rounded-xl overflow-hidden text-white p-5 flex flex-col gap-2" style={{ background: ad.bg }}>
        <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
        <div className="text-3xl">{ad.emoji}</div>
        <h4 className="font-bold text-base" style={{ fontFamily: 'var(--font-oswald)' }}>{ad.title}</h4>
        <p className="text-white/70 text-xs leading-relaxed">{ad.sub}</p>
        <button className="mt-2 w-full py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'var(--army-gold)', color: '#1a1a1a' }}>
          {ad.cta}
        </button>
      </div>
    )
  }

  if (slot === 'leaderboard') {
    const ad = LEADERBOARD_ADS[Math.floor(Math.random() * LEADERBOARD_ADS.length)]
    return (
      <div className="rounded-xl overflow-hidden text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
           style={{ background: ad.bg }}>
        <p className="text-[10px] uppercase tracking-widest text-white/40 sm:hidden">{label}</p>
        <div className="flex items-center gap-4">
          <span className="text-3xl">{ad.emoji}</span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 hidden sm:block">{label}</p>
            <h4 className="font-bold text-base" style={{ fontFamily: 'var(--font-oswald)' }}>{ad.title}</h4>
            <p className="text-white/70 text-xs">{ad.sub}</p>
          </div>
        </div>
        <button className="shrink-0 px-5 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'var(--army-gold)', color: '#1a1a1a' }}>
          {ad.cta}
        </button>
      </div>
    )
  }

  // inline
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center text-gray-400 text-sm">
      <p className="text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <p className="font-medium text-gray-500">Advertise your PCS service here</p>
      <p className="text-xs mt-1">Reach thousands of relocating military families</p>
    </div>
  )
}
