import Link from 'next/link'
import { NAVY_BASES as ARMY_BASES, getBaseBySlug } from '@/data/bases'
import { AdBanner } from '@/components/listing/AdBanner'
import { notFound } from 'next/navigation'

// placeholder listings per base
const MOCK_LISTINGS = [
  { id: '1', category: 'housing', title: '3BR/2BA Off-Post — BAH Friendly', price: 179500, verified: true, tier: 'featured', days: 2 },
  { id: '2', category: 'vehicle', title: '2021 Toyota Tacoma — PCS Sale', price: 3299900, verified: true, tier: 'featured', days: 1 },
  { id: '3', category: 'goods', title: 'Full Living Room Set', price: 65000, verified: true, tier: 'free', days: 0 },
  { id: '4', category: 'housing', title: 'Furnished 1BR — Month to Month', price: 99500, verified: false, tier: 'basic', days: 3 },
  { id: '5', category: 'vehicle', title: '2019 Honda Accord EX', price: 1699900, verified: true, tier: 'basic', days: 5 },
  { id: '6', category: 'goods', title: 'Washer + Dryer — Moving Saturday', price: 35000, verified: true, tier: 'free', days: 0 },
]

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
}

export async function generateStaticParams() {
  return ARMY_BASES.map(b => ({ slug: b.slug }))
}

export default function BasePage({ params }: { params: { slug: string } }) {
  const base = getBaseBySlug(params.slug)
  if (!base) return notFound()

  const bahMonthly = base.bah_e5 ? Math.round(base.bah_e5 / 100) : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* base hero */}
      <div className="rounded-2xl p-8 mb-8 relative overflow-hidden text-white" style={{ background: 'var(--army-green)' }}>
        <div className="absolute inset-0 opacity-5"
             style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Local Board</p>
              <h1 className="text-4xl font-black" style={{ fontFamily: 'var(--font-oswald)' }}>{base.name}</h1>
              <p className="text-white/70 mt-1">{base.name}, {base.state}</p>
            </div>
            {bahMonthly && (
              <div className="text-right">
                <p className="text-white/60 text-xs">BAH Rate (E-5 w/dep)</p>
                <p className="text-3xl font-black" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--army-gold)' }}>
                  ${bahMonthly.toLocaleString()}/mo
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { href: `?category=housing`, icon: '🏠', label: 'Housing' },
              { href: `?category=vehicle`, icon: '🚗', label: 'Vehicles' },
              { href: `?category=goods`, icon: '📦', label: 'Goods' },
            ].map(c => (
              <Link key={c.href} href={c.href}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-white/20 bg-white/10">
                {c.icon} {c.label}
              </Link>
            ))}
            <Link href="/listings/create"
                  className="px-4 py-2 rounded-lg text-sm font-bold ml-auto transition-all hover:opacity-90"
                  style={{ background: 'var(--army-gold)', color: '#1a1a1a' }}>
              + Post Near This Base
            </Link>
          </div>
        </div>
      </div>

      <AdBanner slot="leaderboard" />

      <div className="flex gap-6 mt-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>
              Latest Listings Near {base.name}
            </h2>
            <Link href={`/listings?base=${base.slug}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--army-green)' }}>
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MOCK_LISTINGS.map(l => (
              <Link key={l.id} href={`/listings/${l.id}`}
                    className="card-base hover:shadow-md transition-all hover:-translate-y-0.5 group">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                  <span className="text-5xl opacity-20">{l.category === 'housing' ? '🏠' : l.category === 'vehicle' ? '🚗' : '📦'}</span>
                  {l.tier === 'featured' && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--army-gold)', color: '#1a1a1a' }}>⭐ Featured</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-gray-900 truncate group-hover:text-[var(--army-green)] transition-colors">{l.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-black text-lg" style={{ color: 'var(--army-green)', fontFamily: 'var(--font-oswald)' }}>{formatPrice(l.price)}</span>
                    <span className="text-xs text-gray-400">{l.days === 0 ? 'Today' : `${l.days}d ago`}</span>
                  </div>
                  {l.verified && <span className="verified-badge text-[10px] mt-2 inline-block">✓ Verified</span>}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 p-5 rounded-xl text-center" style={{ background: 'rgba(75,83,32,0.06)', border: '1px solid rgba(75,83,32,0.15)' }}>
            <p className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-oswald)' }}>PCS to {base.name}?</p>
            <p className="text-sm text-gray-500 mb-4">Post your housing, vehicle, or household goods — free for goods listings.</p>
            <Link href="/listings/create" className="px-6 py-2.5 rounded-lg font-bold text-white text-sm transition-all hover:opacity-90 inline-block"
                  style={{ background: 'var(--army-green)' }}>
              + Post a Listing
            </Link>
          </div>
        </div>

        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
          <div className="card-base p-4">
            <h4 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-oswald)' }}>Base Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">State</span><span className="font-medium">{base.state}</span></div>
              {bahMonthly && <div className="flex justify-between"><span className="text-gray-400">BAH E-5</span><span className="font-medium text-green-700">${bahMonthly.toLocaleString()}/mo</span></div>}
            </div>
          </div>
          <AdBanner slot="sidebar" />
          <AdBanner slot="sidebar" />
        </aside>
      </div>
    </div>
  )
}
