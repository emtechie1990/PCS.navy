import Link from 'next/link'
import { NAVY_BASES } from '@/data/bases'
import { AdBanner } from '@/components/listing/AdBanner'

const FEATURED_LISTINGS = [
  { id: '1', category: 'housing', title: '3BR/2BA Near Naval Station Norfolk', price: 195000, base: 'Naval Station Norfolk, VA', verified: true, tier: 'featured', days: 1 },
  { id: '2', category: 'vehicle', title: '2022 Ford F-150 XLT â€” PCS Sale', price: 3499900, base: 'NAS Jacksonville, FL', verified: true, tier: 'featured', days: 0 },
  { id: '3', category: 'housing', title: 'Furnished 2BR â€” Month-to-Month Near Sub Base', price: 159500, base: 'NSB New London, CT', verified: true, tier: 'basic', days: 2 },
  { id: '4', category: 'goods', title: 'Full Kitchen Set â€” Leaving for Deployment', price: 45000, base: 'JB Pearl Harbor-Hickam, HI', verified: true, tier: 'free', days: 0 },
  { id: '5', category: 'vehicle', title: '2020 Toyota Tundra â€” Reporting Aboard Soon', price: 2999900, base: 'Naval Base San Diego, CA', verified: true, tier: 'basic', days: 3 },
  { id: '6', category: 'housing', title: '1BR Studio â€” Walk to Pier', price: 119500, base: 'NAS Oceana, VA', verified: true, tier: 'basic', days: 1 },
]

function formatPrice(cents: number) {
  if (cents >= 10000000) return `$${(cents / 100).toLocaleString()}`
  return `$${(cents / 100).toLocaleString()}`
}

