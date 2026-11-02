"""One codebase, three sites. BRAND env (army | navy | airforce) picks everything branch-specific:
copy, colors, installations and their nearby towns, official resources, sample-listing voice."""

import os

# (id, name, short_name, former_name, city, state, tagline, areas)
ARMY = [
    ("fort-bragg", "Fort Bragg", "Bragg", "Fort Liberty", "Fayetteville", "NC",
     "Home of the Airborne and Special Operations.", ["Fayetteville", "Spring Lake", "Hope Mills", "Raeford", "Sanford", "On Post"]),
    ("fort-hood", "Fort Hood", "Hood", "Fort Cavazos", "Killeen", "TX",
     "The Great Place — Central Texas.", ["Killeen", "Harker Heights", "Copperas Cove", "Belton", "Nolanville", "On Post"]),
    ("jblm", "Joint Base Lewis-McChord", "JBLM", None, "Tacoma", "WA",
     "Pacific Northwest power projection platform.", ["Lakewood", "DuPont", "Lacey", "Spanaway", "Tacoma", "On Post"]),
    ("fort-campbell", "Fort Campbell", "Campbell", None, "Clarksville", "KY/TN",
     "Home of the 101st Airborne (Air Assault).", ["Clarksville", "Oak Grove", "Hopkinsville", "Hopkinsville Rd", "On Post"]),
    ("fort-carson", "Fort Carson", "Carson", None, "Colorado Springs", "CO",
     "The Mountain Post.", ["Colorado Springs", "Fountain", "Security-Widefield", "Monument", "On Post"]),
    ("fort-bliss", "Fort Bliss", "Bliss", None, "El Paso", "TX",
     "Desert training at America's largest installation.", ["Northeast El Paso", "Horizon City", "Las Cruces", "Socorro", "On Post"]),
    ("fort-stewart", "Fort Stewart", "Stewart", None, "Hinesville", "GA",
     "Marne country on the Georgia coast.", ["Hinesville", "Richmond Hill", "Pooler", "Savannah", "On Post"]),
    ("fort-riley", "Fort Riley", "Riley", None, "Junction City", "KS",
     "Home of the Big Red One.", ["Junction City", "Manhattan", "Ogden", "Grandview Plaza", "On Post"]),
    ("fort-drum", "Fort Drum", "Drum", None, "Watertown", "NY",
     "Home of the 10th Mountain Division.", ["Watertown", "Carthage", "Black River", "Evans Mills", "On Post"]),
    ("fort-benning", "Fort Benning", "Benning", "Fort Moore", "Columbus", "GA",
     "Home of the Infantry and Armor.", ["Columbus", "Phenix City", "Midland", "Cusseta", "On Post"]),
    ("fort-polk", "Fort Polk", "Polk", "Fort Johnson", "Leesville", "LA",
     "JRTC and the Louisiana pines.", ["Leesville", "DeRidder", "New Llano", "On Post"]),
    ("fort-sill", "Fort Sill", "Sill", None, "Lawton", "OK",
     "Home of the Field Artillery.", ["Lawton", "Elgin", "Cache", "On Post"]),
    ("fort-leonard-wood", "Fort Leonard Wood", "Leonard Wood", None, "Waynesville", "MO",
     "Maneuver Support Center of Excellence.", ["Waynesville", "St. Robert", "Rolla", "On Post"]),
    ("schofield-barracks", "Schofield Barracks", "Schofield", None, "Wahiawa", "HI",
     "25th Infantry Division — Tropic Lightning.", ["Wahiawa", "Mililani", "Ewa Beach", "Kapolei", "On Post"]),
    ("fort-wainwright", "Fort Wainwright", "Wainwright", None, "Fairbanks", "AK",
     "Arctic Warriors in the Last Frontier.", ["Fairbanks", "North Pole", "Badger", "On Post"]),
    ("fort-gordon", "Fort Gordon", "Gordon", "Fort Eisenhower", "Augusta", "GA",
     "Cyber Center of Excellence.", ["Augusta", "Grovetown", "Evans", "Martinez", "On Post"]),
    ("fort-lee", "Fort Lee", "Lee", "Fort Gregg-Adams", "Petersburg", "VA",
     "Sustainment Center of Excellence.", ["Petersburg", "Prince George", "Colonial Heights", "Hopewell", "On Post"]),
    ("fort-knox", "Fort Knox", "Knox", None, "Radcliff", "KY",
     "Cadet Command and Human Resources Command.", ["Radcliff", "Elizabethtown", "Vine Grove", "Brandenburg", "On Post"]),
]

