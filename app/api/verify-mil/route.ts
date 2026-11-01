import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const domain = email?.split('@')[1]?.toLowerCase()
  const valid = Boolean(domain?.endsWith('.mil'))
  return NextResponse.json({ valid })
}
