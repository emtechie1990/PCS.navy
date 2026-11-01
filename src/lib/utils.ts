export function getBranchName(): 'Army' | 'Navy' | 'Air Force' {
  const branch = process.env.NEXT_PUBLIC_BRANCH
  if (branch === 'navy') return 'Navy'
  if (branch === 'airforce') return 'Air Force'
  return 'Army'
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function isValidMilEmail(email: string): boolean {
  return email.toLowerCase().endsWith('.mil')
}
