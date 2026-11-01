'use client'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style={{ background: 'var(--army-green)' }}>
            <span className="text-white text-2xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>
            Join PCS.army
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Verified military marketplace — .mil email required
          </p>
        </div>

        <div className="card-base p-8">
          <form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">First Name</label>
                <input type="text" name="first_name" placeholder="John"
                       className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                       style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name</label>
                <input type="text" name="last_name" placeholder="Smith"
                       className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                       style={{ borderColor: 'var(--border)' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Military Email <span className="text-red-500">*</span>
              </label>
              <input type="email" name="email" placeholder="john.smith@mail.mil"
                     className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                     style={{ borderColor: 'var(--border)' }} />
              <p className="text-xs text-gray-400 mt-1">Must end in .mil — this verifies your military status</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rank</label>
              <select name="rank" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)] bg-white"
                      style={{ borderColor: 'var(--border)' }}>
                <option value="">Select rank</option>
                <optgroup label="Enlisted">
                  {['PVT','PV2','PFC','SPC','CPL','SGT','SSG','SFC','MSG','1SG','SGM','CSM','SMA'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
                <optgroup label="Warrant Officer">
                  {['WO1','CW2','CW3','CW4','CW5'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
                <optgroup label="Officer">
                  {['2LT','1LT','CPT','MAJ','LTC','COL','BG','MG','LTG','GEN','GA'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
                <option value="civilian">DA Civilian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Installation</label>
              <input type="text" name="base" placeholder="e.g. Fort Liberty, NC"
                     className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                     style={{ borderColor: 'var(--border)' }} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">PCS Date (optional)</label>
              <input type="date" name="pcs_date"
                     className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                     style={{ borderColor: 'var(--border)' }} />
              <p className="text-xs text-gray-400 mt-1">Helps us show you listings timed to your move</p>
            </div>

            <div className="pt-2">
              <button type="submit"
                      className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                      style={{ background: 'var(--army-green)' }}>
                Send Magic Link to My .mil Email
              </button>
            </div>

            <p className="text-xs text-center text-gray-400">
              We'll send a one-click login link — no password needed.
            </p>
          </form>

          <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: 'var(--army-green)' }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'rgba(75,83,32,0.06)', border: '1px solid rgba(75,83,32,0.15)' }}>
          <p className="text-xs text-gray-500">
            🔒 Your .mil email is used only to verify military status. Personal contact info is never shared with other users.
          </p>
        </div>
      </div>
    </div>
  )
}
