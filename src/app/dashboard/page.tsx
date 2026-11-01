import Link from 'next/link'
import { AdBanner } from '@/components/listing/AdBanner'

const MOCK_LISTINGS = [
  { id: '1', title: '3BR/2BA Near Fort Liberty', category: 'housing', price: 179500, status: 'active', tier: 'featured', views: 142, messages: 3, expires: 'Dec 31, 2026' },
  { id: '2', title: '2021 Toyota Tacoma TRD', category: 'vehicle', price: 3299900, status: 'active', tier: 'basic', views: 67, messages: 1, expires: 'Nov 30, 2026' },
  { id: '3', title: 'Full Living Room Set', category: 'goods', price: 65000, status: 'sold', tier: 'free', views: 28, messages: 5, expires: '—' },
]

const MOCK_MESSAGES = [
  { id: 'm1', from: 'SGT Johnson', listing: '3BR/2BA Near Fort Liberty', preview: 'Is the property still available for Dec 1?', time: '2h ago', unread: true },
  { id: 'm2', from: 'CPT Williams', listing: '2021 Toyota Tacoma TRD', preview: 'Would you take $30,000?', time: '1d ago', unread: false },
  { id: 'm3', from: 'SPC Davis', listing: '3BR/2BA Near Fort Liberty', preview: 'Are pets allowed?', time: '2d ago', unread: false },
]

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
}

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>
            My Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">SSG Martinez · <span className="verified-badge text-[10px]">✓ Verified Military</span></p>
        </div>
        <Link href="/listings/create"
              className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
              style={{ background: 'var(--army-green)' }}>
          + Post a Listing
        </Link>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Listings', value: '2', icon: '📋' },
          { label: 'Total Views', value: '209', icon: '👁️' },
          { label: 'Unread Messages', value: '1', icon: '💬' },
          { label: 'Days to PCS', value: '47', icon: '📅' },
        ].map(s => (
          <div key={s.label} className="card-base p-5 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--army-green)' }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">

          {/* my listings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>My Listings</h2>
              <Link href="/listings/create" className="text-sm font-medium hover:underline" style={{ color: 'var(--army-green)' }}>
                + New Listing
              </Link>
            </div>
            <div className="space-y-3">
              {MOCK_LISTINGS.map(l => (
                <div key={l.id} className="card-base p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-gray-50">
                    {l.category === 'housing' ? '🏠' : l.category === 'vehicle' ? '🚗' : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{l.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatPrice(l.price)} · {l.tier === 'featured' ? '⭐ Featured' : l.tier} · Expires {l.expires}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                      <span>👁️ {l.views} views</span>
                      <span>💬 {l.messages} messages</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {l.status === 'active' ? '● Active' : '✓ Sold'}
                    </span>
                    <Link href={`/listings/${l.id}`} className="text-xs font-medium hover:underline" style={{ color: 'var(--army-green)' }}>
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* recent messages */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>Recent Messages</h2>
              <Link href="/messages" className="text-sm font-medium hover:underline" style={{ color: 'var(--army-green)' }}>
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {MOCK_MESSAGES.map(m => (
                <Link key={m.id} href="/messages"
                      className={`block card-base p-4 hover:shadow-md transition-all ${m.unread ? 'border-l-4 border-l-[var(--army-green)]' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                           style={{ background: 'var(--army-green)' }}>
                        {m.from[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{m.from}</div>
                        <div className="text-xs text-gray-400">Re: {m.listing}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{m.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 ml-11 truncate">{m.preview}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* PCS checklist teaser */}
          <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: 'rgba(75,83,32,0.06)', border: '1px solid rgba(75,83,32,0.15)' }}>
            <span className="text-3xl">📋</span>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">Your PCS Checklist</p>
              <p className="text-xs text-gray-500">47 days out — 3 tasks due this week</p>
            </div>
            <Link href="/checklist" className="px-4 py-2 rounded-lg font-bold text-white text-sm transition-all hover:opacity-90" style={{ background: 'var(--army-green)' }}>
              View Checklist
            </Link>
          </div>

        </div>

        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
          <div className="card-base p-4">
            <h4 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-oswald)' }}>Account</h4>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Rank', value: 'SSG' },
                { label: 'Base', value: 'Fort Liberty, NC' },
                { label: 'PCS Date', value: 'Dec 17, 2026' },
                { label: 'Status', value: '✓ Verified' },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-gray-400">{r.label}</span>
                  <span className="font-medium text-gray-700">{r.value}</span>
                </div>
              ))}
            </div>
            <Link href="/auth/profile" className="mt-4 block text-xs font-medium text-center hover:underline" style={{ color: 'var(--army-green)' }}>
              Edit Profile
            </Link>
          </div>
          <AdBanner slot="sidebar" />
        </aside>
      </div>
    </div>
  )
}
