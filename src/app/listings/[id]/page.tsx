import Link from 'next/link'
import { AdBanner } from '@/components/listing/AdBanner'

// TODO: replace with Supabase fetch by id
const MOCK = {
  id: '1', category: 'housing', title: '3BR/2BA Near Fort Liberty Gate 1',
  price: 179500, base: 'Fort Liberty', state: 'NC', slug: 'fort-liberty',
  verified: true, tier: 'featured', days: 2,
  desc: `Spacious home 2 miles from main gate. BAH covers rent for E-5 and above. Pets welcome with $300 deposit. New appliances, fenced yard, 2-car garage. Available Dec 1. Month-to-month or 12-month lease.`,
  seller: 'SSG Martinez', sellerRank: 'SSG', postedAt: 'Nov 1, 2026',
  photos: [],
  details: { bedrooms: 3, bathrooms: 2, sqft: 1400, pets: true, utilities: false, available: 'Dec 1, 2026' },
  appUrl: 'https://pcs.army',
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
}

function buildShareUrl(listing: typeof MOCK, platform: 'facebook' | 'twitter' | 'copy') {
  const url = `${MOCK.appUrl}/listings/${listing.id}`
  const text = `${listing.title} — ${formatPrice(listing.price)} near ${listing.base}, ${listing.state} on PCS.army`
  if (platform === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
  if (platform === 'twitter') return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  return url
}

export default function ListingDetailPage() {
  const l = MOCK

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <Link href="/listings" className="hover:underline">Listings</Link>
        <span>/</span>
        <Link href={`/listings?category=${l.category}`} className="hover:underline capitalize">{l.category}</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-[200px]">{l.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* main content */}
        <div className="lg:col-span-2">
          {/* photo gallery */}
          <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 relative overflow-hidden">
            <span className="text-8xl opacity-20">{l.category === 'housing' ? '🏠' : l.category === 'vehicle' ? '🚗' : '📦'}</span>
            {l.tier === 'featured' && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-lg text-sm font-bold"
                   style={{ background: 'var(--army-gold)', color: '#1a1a1a' }}>⭐ Featured Listing</div>
            )}
          </div>

          {/* title + price */}
          <div className="mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>{l.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-black" style={{ color: 'var(--army-green)', fontFamily: 'var(--font-oswald)' }}>
                    {formatPrice(l.price)}
                  </span>
                  {l.category === 'housing' && <span className="text-sm text-gray-400">/month</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-sm font-medium text-white capitalize" style={{ background: 'var(--army-green)' }}>
                  {l.category === 'housing' ? '🏠' : l.category === 'vehicle' ? '🚗' : '📦'} {l.category}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">📍 {l.base}, {l.state} · Posted {l.postedAt}</p>
          </div>

          {/* details grid */}
          {l.category === 'housing' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Bedrooms', value: `${l.details.bedrooms} BR` },
                { label: 'Bathrooms', value: `${l.details.bathrooms} BA` },
                { label: 'Sq Footage', value: `${l.details.sqft.toLocaleString()} sqft` },
                { label: 'Available', value: l.details.available },
                { label: 'Pets', value: l.details.pets ? 'Allowed' : 'No Pets' },
                { label: 'Utilities', value: l.details.utilities ? 'Included' : 'Not included' },
              ].map(d => (
                <div key={d.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-0.5">{d.label}</div>
                  <div className="font-semibold text-sm text-gray-900">{d.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* description */}
          <div className="mb-6">
            <h2 className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-oswald)' }}>Description</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{l.desc}</p>
          </div>

          {/* share section */}
          <div className="rounded-xl border p-4 mb-6" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-oswald)' }}>📤 Share This Listing</h3>
            <p className="text-xs text-gray-500 mb-3">Share with your unit, Facebook groups, or anyone looking for a deal near {l.base}.</p>
            <div className="flex flex-wrap gap-2">
              <a href={buildShareUrl(l, 'facebook')} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
                 style={{ background: '#1877F2' }}>
                <span>f</span> Share on Facebook
              </a>
              <a href={buildShareUrl(l, 'twitter')} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
                 style={{ background: '#000' }}>
                𝕏 Share on X
              </a>
              <button
                onClick={() => navigator.clipboard?.writeText(buildShareUrl(l, 'copy'))}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all hover:bg-gray-50"
                style={{ borderColor: 'var(--border)' }}>
                🔗 Copy Link
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Anyone with the link can view this listing — no account required.</p>
          </div>

          {/* safety notice */}
          <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(75,83,32,0.06)', border: '1px solid rgba(75,83,32,0.15)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--army-green)' }}>🛡️ Stay Safe</p>
            <p className="text-gray-600 text-xs">All sellers on PCS.army are .mil verified. Never send money via Zelle, Venmo, or wire transfer before seeing the item. Meet at a public place on post. Report suspicious listings immediately.</p>
          </div>
        </div>

        {/* contact sidebar */}
        <aside className="space-y-4">
          {/* contact card */}
          <div className="card-base p-5 sticky top-24">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                   style={{ background: 'var(--army-green)' }}>
                {l.seller[0]}
              </div>
              <div>
                <div className="font-bold text-sm">{l.seller}</div>
                <div className="flex items-center gap-1">
                  {l.verified && <span className="verified-badge text-[10px]">✓ Verified Military</span>}
                </div>
              </div>
            </div>

            <div className="text-2xl font-black mb-1" style={{ color: 'var(--army-green)', fontFamily: 'var(--font-oswald)' }}>
              {formatPrice(l.price)}
            </div>
            {l.category === 'housing' && <p className="text-xs text-gray-400 mb-4">/month</p>}

            <Link href={`/messages?listing=${l.id}&seller=${l.seller}`}
                  className="block w-full text-center py-3 rounded-xl font-bold text-white mb-3 transition-all hover:opacity-90"
                  style={{ background: 'var(--army-green)' }}>
              💬 Message Seller
            </Link>
            <a href={buildShareUrl(l, 'facebook')} target="_blank" rel="noopener noreferrer"
               className="block w-full text-center py-3 rounded-xl font-bold text-sm border transition-all hover:bg-gray-50"
               style={{ borderColor: 'var(--border)' }}>
              📤 Share Listing
            </a>

            <div className="mt-4 pt-4 border-t text-xs text-gray-400 space-y-1" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between"><span>Listed</span><span>{l.postedAt}</span></div>
              <div className="flex justify-between"><span>Location</span><span>{l.base}, {l.state}</span></div>
              <div className="flex justify-between"><span>Listing ID</span><span>#{l.id}</span></div>
            </div>

            <button className="mt-4 w-full text-xs text-gray-400 hover:text-red-500 transition-colors text-center">
              🚩 Report this listing
            </button>
          </div>

          <AdBanner slot="sidebar" />
        </aside>
      </div>
    </div>
  )
}
