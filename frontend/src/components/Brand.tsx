import { Link } from "react-router-dom";
import { useBrand } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** Shared unit-patch mark for all three sites: near-black shield, gold edge and star. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 46" className={cn("h-9 w-8", className)} aria-hidden="true">
      <path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill="#1A1A1A" stroke="#C8A951" strokeWidth="2" />
      <path d="M20 5.5 L34 10.2 V22 C34 31.5 27.8 37.4 20 40.6 C12.2 37.4 6 31.5 6 22 V10.2 Z" fill="none" stroke="#C8A951" strokeOpacity="0.45" strokeWidth="0.8" />
      <polygon points="20,11 22.6,18.2 30.2,18.4 24.2,23 26.4,30.2 20,26 13.6,30.2 15.8,23 9.8,18.4 17.4,18.2" fill="#C8A951" />
      <path d="M11 34 L20 29.5 L29 34" fill="none" stroke="#F5F4F0" strokeWidth="2" strokeLinecap="square" />
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
