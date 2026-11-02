import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, ExternalLink, MapPin, Plus } from "lucide-react";
import { ListingCard, ListingGridSkeleton } from "@/components/ListingCard";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet } from "@/lib/api";
import { useBrand, useSelectedBase } from "@/lib/hooks";
import type { Installation as Inst, ListingPage } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { v: "all", l: "All" },
  { v: "housing", l: "Housing" },
  { v: "vehicle", l: "Vehicles" },
  { v: "goods", l: "Household goods" },
];

export default function Installation() {
  const { id = "" } = useParams();
  const { station } = useBrand();
  const { baseId, setBase } = useSelectedBase();
  const [tab, setTab] = useState("all");
  const [area, setArea] = useState<string | null>(null);

  useEffect(() => {
    if (id && id !== baseId) setBase(id);
  }, [id, baseId, setBase]);

  const inst = useQuery({ queryKey: ["installation", id], queryFn: () => apiGet<Inst>(`/installations/${id}`) });
  const params = new URLSearchParams({ installation_id: id });
  if (tab !== "all") params.set("category", tab);
  if (area) params.set("area", area);
  const listings = useQuery({
    queryKey: ["listings", "inst", id, tab, area],
    queryFn: () => apiGet<ListingPage>(`/listings?${params.toString()}`),
  });
  const b = inst.data && !inst.isError ? inst.data : null;

  return (
    <div>
      <section className="camo relative overflow-hidden text-paper">
        {b && <img src={b.hero_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="camo-veil absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{station} board</p>
          <h1 className="mt-2 text-5xl font-bold uppercase sm:text-6xl" data-testid="installation-name">
            {b?.name ?? (inst.isError ? station : "Loading…")}
          </h1>
          {b && (
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-paper/75">
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-gold" />{b.city}, {b.state}</span>
              {b.former_name && <span>Formerly {b.former_name}</span>}
              <span className="italic">{b.tagline}</span>
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/create?base=${id}`} className={cn(buttonVariants(), "bg-gold text-ink hover:bg-gold/90")} data-testid="installation-post-button">
              <Plus className="size-4" /> Post at {b?.short_name ?? `this ${station}`}
            </Link>
            <Link to={`/search?installation_id=${id}`} className={cn(buttonVariants({ variant: "outline" }), "border-paper/30 bg-transparent text-paper hover:bg-paper/10")} data-testid="installation-search-button">
              Advanced search
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 h-[3px] w-full bg-ocp" />
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:px-8">
        <aside className="space-y-6 lg:col-span-3">
          <div className="rounded-md border border-border bg-card p-5">
            <h2 className="stencil text-sm text-coyote">Local sections</h2>
            <div className="mt-3 flex flex-col">
              <button
                onClick={() => setArea(null)}
                data-active={area === null}
                className="ocp-strip px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-muted data-[active=true]:bg-muted data-[active=true]:font-semibold"
                data-testid="area-filter-all"
              >
                All areas
              </button>
              {b?.areas.map((a) => (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  data-active={area === a}
                  className="ocp-strip px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-muted data-[active=true]:bg-muted data-[active=true]:font-semibold"
                  data-testid={`area-filter-${a.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-5">
            <h2 className="stencil text-sm text-coyote">Local resources</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li>
                <a href={b?.housing_office_url ?? "https://www.homes.mil"} target="_blank" rel="noreferrer" className="group flex items-start gap-2 hover:text-ocp" data-testid="installation-housing-office-link">
                  <Building2 className="mt-0.5 size-4 shrink-0" />
                  <span>Housing office & on-post housing <span className="block text-xs text-muted-foreground">Source: HOMES.mil (DoD)</span></span>
                  <ExternalLink className="ml-auto size-3.5 opacity-50" />
                </a>
              </li>
              <li>
                <a href="https://installations.militaryonesource.mil" target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:text-ocp" data-testid="installation-directory-link">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>{station} directory <span className="block text-xs text-muted-foreground">Source: Military OneSource (DoD)</span></span>
                  <ExternalLink className="ml-auto size-3.5 opacity-50" />
                </a>
              </li>
            </ul>
            <Link to="/resources" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ocp hover:underline" data-testid="installation-all-resources-link">
              All PCS resources <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>

        <section className="lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
              <TabsList>
                {TABS.map((t) => (
                  <TabsTrigger key={t.v} value={t.v} data-testid={`installation-tab-${t.v}`}>{t.l}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <span className="text-sm text-muted-foreground" data-testid="installation-result-count">
              {listings.data && !listings.isError ? `${listings.data.total} listings` : ""}
              {area ? ` in ${area}` : ""}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {listings.isPending && <ListingGridSkeleton />}
            {listings.data && !listings.isError && listings.data.items.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
            {(listings.isError || listings.data?.items.length === 0) && (
              <div className="col-span-full rounded-md border border-dashed border-border bg-card p-10 text-center" data-testid="installation-empty">
                <p className="font-heading text-xl uppercase">Nothing posted here yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Try another section, or be the first to post.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