NAVY = [
    ("norfolk", "Naval Station Norfolk", "Norfolk", None, "Norfolk", "VA",
     "World's largest naval base.", ["Norfolk", "Virginia Beach", "Chesapeake", "Portsmouth", "Suffolk", "On Base"]),
    ("san-diego", "Naval Base San Diego", "San Diego", None, "San Diego", "CA",
     "Pacific Fleet homeport.", ["San Diego", "Chula Vista", "National City", "Imperial Beach", "Santee", "El Cajon", "On Base"]),
    ("nas-jacksonville", "NAS Jacksonville", "NAS Jax", None, "Jacksonville", "FL",
     "Patrol and helo wings.", ["Jacksonville", "Orange Park", "Fleming Island", "Middleburg", "Mandarin", "On Base"]),
    ("mayport", "Naval Station Mayport", "Mayport", None, "Jacksonville", "FL",
     "4th Fleet.", ["Atlantic Beach", "Jacksonville Beach", "Neptune Beach", "Ponte Vedra", "Arlington", "On Base"]),
    ("nas-pensacola", "NAS Pensacola", "Pensacola", None, "Pensacola", "FL",
     "Cradle of Naval Aviation.", ["Pensacola", "Gulf Breeze", "Navarre", "Milton", "Pace", "On Base"]),
    ("kitsap", "Naval Base Kitsap", "Kitsap", None, "Bremerton", "WA",
     "Puget Sound shipyards and subs.", ["Bremerton", "Silverdale", "Poulsbo", "Port Orchard", "Bainbridge Island", "On Base"]),
    ("whidbey-island", "NAS Whidbey Island", "Whidbey", None, "Oak Harbor", "WA",
     "Electronic attack.", ["Oak Harbor", "Coupeville", "Anacortes", "Mount Vernon", "On Base"]),
    ("everett", "Naval Station Everett", "Everett", None, "Everett", "WA",
     "Northwest homeport.", ["Everett", "Marysville", "Lake Stevens", "Mukilteo", "Snohomish", "On Base"]),
    ("pearl-harbor-hickam", "JB Pearl Harbor-Hickam", "Pearl Harbor", None, "Honolulu", "HI",
     "Pacific Fleet headquarters.", ["Honolulu", "Aiea", "Pearl City", "Ewa Beach", "Kapolei", "Mililani", "On Base"]),
    ("great-lakes", "Naval Station Great Lakes", "Great Lakes", None, "North Chicago", "IL",
     "Navy boot camp.", ["North Chicago", "Waukegan", "Gurnee", "Lake Bluff", "Libertyville", "On Base"]),
    ("nas-oceana", "NAS Oceana", "Oceana", None, "Virginia Beach", "VA",
     "Master Jet Base.", ["Virginia Beach", "Chesapeake", "Norfolk", "Sandbridge", "On Base"]),
    ("kings-bay", "NSB Kings Bay", "Kings Bay", None, "St. Marys", "GA",
     "Atlantic ballistic subs.", ["St. Marys", "Kingsland", "Fernandina Beach", "Yulee", "Brunswick", "On Base"]),
    ("new-london", "NSB New London", "New London", None, "Groton", "CT",
     "Submarine Capital of the World.", ["Groton", "New London", "Mystic", "Ledyard", "Norwich", "On Base"]),
    ("nas-lemoore", "NAS Lemoore", "Lemoore", None, "Lemoore", "CA",
     "Strike fighter wing.", ["Lemoore", "Hanford", "Visalia", "Fresno", "On Base"]),
    ("ventura-county", "Naval Base Ventura County", "Ventura County", None, "Oxnard", "CA",
     "Seabees and test wing.", ["Oxnard", "Port Hueneme", "Camarillo", "Ventura", "Thousand Oaks", "On Base"]),
    ("nas-corpus-christi", "NAS Corpus Christi", "Corpus Christi", None, "Corpus Christi", "TX",
     "Flight training.", ["Corpus Christi", "Flour Bluff", "Portland", "Padre Island", "On Base"]),
    ("nas-patuxent-river", "NAS Patuxent River", "Pax River", None, "Lexington Park", "MD",
     "Naval air test center.", ["Lexington Park", "California", "Leonardtown", "Hollywood", "Solomons", "On Base"]),
    ("rota", "Naval Station Rota", "Rota", None, "Rota", "Spain",
     "Gateway to the Med.", ["Rota", "El Puerto de Santa María", "Chipiona", "Jerez", "On Base"]),
    ("yokosuka", "Fleet Activities Yokosuka", "Yokosuka", None, "Yokosuka", "Japan",
     "7th Fleet.", ["Yokosuka", "Zushi", "Yokohama", "Hayama", "Ikego", "On Base"]),
    ("bahrain", "Naval Support Activity Bahrain", "Bahrain", None, "Manama", "Bahrain",
     "5th Fleet.", ["Juffair", "Manama", "Amwaj Islands", "Saar", "On Base"]),
]

