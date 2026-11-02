import { Link } from "react-router-dom";
import { useBrand } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** Shared unit-patch mark for all three sites: black shield, gold star with the arrow inside. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 46" className={cn("h-9 w-8", className)} aria-hidden="true">
      <path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill="#1A1A1A" stroke="#C8A951" strokeWidth="2" />
      <polygon points="20,10 22.8,17.6 30.8,17.8 24.4,22.7 26.7,30.4 20,25.8 13.3,30.4 15.6,22.7 9.2,17.8 17.2,17.6" fill="#C8A951" />
      <path d="M15 26.5 L20 20.5 L25 26.5" fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" />
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
