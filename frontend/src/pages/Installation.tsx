import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, ExternalLink, Mail, MapPin, Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";
import { ListingCard, ListingGridSkeleton } from "@/components/ListingCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost } from "@/lib/api";
import { useBrand, useSelectedBase } from "@/lib/hooks";
import type { Ad, InquiryIn, Installation as Inst, ListingPage } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { v: "all", l: "All" },
  { v: "housing", l: "Housing" },
  { v: "vehicle", l: "Vehicles" },
  { v: "goods", l: "Household goods" },
];

// Paid geographic ads for this installation. Fetched once per board visit: each fetch is one impression.
function InquiryDialog({ ad }: { ad: Ad }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InquiryIn>({ name: "", email: "", phone: null, message: "" });
  const send = useMutation({
    mutationFn: () => apiPost<{ emailed: boolean; message: string }>(`/ads/${ad.id}/inquiries`, form),
    onSuccess: (r) => { toast.success(r.message); setOpen(false); setForm({ name: "", email: "", phone: null, message: "" }); },
    onError: () => toast.error("Could not send. Try again."),
  });
  const set = (k: keyof InquiryIn, v: string) => setForm((f) => ({ ...f, [k]: k === "phone" ? v || null : v }));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" data-testid={`ad-contact-${ad.id}`} />}><Mail className="size-3.5" /> Contact</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="stencil">Contact {ad.business_name}</DialogTitle>
          <DialogDescription>Your message goes straight to the advertiser.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
          <div className="space-y-1.5"><Label htmlFor="inq-name">Name</Label><Input id="inq-name" required value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="inq-email">Email</Label><Input id="inq-email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="inq-phone">Phone (optional)</Label><Input id="inq-phone" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="inq-msg">Message</Label><Textarea id="inq-msg" required minLength={5} value={form.message} onChange={(e) => set("message", e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={send.isPending} data-testid="ad-inquiry-send">{send.isPending ? "Sending…" : "Send"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdSlot({ installationId }: { installationId: string }) {
  const ads = useQuery({
    queryKey: ["ads", installationId],
    queryFn: () => apiGet<Ad[]>(`/ads?installation_id=${encodeURIComponent(installationId)}`),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  if (!ads.data?.length) return null;
  return (
    <div className="mb-6 space-y-3" data-testid="installation-ads">
      {ads.data.map((ad) => (
        <div key={ad.id} className="rounded-md border border-gold/60 bg-accent p-4" data-testid={`ad-${ad.id}`}>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-coyote"><Megaphone className="size-3" /> Sponsored · {ad.business_name}</p>
          <h3 className="mt-1 font-heading text-lg uppercase">{ad.name}</h3>
          <p className="text-xs text-muted-foreground">{ad.market}</p>
          {ad.notes && <p className="mt-2 whitespace-pre-line text-sm">{ad.notes}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <InquiryDialog ad={ad} />
            {ad.website_url && (
              // a real link so the browser never blocks it; the beacon records the click without delaying it
              <a href={ad.website_url} target="_blank" rel="noopener noreferrer" onClick={() => navigator.sendBeacon(`/api/ads/${ad.id}/click`)} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")} data-testid={`ad-visit-${ad.id}`}>
                <ExternalLink className="size-3.5" /> Visit website
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

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
          {id && <AdSlot installationId={id} />}
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
