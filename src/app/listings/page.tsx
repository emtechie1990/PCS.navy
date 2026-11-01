import Link from 'next/link'
import { NAVY_BASES as ARMY_BASES } from '@/data/bases'
import { AdBanner } from '@/components/listing/AdBanner'

// Placeholder listings â€” replace with Supabase query
const MOCK_LISTINGS = [
  { id: '1', category: 'housing', title: '3BR/2BA Near Fort Liberty Gate 1', price: 179500, base: 'Fort Liberty', state: 'NC', slug: 'fort-liberty', verified: true, tier: 'featured', days: 2, desc: 'Spacious home 2 miles from main gate. BAH covers rent. Pets welcome.' },
  { id: '2', category: 'vehicle', title: '2021 Toyota Tacoma TRD â€” PCS Sale Must Go', price: 3299900, base: 'Fort Campbell', state: 'KY', slug: 'fort-campbell', verified: true, tier: 'featured', days: 1, desc: '42k miles, one owner, all service records. PCS orders received.' },
  { id: '3', category: 'housing', title: 'Furnished 2BR â€” Month-to-Month OK', price: 149500, base: 'Fort Carson', state: 'CO', slug: 'fort-carson', verified: true, tier: 'basic', days: 3, desc: 'Fully furnished, utilities included. Ideal for TDY or transition.' },
  { id: '4', category: 'goods', title: 'Full Living Room Set â€” Moving This Friday', price: 65000, base: 'JBLM', state: 'WA', slug: 'jblm', verified: true, tier: 'free', days: 0, desc: 'Couch, loveseat, coffee table, TV stand. You haul. Cash only.' },
  { id: '5', category: 'vehicle', title: '2020 Honda Civic EX â€” 38k Miles', price: 1899900, base: 'Fort Cavazos', state: 'TX', slug: 'fort-cavazos', verified: false, tier: 'basic', days: 4, desc: 'Clean title, no accidents. Selling before PCS to Germany.' },
  { id: '6', category: 'housing', title: 'Studio Available Dec 1 â€” Near Post', price: 89500, base: 'Fort Drum', state: 'NY', slug: 'fort-drum', verified: true, tier: 'basic', days: 1, desc: 'Utilities included. 5 min drive to main gate. No pets.' },
  { id: '7', category: 'goods', title: 'Washer + Dryer Set â€” Samsung', price: 45000, base: 'Fort Stewart', state: 'GA', slug: 'fort-stewart', verified: true, tier: 'featured', days: 0, desc: 'Both work perfectly. Selling because moving to Germany. Pick up only.' },
  { id: '8', category: 'vehicle', title: '2019 Jeep Wrangler Unlimited â€” 4WD', price: 2899900, base: 'Fort Riley', state: 'KS', slug: 'fort-riley', verified: true, tier: 'featured', days: 2, desc: 'Lifted, new tires, upgraded sound. PCS orders, must sell.' },
  { id: '9', category: 'housing', title: '4BR House For Sale â€” VA Loan OK', price: 28900000, base: 'Fort Bliss', state: 'TX', slug: 'fort-bliss', verified: true, tier: 'featured', days: 5, desc: '$0 down with VA loan. 4br/2.5ba, fenced yard, 2-car garage.' },
  { id: '10', category: 'goods', title: 'Baby Gear Bundle â€” Stroller, Crib, More', price: 25000, base: 'Schofield Barracks', state: 'HI', slug: 'schofield-barracks', verified: true, tier: 'free', days: 1, desc: 'PCS sale â€” everything in excellent condition. Bundle deal.' },
  { id: '11', category: 'vehicle', title: '2022 Ford F-150 XLT â€” Only 18k Miles', price: 3799900, base: 'Fort Meade', state: 'MD', slug: 'fort-meade', verified: true, tier: 'featured', days: 0, desc: 'Like new. Towing package. PCS Korea â€” need to sell fast.' },
  { id: '12', category: 'housing', title: '1BR Apt â€” Walk to Post Exchange', price: 99500, base: 'Fort Sill', state: 'OK', slug: 'fort-sill', verified: false, tier: 'basic', days: 6, desc: 'Updated kitchen, W/D hookups. Lease through May.' },
]

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
}

interface Props {
  searchParams: { category?: string; base?: string; q?: string; minPrice?: string; maxPrice?: string }
}