AIRFORCE = [
    ("jbsa-lackland", "JBSA-Lackland", "Lackland", None, "San Antonio", "TX",
     "Gateway to the Air Force.", ["San Antonio", "Universal City", "Schertz", "Helotes", "Converse", "Cibolo", "On Base"]),
    ("eglin", "Eglin AFB", "Eglin", None, "Valparaiso", "FL",
     "Air Armament Center.", ["Niceville", "Valparaiso", "Fort Walton Beach", "Crestview", "Destin", "Shalimar", "On Base"]),
    ("nellis", "Nellis AFB", "Nellis", None, "Las Vegas", "NV",
     "Home of the Fighter Pilot.", ["North Las Vegas", "Las Vegas", "Henderson", "Sunrise Manor", "On Base"]),
    ("wright-patterson", "Wright-Patterson AFB", "Wright-Patt", None, "Dayton", "OH",
     "Birthplace of aviation.", ["Fairborn", "Beavercreek", "Huber Heights", "Dayton", "Xenia", "On Base"]),
    ("langley-eustis", "JB Langley-Eustis", "Langley", None, "Hampton", "VA",
     "ACC headquarters.", ["Hampton", "Newport News", "Yorktown", "Poquoson", "Williamsburg", "On Base"]),
    ("travis", "Travis AFB", "Travis", None, "Fairfield", "CA",
     "Gateway to the Pacific.", ["Fairfield", "Vacaville", "Suisun City", "Dixon", "On Base"]),
    ("hill", "Hill AFB", "Hill", None, "Ogden", "UT",
     "F-35 country.", ["Layton", "Clearfield", "Syracuse", "Roy", "Ogden", "Kaysville", "On Base"]),
    ("davis-monthan", "Davis-Monthan AFB", "Davis-Monthan", None, "Tucson", "AZ",
     "Desert air power.", ["Tucson", "Vail", "Sahuarita", "Oro Valley", "Marana", "On Base"]),
    ("barksdale", "Barksdale AFB", "Barksdale", None, "Bossier City", "LA",
     "Global Strike.", ["Bossier City", "Shreveport", "Haughton", "Benton", "On Base"]),
    ("offutt", "Offutt AFB", "Offutt", None, "Bellevue", "NE",
     "Home of STRATCOM.", ["Bellevue", "Papillion", "La Vista", "Omaha", "Gretna", "On Base"]),
    ("luke", "Luke AFB", "Luke", None, "Glendale", "AZ",
     "Fighter training.", ["Glendale", "Litchfield Park", "Goodyear", "Surprise", "Peoria", "Buckeye", "On Base"]),
    ("tinker", "Tinker AFB", "Tinker", None, "Oklahoma City", "OK",
     "Air Logistics Complex.", ["Midwest City", "Del City", "Moore", "Choctaw", "Oklahoma City", "Norman", "On Base"]),
    ("scott", "Scott AFB", "Scott", None, "Belleville", "IL",
     "Air Mobility Command.", ["Belleville", "O'Fallon", "Shiloh", "Mascoutah", "Swansea", "On Base"]),
    ("macdill", "MacDill AFB", "MacDill", None, "Tampa", "FL",
     "CENTCOM and SOCOM.", ["South Tampa", "Tampa", "Brandon", "Riverview", "St. Petersburg", "On Base"]),
    ("keesler", "Keesler AFB", "Keesler", None, "Biloxi", "MS",
     "Hurricane Hunters.", ["Biloxi", "Gulfport", "D'Iberville", "Ocean Springs", "On Base"]),
    ("elmendorf-richardson", "JB Elmendorf-Richardson", "JBER", None, "Anchorage", "AK",
     "Top Cover for America.", ["Anchorage", "Eagle River", "Chugiak", "Wasilla", "Palmer", "On Base"]),
    ("andrews", "JB Andrews", "Andrews", None, "Camp Springs", "MD",
     "Home of Air Force One.", ["Clinton", "Camp Springs", "Upper Marlboro", "Waldorf", "Bowie", "Alexandria", "On Base"]),
    ("ramstein", "Ramstein AB", "Ramstein", None, "Kaiserslautern", "Germany",
     "USAFE hub.", ["Kaiserslautern", "Landstuhl", "Ramstein-Miesenbach", "Weilerbach", "Mackenbach", "On Base"]),
    ("kadena", "Kadena AB", "Kadena", None, "Okinawa", "Japan",
     "Keystone of the Pacific.", ["Okinawa City", "Chatan", "Kadena", "Yomitan", "Uruma", "On Base"]),
    ("dover", "Dover AFB", "Dover", None, "Dover", "DE",
     "Eagle Wing of Liberty.", ["Dover", "Camden", "Magnolia", "Smyrna", "Milford", "On Base"]),
]

