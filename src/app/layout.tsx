import type { Metadata } from 'next'
import { Oswald, Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/nav/Header'
import { Footer } from '@/components/nav/Footer'

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const branch = process.env.NEXT_PUBLIC_BRANCH ?? 'army'
const branchName = branch === 'navy' ? 'Navy' : branch === 'airforce' ? 'Air Force' : 'Army'

export const metadata: Metadata = {
  title: `PCS.${branch} — The Verified Military Marketplace`,
  description: `Buy, sell, and find housing, vehicles, and household goods near ${branchName} installations. Verified .mil accounts only.`,
  keywords: [`PCS`, `military marketplace`, `military housing`, `${branchName} bases`, `PCS move`, `military vehicles`],
  openGraph: {
    title: `PCS.${branch} — Verified Military Marketplace`,
    description: `The trusted marketplace for ${branchName} PCS moves.`,
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body className="font-inter antialiased min-h-screen flex flex-col bg-[#f5f4f0]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