export default function ListingsPage({ searchParams }: Props) {
  const { category, base, q } = searchParams

  let listings = MOCK_LISTINGS
  if (category) listings = listings.filter(l => l.category === category)
  if (base) listings = listings.filter(l => l.slug === base)
  if (q) listings = listings.filter(l => l.title.toLowerCase().includes(q.toLowerCase()))

  const title = category
    ? category === 'housing' ? 'ðŸ  Housing Listings' : category === 'vehicle' ? 'ðŸš— Vehicle Listings' : 'ðŸ“¦ Goods Listings'
    : 'All Listings'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>{title}</h1>
        <p className="text-gray-500 text-sm mt-1">{listings.length} listings found</p>
      </div>

      {/* search + filter bar */}
      <form method="GET" className="bg-white rounded-xl border p-4 mb-8 flex flex-wrap gap-3" style={{ borderColor: 'var(--border)' }}>
        <input name="q" defaultValue={q} placeholder="Search listings..." className="flex-1 min-w-[180px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]" style={{ borderColor: 'var(--border)' }} />
        <select name="category" defaultValue={category ?? ''} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]" style={{ borderColor: 'var(--border)' }}>
          <option value="">All Categories</option>
          <option value="housing">ðŸ  Housing</option>
          <option value="vehicle">ðŸš— Vehicles</option>
          <option value="goods">ðŸ“¦ Goods</option>
        </select>
        <select name="base" defaultValue={base ?? ''} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]" style={{ borderColor: 'var(--border)' }}>
          <option value="">All Bases</option>
          {ARMY_BASES.map(b => <option key={b.id} value={b.slug}>{b.name}, {b.state}</option>)}
        </select>
        <button type="submit" className="px-5 py-2 rounded-lg font-bold text-white text-sm" style={{ background: 'var(--army-green)' }}>
          Search
        </button>
        <Link href="/listings" className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 border" style={{ borderColor: 'var(--border)' }}>
          Clear
        </Link>
      </form>

      <div className="flex gap-6">
        {/* listings grid */}
        <div className="flex-1 min-w-0">
          {listings.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">ðŸ”</div>
              <p className="font-semibold text-gray-600">No listings found</p>
              <p className="text-sm mt-1">Try adjusting your search or <Link href="/listings" className="underline" style={{ color: 'var(--army-green)' }}>clear filters</Link></p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {listings.map((l, i) => (
                <div key={l.id}>
                  <Link href={`/listings/${l.id}`} className="block card-base hover:shadow-md transition-all hover:-translate-y-0.5 group">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center">
                      <span className="text-5xl opacity-20">{l.category === 'housing' ? 'ðŸ ' : l.category === 'vehicle' ? 'ðŸš—' : 'ðŸ“¦'}</span>
                      {l.tier === 'featured' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--army-gold)', color: '#1a1a1a' }}>â­ Featured</div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ background: 'var(--army-green)' }}>
                        {l.category}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm text-gray-900 truncate group-hover:text-[var(--army-green)] transition-colors">{l.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{l.desc}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="font-black text-lg" style={{ color: 'var(--army-green)', fontFamily: 'var(--font-oswald)' }}>{formatPrice(l.price)}</span>
                        <span className="text-xs text-gray-400">ðŸ“ {l.base}, {l.state}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                        {l.verified && <span className="verified-badge text-[10px]">âœ“ Verified</span>}
                        <span className="text-xs text-gray-400 ml-auto">{l.days === 0 ? 'Today' : `${l.days}d ago`}</span>
                      </div>
                    </div>
                  </Link>
                  {/* inline ad every 6 listings */}
                  {(i + 1) % 6 === 0 && <div className="mt-4"><AdBanner slot="inline" /></div>}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Link href="/listings/create" className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90" style={{ background: 'var(--army-green)' }}>
              + Post Your Listing
            </Link>
          </div>
        </div>

        {/* sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
          <AdBanner slot="sidebar" />
          <AdBanner slot="sidebar" />
          <div className="card-base p-4">
            <h4 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-oswald)' }}>Quick Base Links</h4>
            <div className="flex flex-col gap-1">
              {ARMY_BASES.slice(0, 10).map(b => (
                <Link key={b.id} href={`/bases/${b.slug}`} className="text-xs py-1 px-2 rounded hover:bg-gray-50 transition-colors" style={{ color: 'var(--army-green)' }}>
                  {b.name}, {b.state}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