# (name, url, source, kind, group, description) — kind: official | partner | community
COMMON_RESOURCES = [
    ("Plan My Move", "https://planmymove.militaryonesource.mil", "Military OneSource (DoD)", "official", "Plan the move",
     "Build a customizable PCS checklist and timeline tied to your gaining {station}."),
    ("Defense Personal Property System (DPS)", "https://www.militarymoves.mil", "USTRANSCOM", "official", "Plan the move",
     "Schedule your household goods shipment or set up a Personally Procured Move (PPM / DITY)."),
    ("MilitaryINSTALLATIONS", "https://installations.militaryonesource.mil", "Military OneSource (DoD)", "official", "Plan the move",
     "Directory of programs, services and phone numbers for every {station}."),
    ("HOMES.mil", "https://www.homes.mil", "DoD Housing", "official", "Housing",
     "Official DoD housing search — on-base, privatized, and vetted off-base rentals; contact your housing office."),
    ("AHRN.com", "https://www.ahrn.com", "Automated Housing Referral Network", "partner", "Housing",
     "Military-focused rental and housing referral network used by many housing offices."),
    ("MilitaryByOwner", "https://www.militarybyowner.com", "MilitaryByOwner (private)", "community", "Housing",
     "Military-focused homes for rent and sale by owner."),
    ("BAH Rate Lookup", "https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/",
     "Defense Travel Management Office", "official", "Money & entitlements",
     "Look up Basic Allowance for Housing by ZIP code, pay grade and dependency status."),
    ("PCS Entitlements (DTMO)", "https://www.travel.dod.mil", "Defense Travel Management Office", "official", "Money & entitlements",
     "TLE, DLA, mileage and per-diem rules for your move."),
    ("Military OneSource", "https://www.militaryonesource.mil", "DoD", "official", "Family support",
     "Free 24/7 counseling, relocation consultants and spouse employment help: 800-342-9647."),
]

