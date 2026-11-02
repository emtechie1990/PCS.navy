import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { ListingCard, ListingGridSkeleton } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet } from "@/lib/api";
import { useBrand, useInstallations, useSelectedBase } from "@/lib/hooks";
import type { ListingPage } from "@/lib/types";

const CATS: Record<string, string> = { all: "All categories", housing: "Housing", vehicle: "Vehicles", goods: "Household goods" };
const POSTED: Record<string, string> = { any: "Any time", "1": "Last 24 hours", "7": "Last 7 days", "30": "Last 30 days" };
const SORTS: Record<string, string> = { newest: "Newest first", oldest: "Oldest first", price_asc: "Price: low to high", price_desc: "Price: high to low" };

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const { station } = useBrand();
  const { baseId } = useSelectedBase();
  const { data: bases } = useInstallations();
  const installation = sp.get("installation_id") ?? baseId;
  const base = bases?.find((b) => b.id === installation);

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(sp);
    if (v === null || v === "" || v === "all" || v === "any") next.delete(k);
    else next.set(k, v);
    if (k === "installation_id") next.delete("area");
    setSp(next, { replace: true });
  };

  const query = new URLSearchParams(sp);
  query.set("installation_id", installation);
  const qs = query.toString();
  const results = useQuery({ queryKey: ["listings", "search", qs], queryFn: () => apiGet<ListingPage>(`/listings?${qs}`) });
  const baseNames = Object.fromEntries((bases ?? []).map((b) => [b.id, b.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">Search the board</p>
      <h1 className="mt-1 text-4xl font-bold uppercase" data-testid="search-heading">
        {CATS[sp.get("category") ?? "all"]} · {base?.short_name ?? "—"}
      </h1>

      <div className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 bg-card pl-9"
            placeholder="Search titles and descriptions — e.g. F-150, 3 bedroom, dresser"
            defaultValue={sp.get("q") ?? ""}
            onKeyDown={(e) => e.key === "Enter" && set("q", (e.target as HTMLInputElement).value)}
            data-testid="search-keyword-input"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <aside className="h-fit space-y-5 rounded-md border border-border bg-card p-5 lg:sticky lg:top-24 lg:col-span-3" data-testid="search-filters">
          <div className="flex items-center justify-between">
            <h2 className="stencil inline-flex items-center gap-2 text-sm"><SlidersHorizontal className="size-4" />Filters</h2>
            <button onClick={() => setSp(new URLSearchParams({ installation_id: installation }), { replace: true })} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink" data-testid="search-clear-filters">
              <X className="size-3" /> Clear
            </button>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={sp.get("category") ?? "all"} onValueChange={(v: string) => set("category", v)}>
              <SelectTrigger className="w-full" data-testid="filter-category-select"><SelectValue>{(v) => CATS[v as string]}</SelectValue></SelectTrigger>
              <SelectContent>{Object.entries(CATS).map(([k, l]) => <SelectItem key={k} value={k} data-testid={`filter-category-${k}`}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="capitalize">{station}</Label>
            <Select value={installation} onValueChange={(v: string) => set("installation_id", v)}>
              <SelectTrigger className="w-full" data-testid="filter-installation-select"><SelectValue>{(v) => baseNames[v as string] ?? "—"}</SelectValue></SelectTrigger>
              <SelectContent>{(bases ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location / area</Label>
            <Select value={sp.get("area") ?? "all"} onValueChange={(v: string) => set("area", v)}>
              <SelectTrigger className="w-full" data-testid="filter-area-select"><SelectValue>{(v) => (v === "all" ? "All areas" : (v as string))}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All areas</SelectItem>
                {(base?.areas ?? []).map((a) => <SelectItem key={a} value={a} data-testid={`filter-area-option-${a.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Price</Label>
            <div className="flex gap-2">
              <Input type="number" min={0} placeholder="Min" defaultValue={sp.get("min_price") ?? ""} onBlur={(e) => set("min_price", e.target.value)} data-testid="filter-min-price" />
              <Input type="number" min={0} placeholder="Max" defaultValue={sp.get("max_price") ?? ""} onBlur={(e) => set("max_price", e.target.value)} data-testid="filter-max-price" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="available-by">Move-in / available by</Label>
            <Input id="available-by" type="date" value={sp.get("available_by") ?? ""} onChange={(e) => set("available_by", e.target.value)} data-testid="filter-available-by" />
          </div>
          <div className="space-y-1.5">
            <Label>Listing date</Label>
            <Select value={sp.get("posted_within_days") ?? "any"} onValueChange={(v: string) => set("posted_within_days", v)}>
              <SelectTrigger className="w-full" data-testid="filter-posted-select"><SelectValue>{(v) => POSTED[v as string]}</SelectValue></SelectTrigger>
              <SelectContent>{Object.entries(POSTED).map(([k, l]) => <SelectItem key={k} value={k} data-testid={`filter-posted-${k}`}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </aside>

        <section className="lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground" data-testid="search-result-count">
              {results.data && !results.isError ? `${results.data.total} results` : results.isPending ? "Searching…" : ""}
            </span>
            <Select value={sp.get("sort") ?? "newest"} onValueChange={(v: string) => set("sort", v === "newest" ? null : v)}>
              <SelectTrigger className="w-48 bg-card" data-testid="search-sort-select"><SelectValue>{(v) => SORTS[v as string]}</SelectValue></SelectTrigger>
              <SelectContent>{Object.entries(SORTS).map(([k, l]) => <SelectItem key={k} value={k} data-testid={`sort-${k}`}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.isPending && <ListingGridSkeleton />}
            {results.data && !results.isError && results.data.items.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
            {(results.isError || results.data?.items.length === 0) && (
              <div className="col-span-full rounded-md border border-dashed border-border bg-card p-10 text-center" data-testid="search-empty">
                <p className="font-heading text-xl uppercase">No matches</p>
                <p className="mt-1 text-sm text-muted-foreground">Loosen a filter or try another {station}.</p>
                <Button variant="outline" className="mt-4" onClick={() => setSp(new URLSearchParams(), { replace: true })} data-testid="search-empty-reset">Reset search</Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
