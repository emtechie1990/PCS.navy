export type DutyStation = {
  id: string
  slug: string
  name: string
  state: string
  tagline: string
  bah_e5?: number   // monthly cents, E-5 with dependents
  lat?: number
  lng?: number
}

export const NAVY_BASES: DutyStation[] = [
  { id: 'ns-norfolk',       slug: 'naval-station-norfolk',     name: 'Naval Station Norfolk',          state: 'VA', tagline: "World's largest naval base",        bah_e5: 242100, lat: 36.9465, lng: -76.3263 },
  { id: 'nb-san-diego',     slug: 'naval-base-san-diego',      name: 'Naval Base San Diego',           state: 'CA', tagline: 'Pacific Fleet homeport',             bah_e5: 273000, lat: 32.6839, lng: -117.1308 },
  { id: 'nas-jacksonville', slug: 'nas-jacksonville',           name: 'NAS Jacksonville',               state: 'FL', tagline: 'Patrol and helo wings',             bah_e5: 181200, lat: 30.2242, lng: -81.6742 },
  { id: 'ns-mayport',       slug: 'naval-station-mayport',     name: 'Naval Station Mayport',          state: 'FL', tagline: '4th Fleet homeport',                bah_e5: 181200, lat: 30.3940, lng: -81.4257 },
  { id: 'nas-pensacola',    slug: 'nas-pensacola',              name: 'NAS Pensacola',                  state: 'FL', tagline: 'Cradle of Naval Aviation',          bah_e5: 168300, lat: 30.3529, lng: -87.3189 },
  { id: 'nb-kitsap',        slug: 'naval-base-kitsap',         name: 'Naval Base Kitsap',              state: 'WA', tagline: 'Puget Sound shipyards & subs',      bah_e5: 239700, lat: 47.5673, lng: -122.6261 },
  { id: 'nas-whidbey',      slug: 'nas-whidbey-island',        name: 'NAS Whidbey Island',             state: 'WA', tagline: 'Electronic attack wing',            bah_e5: 208200, lat: 48.3514, lng: -122.6558 },
  { id: 'ns-everett',       slug: 'naval-station-everett',     name: 'Naval Station Everett',          state: 'WA', tagline: 'Northwest homeport',                bah_e5: 239700, lat: 47.9771, lng: -122.2123 },
  { id: 'jb-pearl-hickam',  slug: 'jb-pearl-harbor-hickam',   name: 'JB Pearl Harbor-Hickam',         state: 'HI', tagline: 'Pacific Fleet HQ',                  bah_e5: 371700, lat: 21.3627, lng: -157.9459 },
  { id: 'ns-great-lakes',   slug: 'naval-station-great-lakes', name: 'Naval Station Great Lakes',      state: 'IL', tagline: 'Navy Boot Camp',                    bah_e5: 174000, lat: 42.2995, lng: -87.8029 },
  { id: 'nas-oceana',       slug: 'nas-oceana',                 name: 'NAS Oceana',                     state: 'VA', tagline: 'Master Jet Base',                   bah_e5: 208500, lat: 36.8208, lng: -76.0333 },
  { id: 'nsb-kings-bay',    slug: 'nsb-kings-bay',             name: 'NSB Kings Bay',                  state: 'GA', tagline: 'Atlantic ballistic sub base',       bah_e5: 148200, lat: 30.7980, lng: -81.5599 },
  { id: 'nsb-new-london',   slug: 'nsb-new-london',            name: 'NSB New London',                 state: 'CT', tagline: 'Submarine Capital of the World',    bah_e5: 238800, lat: 41.3773, lng: -72.0921 },
  { id: 'nas-lemoore',      slug: 'nas-lemoore',               name: 'NAS Lemoore',                    state: 'CA', tagline: 'Strike fighter wing',               bah_e5: 195000, lat: 36.3330, lng: -119.9521 },
  { id: 'nb-ventura',       slug: 'naval-base-ventura-county', name: 'Naval Base Ventura County',      state: 'CA', tagline: 'Seabees and test wing',             bah_e5: 321000, lat: 34.1637, lng: -119.2092 },
  { id: 'nas-corpus',       slug: 'nas-corpus-christi',        name: 'NAS Corpus Christi',             state: 'TX', tagline: 'Flight training hub',               bah_e5: 153600, lat: 27.6961, lng: -97.2868 },
  { id: 'nas-patuxent',     slug: 'nas-patuxent-river',        name: 'NAS Patuxent River',             state: 'MD', tagline: 'Naval air test center',             bah_e5: 228000, lat: 38.2857, lng: -76.4119 },
  { id: 'ns-rota',          slug: 'naval-station-rota',        name: 'Naval Station Rota',             state: 'Spain', tagline: 'Gateway to the Med',             bah_e5: 0 },
  { id: 'facflt-yokosuka',  slug: 'fleet-activities-yokosuka', name: 'Fleet Activities Yokosuka',      state: 'Japan', tagline: '7th Fleet homeport',             bah_e5: 0 },
  { id: 'nsa-bahrain',      slug: 'nsa-bahrain',               name: 'Naval Support Activity Bahrain', state: 'Bahrain', tagline: '5th Fleet headquarters',       bah_e5: 0 },
]

export function getBaseBySlug(slug: string): DutyStation | undefined {
  return NAVY_BASES.find(b => b.slug === slug)
}
