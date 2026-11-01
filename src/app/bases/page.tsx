import Link from 'next/link'
import { NAVY_BASES as ARMY_BASES } from '@/data/bases'

function formatBah(cents?: number) {
  if (!cents) return 'â€”'
  return `$${Math.round(cents / 100).toLocaleString()}/mo`
}

export default function BasesPage() {
  const byState = ARMY_BASES.reduce<Record<string, typeof ARMY_BASES>>((acc, b) => {
    acc[b.state] = [...(acc[b.state] ?? []), b]
    return acc
  }, {})

  const states = Object.keys(byState).sort()

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>
          Navy duty station Directory
        </h1>
        <p className="text-gray-500 mt-2">Browse listings at {ARMY_BASES.length} Navy duty stations. Each base has its own local board.</p>
      </div>

      {states.map(state => (
        <div key={state} className="mb-10">
          <h2 className="text-lg font-bold mb-3 pb-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-oswald)', color: 'var(--army-green)' }}>
            <span className="text-gray-400 text-sm font-normal">{state}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {byState[state].map(b => (
              <Link key={b.id} href={`/bases/${b.slug}`}
                    className="card-base p-5 hover:shadow-md transition-all hover:border-[var(--army-green)] group">
                <h3 className="font-bold text-base text-gray-900 group-hover:text-[var(--army-green)] transition-colors mb-1"
                    style={{ fontFamily: 'var(--font-oswald)' }}>
                  {b.name}
                </h3>
                <p className="text-xs text-gray-400 mb-3">{b.name}, {b.state}</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <span className="text-gray-400">BAH E-5: </span>
                    <span className="font-semibold text-gray-700">{formatBah(b.bah_e5)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex gap-3 text-xs font-medium" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--army-green)' }}>ðŸ  Housing</span>
                  <span style={{ color: 'var(--army-green)' }}>ðŸš— Vehicles</span>
                  <span style={{ color: 'var(--army-green)' }}>ðŸ“¦ Goods</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

