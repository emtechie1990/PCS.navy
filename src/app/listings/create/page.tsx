'use client'
import { useState } from 'react'
import Link from 'next/link'
import { NAVY_BASES as ARMY_BASES } from '@/data/bases'
import { LISTING_PRICES } from '@/lib/pricing'

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { n: 1, label: 'Category' },
  { n: 2, label: 'Details' },
  { n: 3, label: 'Photos' },
  { n: 4, label: 'Publish' },
]

export default function CreateListingPage() {
  const [step, setStep] = useState<Step>(1)
  const [category, setCategory] = useState<'housing' | 'vehicle' | 'goods' | ''>('')
  const [tier, setTier] = useState<'basic' | 'featured' | 'bundle' | 'free' | ''>('')

  const next = () => setStep(s => Math.min(s + 1, 4) as Step)
  const back = () => setStep(s => Math.max(s - 1, 1) as Step)

  const TIERS = category === 'housing'
    ? [
        { id: 'basic', label: 'Basic', price: LISTING_PRICES.housing.basic, days: 60, perks: ['3 photos', 'Standard placement', '60-day listing'] },
        { id: 'featured', label: 'Featured â­', price: LISTING_PRICES.housing.featured, days: 90, perks: ['15 photos', 'Top of search results', 'Gold featured badge', '90-day listing'] },
        { id: 'bundle', label: 'PCS Bundle ðŸŽ–ï¸', price: LISTING_PRICES.bundle.pcs, days: 90, perks: ['Everything in Featured', 'Vehicle listing included', 'Priority support', '90-day listing'] },
      ]
    : category === 'vehicle'
    ? [
        { id: 'basic', label: 'Basic', price: LISTING_PRICES.vehicle.basic, days: 30, perks: ['1 photo', 'Standard placement', '30-day listing'] },
        { id: 'featured', label: 'Featured â­', price: LISTING_PRICES.vehicle.featured, days: 60, perks: ['10 photos', 'Top of search results', 'Gold featured badge', '60-day listing'] },
      ]
    : [
        { id: 'free', label: 'Free', price: LISTING_PRICES.goods.free, days: 30, perks: ['1 photo', 'Standard placement', '30-day listing'] },
        { id: 'featured', label: 'Featured â­', price: LISTING_PRICES.goods.featured, days: 45, perks: ['5 photos', 'Top of search results', 'Gold featured badge', '45-day listing'] },
      ]

  function formatPrice(cents: number) {
    if (cents === 0) return 'FREE'
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>
          Post a Listing
        </h1>
        <p className="text-gray-500 text-sm mt-1">Reach thousands of verified military buyers near your base.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s.n ? 'text-white' : 'text-gray-400 border-2'
              }`} style={{ background: step >= s.n ? 'var(--army-green)' : 'transparent', borderColor: step >= s.n ? 'transparent' : 'var(--border)' }}>
                {step > s.n ? 'âœ“' : s.n}
              </div>
              <span className={`text-xs mt-1 font-medium ${step === s.n ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-4" style={{ background: step > s.n ? 'var(--army-green)' : 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      <div className="card-base p-8">

        {/* â”€â”€â”€ STEP 1: CATEGORY â”€â”€â”€ */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-black mb-2 text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>What are you listing?</h2>
            <p className="text-gray-500 text-sm mb-6">Choose a category to get started.</p>
            <div className="space-y-3">
              {[
                { id: 'housing', icon: 'ðŸ ', label: 'Housing', desc: 'Rentals, homes for sale, or temporary lodging', price: 'Starts at $12.99' },
                { id: 'vehicle', icon: 'ðŸš—', label: 'Vehicle', desc: 'Cars, trucks, motorcycles, or RVs', price: 'Starts at $9.99' },
                { id: 'goods', icon: 'ðŸ“¦', label: 'Household Goods', desc: 'Furniture, appliances, electronics, and more', price: 'FREE to list' },
              ].map(c => (
                <button key={c.id} onClick={() => setCategory(c.id as any)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          category === c.id ? 'border-[var(--army-green)] bg-[rgba(75,83,32,0.05)]' : 'hover:border-gray-300'
                        }`} style={{ borderColor: category === c.id ? 'var(--army-green)' : 'var(--border)' }}>
                  <span className="text-3xl">{c.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{c.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.desc}</div>
                  </div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--army-green)' }}>{c.price}</div>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={next} disabled={!category}
                      className="px-8 py-3 rounded-xl font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
                      style={{ background: 'var(--army-green)' }}>
                Continue â†’
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€â”€ STEP 2: DETAILS â”€â”€â”€ */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-black mb-2 text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>
              {category === 'housing' ? 'ðŸ  Housing Details' : category === 'vehicle' ? 'ðŸš— Vehicle Details' : 'ðŸ“¦ Item Details'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">Fill in the details for your listing.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder={
                  category === 'housing' ? '3BR/2BA near Fort Liberty â€” BAH friendly' :
                  category === 'vehicle' ? '2021 Toyota Tacoma TRD â€” PCS sale' :
                  'Full living room set â€” moving Friday'
                } className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                       style={{ borderColor: 'var(--border)' }} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" placeholder="0.00" min="0"
                         className="w-full pl-7 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                         style={{ borderColor: 'var(--border)' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Installation <span className="text-red-500">*</span></label>
                <select className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)] bg-white"
                        style={{ borderColor: 'var(--border)' }}>
                  <option value="">Select base</option>
                  {ARMY_BASES.map(b => <option key={b.id} value={b.slug}>{b.name}, {b.state}</option>)}
                </select>
              </div>

              {category === 'housing' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bedrooms</label>
                    <select className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)] bg-white" style={{ borderColor: 'var(--border)' }}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} BR</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bathrooms</label>
                    <select className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)] bg-white" style={{ borderColor: 'var(--border)' }}>
                      {['1','1.5','2','2.5','3'].map(n => <option key={n} value={n}>{n} BA</option>)}
                    </select>
                  </div>
                </div>
              )}

              {category === 'vehicle' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year</label>
                    <input type="number" placeholder="2021" min="1990" max="2026"
                           className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                           style={{ borderColor: 'var(--border)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Miles</label>
                    <input type="number" placeholder="42000"
                           className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                           style={{ borderColor: 'var(--border)' }} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea rows={4} placeholder="Describe your listing â€” condition, availability, what's included..."
                          className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)] resize-none"
                          style={{ borderColor: 'var(--border)' }} />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={back} className="px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                â† Back
              </button>
              <button onClick={next}
                      className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                      style={{ background: 'var(--army-green)' }}>
                Continue â†’
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€â”€ STEP 3: PHOTOS â”€â”€â”€ */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-black mb-2 text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>Add Photos</h2>
            <p className="text-gray-500 text-sm mb-6">Listings with photos get 5x more views. Upload up to 10.</p>

            <div className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-[var(--army-green)] hover:bg-[rgba(75,83,32,0.03)] transition-all"
                 style={{ borderColor: 'var(--border)' }}>
              <div className="text-4xl mb-3">ðŸ“·</div>
              <p className="font-semibold text-gray-700">Drop photos here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB each Â· Max 10 photos</p>
              <button className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold border transition-all hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                Choose Files
              </button>
            </div>

            <div className="mt-6 p-4 rounded-xl text-sm" style={{ background: 'rgba(75,83,32,0.06)', border: '1px solid rgba(75,83,32,0.15)' }}>
              <p className="font-semibold text-gray-700 mb-1">ðŸ“¸ Photo Tips</p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>â€¢ Good lighting and clean spaces get more inquiries</li>
                <li>â€¢ Include the most important features first</li>
                {category === 'housing' && <li>â€¢ Show street address area for context (no visible house numbers)</li>}
                {category === 'vehicle' && <li>â€¢ Include 4-corner exterior shots + odometer + any damage</li>}
              </ul>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={back} className="px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                â† Back
              </button>
              <button onClick={next}
                      className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                      style={{ background: 'var(--army-green)' }}>
                Continue â†’
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€â”€ STEP 4: TIER / PUBLISH â”€â”€â”€ */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-black mb-2 text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>Choose a Listing Plan</h2>
            <p className="text-gray-500 text-sm mb-6">
              {category === 'goods' ? 'Household goods are free to list â€” or upgrade for more visibility.' : 'Select a plan to publish your listing.'}
            </p>

            <div className="space-y-3 mb-8">
              {TIERS.map(t => (
                <button key={t.id} onClick={() => setTier(t.id as any)}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          tier === t.id ? 'border-[var(--army-green)] bg-[rgba(75,83,32,0.05)]' : 'hover:border-gray-300'
                        }`} style={{ borderColor: tier === t.id ? 'var(--army-green)' : 'var(--border)' }}>
                  <div className="mt-0.5">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tier === t.id ? 'border-[var(--army-green)]' : 'border-gray-300'
                    }`}>
                      {tier === t.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--army-green)' }} />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">{t.label}</span>
                      <span className="font-black text-lg" style={{ color: 'var(--army-green)', fontFamily: 'var(--font-oswald)' }}>
                        {formatPrice(t.price)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">Active for {t.days} days</div>
                    <ul className="space-y-0.5">
                      {t.perks.map(p => (
                        <li key={p} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span style={{ color: 'var(--army-green)' }}>âœ“</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={back} className="px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                â† Back
              </button>
              <button disabled={!tier}
                      className="px-8 py-3 rounded-xl font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
                      style={{ background: tier === 'free' ? 'var(--army-green)' : 'var(--army-gold)', color: tier !== 'free' ? '#1a1a1a' : undefined }}>
                {tier === 'free' ? 'ðŸŽ‰ Publish Free Listing' : `Pay ${tier ? formatPrice(TIERS.find(t=>t.id===tier)?.price ?? 0) : ''} & Publish`}
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 mt-4">
              {tier !== 'free' ? 'Secure checkout via Stripe Â· No subscription Â· One-time fee' : 'No payment required for free goods listings'}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

