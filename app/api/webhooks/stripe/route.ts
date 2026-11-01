import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { listing_id?: string; tier?: string; category?: string }; id: string; amount_total?: number | null; customer_details?: { email?: string | null } }
    const { listing_id, tier } = session.metadata ?? {}

    if (listing_id && tier) {
      const { LISTING_DURATIONS_DAYS } = await import('@/lib/pricing')
      const category = (session.metadata?.category ?? 'goods') as keyof typeof LISTING_DURATIONS_DAYS
      const days = (LISTING_DURATIONS_DAYS[category] as Record<string, number>)[tier] ?? 30
      const expires_at = new Date(Date.now() + days * 86400000).toISOString()

      await supabase
        .from('listings')
        .update({ tier, expires_at, status: 'active' })
        .eq('id', listing_id)
    }
  }

  return NextResponse.json({ received: true })
}