BRANDS = {
    "army": {
        "slug": "army",
        "camo": {"base": "#23261A", "blocks": ["rgba(75,83,32,0.55)", "rgba(129,97,60,0.35)", "rgba(26,26,26,0.55)", "rgba(138,143,94,0.25)"], "veil": "20,22,14", "accent_light": "#C8A951"}, "domain": "PCS.army", "url": "https://pcs.army", "branch": "Army",
        "members": "soldiers", "member": "soldier", "station": "installation", "stations": "installations",
        "verified": ".mil", "logo": "shield", "theme": "#4B5320",
        "headline": ["Your next duty station", "starts here."],
        "lede": "Find a home near the gate, sell the truck before you ship out, and pass the couch to the family "
                "moving in. One marketplace, organized by installation, built for soldiers and their families.",
        "hero": {"image": "/img/hero-army.jpg", "alt": "Soldier in uniform embracing her daughter", "position": "50% 50%"},
        "side": {"image": "/img/house-2.jpg", "alt": "Single-family home near post"},
        "installations": ARMY, "default_installation": "fort-bragg",
        "resources": [
            ("My Army PCS / Army PCS info", "https://www.army.mil/pcs", "U.S. Army", "official", "Plan the move",
             "Army PCS guidance, sponsorship info and links to the My Army PCS app."),
            ("Army Housing Online", "https://www.housing.army.mil", "U.S. Army", "official", "Housing",
             "Army family and unaccompanied housing information and housing office contacts."),
            ("Army Community Service (ACS) Relocation", "https://www.armymwr.com/programs-and-services/personal-assistance/relocation-readiness",
             "Army MWR", "official", "Family support",
             "Lending closets, sponsorship training and relocation readiness classes on every installation."),
        ],
        "ranks": ["SSG", "CPT", "SFC", "SPC", "SGT", "1LT"], "oconus": ["Germany", "Korea"],
        "colors": {"primary": "#4B5320", "primary_dark": "#353B16", "secondary": "#81613C", "accent": "#C8A951",
                   "ink": "#1A1A1A", "paper": "#F5F4F0", "sand": "#E9E5DA", "muted": "#5B574E", "border": "#DAD5C8"},
    },
    "navy": {
        "slug": "navy",
        "camo": {"base": "#0D1B30", "blocks": ["rgba(38,70,120,0.55)", "rgba(80,110,150,0.35)", "rgba(6,12,24,0.60)", "rgba(120,140,170,0.25)"], "veil": "5,12,26", "accent_light": "#E8D9A8"}, "domain": "PCS.navy", "url": "https://pcs.navy", "branch": "Navy",
        "members": "Sailors", "member": "Sailor", "station": "duty station", "stations": "duty stations",
        "verified": ".navy.mil", "logo": "anchor", "theme": "#0B1F3A",
        "headline": ["Your next homeport", "starts here."],
        "lede": "Find a home near the pier, sell the car before you report aboard, and pass the furniture to the family "
                "checking in. One marketplace, organized by duty station, built for Sailors and their families.",
        "hero": {"image": "/img/hero-navy.jpg", "alt": "Aircraft carrier underway in San Diego Bay", "position": "50% 100%"},
        "side": {"image": "/img/side-navy.jpg", "alt": "Sailor greeting family at a homecoming"},
        "installations": NAVY, "default_installation": "norfolk",
        "resources": [
            ("MyNavy HR", "https://www.mynavyhr.navy.mil", "U.S. Navy", "official", "Plan the move",
             "Orders, transfers and PCS guidance for Sailors."),
            ("CNIC — Navy Installations", "https://www.cnic.navy.mil", "Commander, Navy Installations Command", "official", "Housing",
             "Installation pages, Navy housing and family programs."),
            ("Fleet & Family Support Program", "https://www.ffsp.navy.mil", "U.S. Navy", "official", "Family support",
             "Relocation assistance, loan lockers and spouse support."),
        ],
        "ranks": ["PO1", "LT", "CPO", "PO3", "PO2", "LTJG"], "oconus": ["Japan", "Rota"],
        "colors": {"primary": "#0B1F3A", "primary_dark": "#06142A", "secondary": "#55606F", "accent": "#C5A253",
                   "ink": "#0A1424", "paper": "#F6F5F1", "sand": "#E7E4DA", "muted": "#55606F", "border": "#D8D5CB"},
    },
    "airforce": {
        "slug": "airforce",
        "camo": {"base": "#141E33", "blocks": ["rgba(93,138,168,0.45)", "rgba(167,169,172,0.30)", "rgba(11,20,38,0.60)", "rgba(0,48,143,0.40)"], "veil": "8,14,30", "accent_light": "#FFC72C"}, "domain": "PCS.airforce", "url": "https://pcs.airforce", "branch": "Air Force",
        "members": "Airmen", "member": "Airman", "station": "base", "stations": "bases",
        "verified": ".af.mil", "logo": "wings", "theme": "#00308F",
        "headline": ["Your next assignment", "starts here."],
        "lede": "Find a home outside the gate, sell the truck before your PCS, and pass the couch to the family arriving "
                "on the next assignment. One marketplace, organized by base, built for Airmen and their families.",
        "hero": {"image": "/img/hero-airforce.jpg", "alt": "Fighter jet on the flight line at sunset", "position": "50% 50%"},
        "side": {"image": "/img/side-airforce.jpg", "alt": "Families walking the flight line beside parked military aircraft"},
        "installations": AIRFORCE, "default_installation": "jbsa-lackland",
        "resources": [
            ("myPers", "https://mypers.af.mil", "Air Force Personnel Center", "official", "Plan the move",
             "Assignment, PCS orders and personnel support for Airmen."),
            ("Air Force Personnel Center", "https://www.afpc.af.mil", "U.S. Air Force", "official", "Plan the move",
             "Assignments, relocation guidance and career programs."),
        ],
        "ranks": ["TSgt", "Capt", "MSgt", "A1C", "SSgt", "1st Lt"], "oconus": ["Ramstein", "Kadena"],
        "colors": {"primary": "#00308F", "primary_dark": "#001F5C", "secondary": "#566175", "accent": "#FFC72C",
                   "ink": "#0B1426", "paper": "#F4F6F9", "sand": "#E3E8EF", "muted": "#566175", "border": "#D3DAE5"},
    },
}

BRAND = BRANDS[os.environ.get("BRAND", "army")]
SIBLINGS = [(b["domain"], b["url"]) for b in BRANDS.values()]


def disclaimer() -> str:
    return (f"{BRAND['domain']} is an independent marketplace for military families. "
            f"Not affiliated with or endorsed by the U.S. {BRAND['branch']} or Department of Defense.")


def resources() -> list[dict]:
    rows = BRAND["resources"] + COMMON_RESOURCES
    return [{"name": n, "url": u, "source": s, "kind": k, "group": g,
             "description": d.format(station=BRAND["station"])} for n, u, s, k, g, d in rows]


def public() -> dict:
    """What the frontend needs (GET /api/brand)."""
    keys = ("slug", "domain", "url", "branch", "members", "member", "station", "stations", "verified", "logo", "theme",
            "headline", "lede", "hero", "side", "default_installation")
    return {**{k: BRAND[k] for k in keys}, "disclaimer": disclaimer(), "resources": resources(),
            "siblings": [{"domain": d, "url": u} for d, u in SIBLINGS]}
