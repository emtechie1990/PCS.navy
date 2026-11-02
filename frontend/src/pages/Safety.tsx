import { Link } from "react-router-dom";
import { AlertOctagon, Ban, FileText, Lock, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useBrand } from "@/lib/hooks";

const SECTIONS = [
  { id: "independent", label: "Independent service", icon: ShieldAlert },
  { id: "scams", label: "Scam reporting", icon: AlertOctagon },
  { id: "prohibited", label: "Prohibited listings", icon: Ban },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "terms", label: "Terms of use", icon: FileText },
];

export default function Safety() {
  const { branch, domain, disclaimer, station } = useBrand();
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">Safety & terms</p>
      <h1 className="mt-1 text-5xl font-bold uppercase" data-testid="safety-heading">Trust is the mission</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <nav className="h-fit space-y-1 lg:sticky lg:top-24 lg:col-span-3">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="ocp-strip flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted" data-testid={`safety-nav-${s.id}`}>
              <s.icon className="size-4 text-ocp" /> {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-8 lg:col-span-9 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:uppercase [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_section]:scroll-mt-28 [&_section]:rounded-md [&_section]:border [&_section]:border-border [&_section]:bg-card [&_section]:p-6 [&_ul]:mt-3 [&_ul]:space-y-1.5">
          <section id="independent" className="!border-l-[3px] !border-l-gold" data-testid="safety-independent">
            <h2>Independent-service notice</h2>
            <p className="mt-3">{disclaimer}</p>
            <p className="mt-3 text-muted-foreground">
              We do not process PCS orders, entitlements, household goods shipments, or government housing assignments.
              For those, use the official programs listed on our <Link to="/resources" className="text-ocp underline">PCS resources</Link> page.
              {branch} and {station} names are used only to describe locations.
            </p>
          </section>

          <section id="scams" data-testid="safety-scams">
            <h2>Scam reporting</h2>
            <p className="mt-3">Military families are prime targets for rental and vehicle scams during PCS season. Red flags:</p>
            <ul>
              <li>"Landlord" is deployed or overseas and can't show the home — but wants a deposit now.</li>
              <li>Requests for wire transfers, gift cards, crypto, or payment apps before you've seen the item.</li>
              <li>Prices far below market, pressure to decide today, or requests to move off-platform immediately.</li>
              <li>Asks for your SSN, DoD ID, orders, or bank login.</li>
            </ul>
            <p className="mt-4">
              See something? Use the <strong>Report this listing</strong> button on any listing. Reports go straight to
              our moderation queue; suspicious listings are hidden while we investigate. If you lost money, also contact
              your {station}'s legal assistance office and file at <a href="https://reportfraud.ftc.gov" target="_blank" rel="noreferrer" className="text-ocp underline">ReportFraud.ftc.gov</a> (FTC).
            </p>
          </section>

          <section id="prohibited" data-testid="safety-prohibited">
            <h2>Prohibited listings</h2>
            <ul>
              <li>Government-issued property: uniforms with unit insignia, body armor plates, issued field gear, night vision.</li>
              <li>Firearms, ammunition, explosives, and weapon parts regulated by ATF/ITAR.</li>
              <li>Military ID cards, CAC readers with credentials, orders or official documents.</li>
              <li>Prescription drugs, alcohol, tobacco/vape products, and live animals for sale.</li>
              <li>Housing you don't own or aren't authorized to sublet (including government quarters).</li>
              <li>Discriminatory housing listings — all listings must comply with the Fair Housing Act.</li>
            </ul>
          </section>

          <section id="privacy" data-testid="safety-privacy">
            <h2>Privacy</h2>
            <p className="mt-3">
              We store only what's needed to run the marketplace: your account email and name, listings you post, and
              reports you submit. Contact details you put on a listing are shown to viewers who click "Show contact".
              We never sell personal data. Passwords are stored hashed; password resets are sent by email link only, and
              we will never ask for your password. Request deletion of your account and data anytime.
            </p>
            <p className="mt-3 text-muted-foreground">OPSEC tip: don't post unit names, deployment dates, or exact report dates in listings.</p>
          </section>

          <section id="terms" data-testid="safety-terms">
            <h2>Terms of use</h2>
            <ul>
              <li>Transactions are between buyers and sellers. {domain} is not a party to any sale or lease.</li>
              <li>Moderators may approve, hide, investigate, or remove any listing at any time.</li>
              <li>Spotlight upgrades (when available) affect placement only — not verification or approval.</li>
              <li>By posting, you confirm you have the right to sell or rent what you list.</li>
              <li>Listings marked "Sample" are placeholders shown for illustration and are not real offers.</li>
            </ul>
          </section>

          <Link to="/search" className={buttonVariants()} data-testid="safety-browse-button">Browse listings</Link>
        </div>
      </div>
    </div>
  );
}
