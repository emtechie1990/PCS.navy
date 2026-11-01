import { Base } from '@/types'

export const ARMY_BASES: Base[] = [
  { id: '1', name: 'Fort Liberty', slug: 'fort-liberty', state: 'NC', bah_e5: 192300, lat: 35.1397, lng: -79.0061, branch: 'army' },
  { id: '2', name: 'Fort Campbell', slug: 'fort-campbell', state: 'KY', bah_e5: 159000, lat: 36.6586, lng: -87.4681, branch: 'army' },
  { id: '3', name: 'Fort Hood (Cavazos)', slug: 'fort-cavazos', state: 'TX', bah_e5: 153900, lat: 31.1349, lng: -97.7756, branch: 'army' },
  { id: '4', name: 'Fort Bliss', slug: 'fort-bliss', state: 'TX', bah_e5: 138900, lat: 31.8126, lng: -106.4195, branch: 'army' },
  { id: '5', name: 'Fort Wainwright', slug: 'fort-wainwright', state: 'AK', bah_e5: 258600, lat: 64.8267, lng: -147.6525, branch: 'army' },
  { id: '6', name: 'Fort Stewart', slug: 'fort-stewart', state: 'GA', bah_e5: 138000, lat: 31.8693, lng: -81.6082, branch: 'army' },
  { id: '7', name: 'Joint Base Lewis-McChord', slug: 'jblm', state: 'WA', bah_e5: 225000, lat: 47.1151, lng: -122.5920, branch: 'army' },
  { id: '8', name: 'Fort Gordon (Eisenhower)', slug: 'fort-eisenhower', state: 'GA', bah_e5: 138000, lat: 33.4225, lng: -82.1498, branch: 'army' },
  { id: '9', name: 'Fort Drum', slug: 'fort-drum', state: 'NY', bah_e5: 160500, lat: 44.0514, lng: -75.7688, branch: 'army' },
  { id: '10', name: 'Fort Huachuca', slug: 'fort-huachuca', state: 'AZ', bah_e5: 129900, lat: 31.5559, lng: -110.3442, branch: 'army' },
  { id: '11', name: 'Fort Riley', slug: 'fort-riley', state: 'KS', bah_e5: 126000, lat: 39.0551, lng: -96.8006, branch: 'army' },
  { id: '12', name: 'Fort Sill', slug: 'fort-sill', state: 'OK', bah_e5: 126000, lat: 34.6499, lng: -98.4058, branch: 'army' },
  { id: '13', name: 'Fort Knox', slug: 'fort-knox', state: 'KY', bah_e5: 138000, lat: 37.9009, lng: -85.9621, branch: 'army' },
  { id: '14', name: 'Fort Leavenworth', slug: 'fort-leavenworth', state: 'KS', bah_e5: 150000, lat: 39.3622, lng: -94.9219, branch: 'army' },
  { id: '15', name: 'Fort Leonard Wood', slug: 'fort-leonard-wood', state: 'MO', bah_e5: 120000, lat: 37.7237, lng: -92.1382, branch: 'army' },
  { id: '16', name: 'Fort Carson', slug: 'fort-carson', state: 'CO', bah_e5: 171900, lat: 38.7352, lng: -104.7877, branch: 'army' },
  { id: '17', name: 'Fort Benning (Moore)', slug: 'fort-moore', state: 'GA', bah_e5: 138000, lat: 32.3543, lng: -84.9996, branch: 'army' },
  { id: '18', name: 'Fort Shafter', slug: 'fort-shafter', state: 'HI', bah_e5: 336000, lat: 21.3553, lng: -157.8891, branch: 'army' },
  { id: '19', name: 'Schofield Barracks', slug: 'schofield-barracks', state: 'HI', bah_e5: 336000, lat: 21.4967, lng: -158.0646, branch: 'army' },
  { id: '20', name: 'Fort Meade', slug: 'fort-meade', state: 'MD', bah_e5: 261900, lat: 39.1084, lng: -76.7302, branch: 'army' },
]

export function getBaseBySlug(slug: string): Base | undefined {
  return ARMY_BASES.find(b => b.slug === slug)
}
