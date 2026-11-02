import { ExternalLink, ShieldCheck } from "lucide-react";
import { useBrand } from "@/lib/hooks";
import type { ResourceGroup, SourceKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<SourceKind, string> = {
  official: "Official .mil / .gov",
  partner: "DoD-sponsored program",
  community: "Independent / community",
};

const KIND_STYLE: Record<SourceKind, string> = {
  official: "bg-ocp text-paper",
  partner: "bg-gold text-ink",
  community: "bg-muted text-ink border border-border",
};

const GROUPS: ResourceGroup[] = ["Plan the move", "Housing", "Money & entitlements", "Family support"];

export default function Resources() {
  const { domain, resources } = useBrand();
  return (
    <div>
      <section className="camo relative text-paper">
        <div className="camo-veil absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">PCS resources</p>
          <h1 className="mt-2 text-5xl font-bold uppercase" data-testid="resources-heading">Official links, clearly labeled</h1>
          <p className="mt-3 max-w-2xl text-paper/75">
            {domain} is a marketplace — your entitlements, shipments and on-base housing are handled by official
            programs. Every link below names its source so you always know who runs it.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs" data-testid="resources-legend">
            {(Object.keys(SOURCE_LABEL) as SourceKind[]).map((k) => (
              <span key={k} className={cn("rounded-[3px] px-2 py-1 font-semibold uppercase tracking-wider", KIND_STYLE[k])}>{SOURCE_LABEL[k]}</span>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 h-[3px] w-full bg-ocp" />
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        {GROUPS.map((g) => (
          <section key={g}>
            <h2 className="text-2xl font-semibold uppercase">{g}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {resources.filter((r) => r.group === g).map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ocp-strip group flex flex-col rounded-md border border-border bg-card p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  data-testid={`resource-${r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-sans text-lg font-semibold tracking-normal">{r.name}</h3>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className={cn("inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 font-semibold uppercase tracking-wider", KIND_STYLE[r.kind])}>
                      {r.kind === "official" && <ShieldCheck className="size-3" />}
                      {SOURCE_LABEL[r.kind]}
                    </span>
                    <span className="text-muted-foreground">Source: {r.source}</span>
                    <span className="ml-auto truncate font-mono text-[11px] text-muted-foreground">{new URL(r.url).hostname}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
        <p className="text-xs text-muted-foreground">Links open the external site in a new tab. {domain} is not responsible for third-party content.</p>
      </div>
    </div>
  );
}
