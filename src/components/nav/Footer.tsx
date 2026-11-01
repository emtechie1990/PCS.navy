import Link from 'next/link'

const branch = process.env.NEXT_PUBLIC_BRANCH ?? 'army'
const branchName = branch === 'navy' ? 'Navy' : branch === 'airforce' ? 'Air Force' : 'Army'

export function Footer() {
  return (
    <footer className="border-t mt-16" style={{ background: 'var(--army-green)', borderColor: 'var(--army-green-dark)' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0"
                   style={{ background: 'var(--army-gold)', color: '#1a1a1a', fontFamily: 'var(--font-oswald)' }}>
                PCS
              </div>
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-oswald)' }}>
                PCS.{branch}
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              The verified marketplace for {branchName} PCS moves. Housing, vehicles, and household goods — all in one place.
            </p>
            <p className="text-white/40 text-xs mt-4">Not affiliated with the U.S. Department of Defense.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Browse</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/listings?category=housing" className="hover:text-white transition-colors">Housing Listings</Link></li>
              <li><Link href="/listings?category=vehicle" className="hover:text-white transition-colors">Vehicle Listings</Link></li>
              <li><Link href="/listings?category=goods" className="hover:text-white transition-colors">Household Goods</Link></li>
              <li><Link href="/bases" className="hover:text-white transition-colors">Base Directory</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Resources</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/checklist" className="hover:text-white transition-colors">PCS Checklist</Link></li>
              <li><Link href="/listings/create" className="hover:text-white transition-colors">Post a Listing</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">My Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Other Branches</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="https://pcs.navy" className="hover:text-white transition-colors">PCS.navy</a></li>
              <li><a href="https://pcs.airforce" className="hover:text-white transition-colors">PCS.airforce</a></li>
              <li className="pt-2 text-white/40 text-xs">Coming soon</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} PCS.{branch} — All rights reserved</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white/70">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/70">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white/70">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
