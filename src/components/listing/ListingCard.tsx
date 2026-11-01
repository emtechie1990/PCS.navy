import Link from 'next/link'
import type { Listing } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, string> = {
  housing: '🏠',
  vehicle: '🚗',
  goods: '📦',
}

const CATEGORY_LABELS: Record<string, string> = {
  housing: 'Housing',
  vehicle: 'Vehicle',
  goods: 'Goods',
}

interface Props {
  listing: Listing & { profiles?: { display_name: string; verified_at?: string }; bases?: { name: string; state: string } }
}

export function ListingCard({ listing }: Props) {
  const verified = Boolean(listing.profiles?.verified_at)
  const photo = listing.photos?.[0]

  return (
    <Link href={`/listings/${listing.id}`} className="block card-base hover:shadow-md transition-all hover:-translate-y-0.5 group">
      {/* photo */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <span className="text-4xl">{CATEGORY_ICONS[listing.category]}</span>
            <span className="text-xs mt-1 text-gray-400">No photo</span>
          </div>
        )}
        {/* tier badge */}
        {listing.tier === 'featured' && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold text-white"
               style={{ background: 'var(--army-gold)', color: '#1a1a1a' }}>
            ⭐ Featured
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold text-white"
             style={{ background: 'var(--army-green)' }}>
          {CATEGORY_ICONS[listing.category]} {CATEGORY_LABELS[listing.category]}
        </div>
      </div>

      {/* body */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-gray-900 truncate group-hover:text-[var(--army-green)] transition-colors">
          {listing.title}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xl font-bold" style={{ color: 'var(--army-green)', fontFamily: 'var(--font-oswald)' }}>
            {listing.price ? formatPrice(listing.price) : 'Make Offer'}
          </span>
          {listing.bases && (
            <span className="text-xs text-gray-500 truncate ml-2">
              📍 {listing.bases.name}, {listing.bases.state}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                 style={{ background: 'var(--army-green)' }}>
              {listing.profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-xs text-gray-600 truncate max-w-[100px]">{listing.profiles?.display_name}</span>
            {verified && (
              <span className="verified-badge text-[10px]">✓ Verified</span>
            )}
          </div>
          <span className="text-xs text-gray-400">{formatDate(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
