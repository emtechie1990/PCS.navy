'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style={{ background: 'var(--army-green)' }}>
            <span className="text-white text-2xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>
            Sign In
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Enter your .mil email to receive a sign-in link</p>
        </div>

        <div className="card-base p-8">
          {!sent ? (
            <form onSubmit={e => { e.preventDefault(); setSent(true) }} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Military Email (.mil)
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john.smith@mail.mil"
                  required
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--army-green)]"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              <button type="submit"
                      className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                      style={{ background: 'var(--army-green)' }}>
                Send Magic Link
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h3 className="font-black text-lg text-gray-900 mb-2" style={{ fontFamily: 'var(--font-oswald)' }}>
                Check Your .mil Email
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                We sent a one-click sign-in link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-400 mb-4">Link expires in 1 hour. Check spam if you don't see it.</p>
              <button onClick={() => setSent(false)} className="text-xs text-gray-500 hover:underline">
                ← Use a different email
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm text-gray-500">
              No account?{' '}
              <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: 'var(--army-green)' }}>
                Register Free
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          Verified .mil email required · No password · No spam
        </p>
      </div>
    </div>
  )
}
