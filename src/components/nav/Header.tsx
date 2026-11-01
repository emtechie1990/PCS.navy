'use client'
import { useState } from 'react'
import Link from 'next/link'

const NAV = [
  { href: '/listings?category=housing', label: 'Find Housing' },
  { href: '/listings?category=vehicle', label: 'Vehicles' },
  { href: '/listings?category=goods',   label: 'Household Goods' },
  { href: '/bases',                      label: 'Duty Stations' },
  { href: '/checklist',                  label: 'PCS Resources' },
  { href: '/auth/login',                 label: 'Safety' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--navy-blue)', borderColor: 'var(--border)' }}>
      {/* disclaimer bar */}
      <div className="text-center text-xs py-1.5 border-b flex items-center justify-between px-4" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.3)' }}>
        <span>⚓ PCS.navy is an independent marketplace for military families. Not affiliated with or endorsed by the U.S. Navy or Department of Defense.</span>
        <Link href="/about" className="text-[var(--navy-gold)] hover:underline ml-4 shrink-0">Learn more</Link>
      </div>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">⚓</span>
          <span className="font-black text-lg tracking-tight" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--text-primary)' }}>
            PCS.<span style={{ color: 'var(--navy-gold)' }}>NAVY</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: 'rgba(240,244,250,0.75)' }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="hidden sm:block text-sm font-medium px-4 py-2 rounded-lg border transition-all hover:bg-white/5"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
            Sign In
          </Link>
          <Link href="/listings/create"
                className="text-sm font-bold px-4 py-2 rounded-lg transition-all hover:opacity-90"
                style={{ background: 'var(--navy-gold)', color: 'var(--navy-dark)' }}>
            + Post Listing
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
            <span style={{ color: 'var(--text-primary)' }}>{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t py-3 px-4 space-y-1" style={{ background: 'var(--navy-dark)', borderColor: 'var(--border)' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className="block py-2.5 text-sm font-medium hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
