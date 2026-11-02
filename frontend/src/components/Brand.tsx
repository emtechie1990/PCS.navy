import { Link } from "react-router-dom";
import { useBrand } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** Unit-patch style mark per branch: Army shield + star, Navy anchor in a shield, Air Force winged star.
    Drawn in brand tokens so the same SVG recolors with the site. No official service emblem is reproduced. */
export function LogoMark({ className }: { className?: string }) {
  const { logo } = useBrand();
  if (logo === "wings") {
    return (
      <svg viewBox="0 0 64 40" className={cn("h-8 w-12", className)} aria-hidden="true">
        <path d="M32 4 L2 14 L14 18 L4 24 L20 24 L32 36 L44 24 L60 24 L50 18 L62 14 Z" fill="var(--brand-primary)" stroke="var(--brand-accent)" strokeWidth="1.6" strokeLinejoin="round" />
        <polygon points="32,10 34.4,16.8 41.6,17 35.9,21.4 38,28.2 32,24.2 26,28.2 28.1,21.4 22.4,17 29.6,16.8" fill="var(--brand-accent)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 46" className={cn("h-9 w-8", className)} aria-hidden="true">
      <path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill="var(--brand-primary)" stroke="var(--brand-accent)" strokeWidth="2" />
      {logo === "anchor" ? (
        <>
          <circle cx="20" cy="11" r="3" fill="none" stroke="var(--brand-accent)" strokeWidth="2" />
          <path d="M20 14 V36 M13 19 H27 M9 27 C10 33 15 36 20 36 C25 36 30 33 31 27" fill="none" stroke="var(--brand-accent)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M6 27 L9 24 L12 27 M28 27 L31 24 L34 27" fill="none" stroke="var(--brand-accent)" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M20 5.5 L34 10.2 V22 C34 31.5 27.8 37.4 20 40.6 C12.2 37.4 6 31.5 6 22 V10.2 Z" fill="none" stroke="var(--brand-accent)" strokeOpacity="0.45" strokeWidth="0.8" />
          <polygon points="20,11 22.6,18.2 30.2,18.4 24.2,23 26.4,30.2 20,26 13.6,30.2 15.8,23 9.8,18.4 17.4,18.2" fill="var(--brand-accent)" />
          <path d="M11 34 L20 29.5 L29 34" fill="none" stroke="var(--brand-paper)" strokeWidth="2" strokeLinecap="square" />
        </>
      )}
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  const { domain } = useBrand();
  const [name, tld] = domain.split(".");
  return (
    <Link to="/" className="group flex items-center gap-2.5" data-testid="nav-logo-link">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-3" />
      <span className={cn("stencil text-xl font-bold leading-none", light ? "text-paper" : "text-ink")}>
        {name}<span className="text-gold">.</span>{tld}
      </span>
    </Link>
  );
}

/** "Verified Military" badge styled like a service ribbon. */
export function VerifiedRibbon({ compact = false }: { compact?: boolean }) {
  const { verified } = useBrand();
  return (
    <span
      className="inline-flex items-center overflow-hidden rounded-[3px] border border-ink/20 bg-white text-[11px] font-semibold uppercase tracking-wider text-ink shadow-sm"
      title={`Seller signed up with a ${verified} email address`}
      data-testid="verified-military-badge"
    >
      <span className="ribbon h-full w-5 self-stretch" />
      <span className="px-1.5 py-0.5">{compact ? "Verified ✓" : "Verified Military ✓"}</span>
    </span>
  );
}

/** Placeholder-posting tag: sample listings stay on the board until real ones replace them. */
export function SampleTag({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-[3px] border border-dashed border-ink/30 bg-paper px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", className)}
      title="Sample listing shown for illustration"
      data-testid="sample-badge"
    >
      Sample
    </span>
  );
}