export default function HomePage() {
  const topBases = NAVY_BASES.slice(0, 12)

  return (
    <>
      {/* â”€â”€ HERO â”€â”€ */}
      <section className="relative overflow-hidden" style={{ background: 'var(--navy-dark)', minHeight: '560px' }}>
        {/* Simulated ocean/fleet background gradient */}
        <div className="absolute inset-0 opacity-30"
             style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D2545 40%, #1A3A5C 60%, #0A2038 100%)' }} />
        <div className="absolute inset-0"
             style={{ backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(10,32,56,0.4) 0%, transparent 70%)' }} />
        {/* camo-style diagonal lines */}
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 0, transparent 40px)' }} />

        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest mb-6 px-3 py-1.5 border-l-2"
                 style={{ borderColor: 'var(--navy-gold)', color: 'rgba(255,255,255,0.6)' }}>
              PCS SEASON READY Â· {NAVY_BASES.length} DUTY STATIONS
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-6"
                style={{ fontFamily: 'var(--font-oswald)' }}>
              YOUR NEXT<br />HOMEPORT<br />
              <span style={{ color: 'var(--navy-gold)' }}>STARTS HERE.</span>
            </h1>
            <p className="text-white/60 text-lg mb-10 max-w-xl">
              Find a home near the pier, sell the car before you report aboard, and pass the furniture to the family checking in. One marketplace, organized by duty station, built for Sailors and their families.
            </p>

            <form action="/listings" method="GET" className="flex flex-col sm:flex-row gap-3 mb-6">
              <select name="base" className="flex-1 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-800 bg-white border-0 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--navy-gold)' } as any}>
                <option value="">Naval Station Norfolk â€” VA</option>
                {NAVY_BASES.map(b => <option key={b.id} value={b.slug}>{b.name} â€” {b.state}</option>)}
              </select>
              <button type="submit"
                      className="px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 whitespace-nowrap"
                      style={{ background: 'var(--navy-gold)', color: 'var(--navy-dark)' }}>
                Go to Board â†’
              </button>
            </form>

            <div className="flex flex-wrap gap-5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span>ðŸ›¡ï¸ Moderated listings</span>
              <span>âš“ .navy.mil-verified sellers</span>
              <span>ðŸ“‹ Official PCS links</span>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ STATS BAR â”€â”€ */}
      <section style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { v: '9,800+', l: 'Active Listings' },
            { v: `${NAVY_BASES.length}`, l: 'Duty Stations' },
            { v: '31,000+', l: 'Verified Sailors' },
            { v: '$0', l: 'To Browse' },
          ].map(s => (
            <div key={s.l}>
              <div className="text-2xl font-black" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--navy-gold)' }}>{s.v}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10"><AdBanner slot="leaderboard" /></div>

        {/* Categories */}
        <section className="mb-14">
          <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--text-primary)' }}>
            What Are You Looking For?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { href: '/listings?category=housing', icon: 'ðŸ ', title: 'Housing', desc: 'Rentals and homes near every duty station. BAH-friendly listings flagged.', count: '3,100+' },
              { href: '/listings?category=vehicle', icon: 'ðŸš—', title: 'Vehicles', desc: 'Cars, trucks, and motorcycles from Sailors PCSing out.', count: '2,200+' },
              { href: '/listings?category=goods',   icon: 'ðŸ“¦', title: 'Household Goods', desc: 'Furniture, appliances, and gear. Free to list â€” perfect for deployment sales.', count: '4,500+' },
            ].map(c => (
              <Link key={c.href} href={c.href}
                    className="card-base p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:opacity-80 transition-opacity" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--text-primary)' }}>{c.title}</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--navy-gold)' }}>{c.count} listings</span>
                  <span className="text-sm font-bold px-4 py-1.5 rounded-lg text-white"
                        style={{ background: 'var(--navy-blue)' }}>Browse â†’</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured listings */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--text-primary)' }}>â­ Featured Listings</h2>
            <Link href="/listings" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy-gold)' }}>View All â†’</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURED_LISTINGS.map(l => (
              <Link key={l.id} href={`/listings/${l.id}`}
                    className="card-base hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="aspect-video bg-gradient-to-br relative flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, var(--navy-mid), var(--navy-dark))' }}>
                  <span className="text-5xl opacity-20">{l.category === 'housing' ? 'ðŸ ' : l.category === 'vehicle' ? 'ðŸš—' : 'ðŸ“¦'}</span>
                  {l.tier === 'featured' && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold"
                         style={{ background: 'var(--navy-gold)', color: 'var(--navy-dark)' }}>â­ Featured</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm truncate group-hover:opacity-80 transition-opacity" style={{ color: 'var(--text-primary)' }}>{l.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-black text-lg" style={{ color: 'var(--navy-gold)', fontFamily: 'var(--font-oswald)' }}>{formatPrice(l.price)}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ðŸ“ {l.base}</span>
                  </div>
                  {l.verified && <span className="verified-badge text-[10px] mt-2 inline-block">âš“ Verified Sailor</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Post CTA */}
        <section className="rounded-2xl p-8 md:p-12 text-center mb-14 relative overflow-hidden"
                 style={{ background: 'var(--navy-blue)', border: '1px solid var(--border)' }}>
          <div className="absolute inset-0 opacity-[0.06]"
               style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 0, transparent 40px)' }} />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: 'var(--font-oswald)' }}>
              Got Orders? Start Listing.
            </h2>
            <p className="mb-8 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Household goods listings are free. Vehicle and housing listings start at $9.99. Reach thousands of verified Sailors near your duty station.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/listings/create" className="px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90"
                    style={{ background: 'var(--navy-gold)', color: 'var(--navy-dark)' }}>
                + Post a Listing
              </Link>
              <Link href="/auth/register" className="px-8 py-3.5 rounded-xl font-bold text-base border-2 hover:bg-white/10 transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'white' }}>
                Create Account
              </Link>
            </div>
          </div>
        </section>

        {/* Browse by duty station */}
        <section className="mb-14">
          <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--text-primary)' }}>Browse by Duty Station</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {NAVY_BASES.map(b => (
              <Link key={b.id} href={`/bases/${b.slug}`}
                    className="card-base p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="font-semibold text-sm truncate group-hover:opacity-80 transition-opacity" style={{ color: 'var(--text-primary)' }}>{b.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{b.state}</div>
                <div className="text-xs mt-1.5 italic" style={{ color: 'var(--navy-gold)', opacity: 0.8 }}>{b.tagline}</div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link href="/bases" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy-gold)' }}>
              View All Duty Stations â†’
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}

