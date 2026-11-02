import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CalendarClock, CalendarDays, Clock, Eye, ImageOff, Mail, MapPin, MessageSquare, Phone, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SampleTag, VerifiedRibbon } from "@/components/Brand";
import { ReportDialog } from "@/components/ReportDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, apiDelete, apiGet } from "@/lib/api";
import { CATEGORY_BADGE, CATEGORY_LABEL, ago, contactHref, dateLabel, priceLabel } from "@/lib/format";
import { useInstallations, useMe } from "@/lib/hooks";
import type { Listing, MessageOut } from "@/lib/types";
import { cn } from "@/lib/utils";

const DETAIL_LABELS: Record<string, string> = {
  listing_type: "Type", beds: "Bedrooms", baths: "Bathrooms", sqft: "Sq ft", pets: "Pets", lease_term: "Lease term",
  military_clause: "Military clause", year: "Year", make: "Make", model: "Model", mileage: "Mileage",
  transmission: "Transmission", title_status: "Title", drivetrain: "Drivetrain", vin: "VIN",
  item_type: "Item type", condition: "Condition", pcs_deadline: "Must go by", pickup_only: "Pickup only", dimensions: "Dimensions",
};

function fmtDetail(k: string, v: string | number | boolean | null): string {
  if (v === null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (k === "listing_type") return v === "rent" ? "For rent" : "For sale";
  if (k === "mileage" && typeof v === "number") return `${v.toLocaleString()} mi`;
  if (k === "pcs_deadline" && typeof v === "string") return dateLabel(v);
  return String(v);
}

const CONTACT_ICON = { email: Mail, phone: Phone, text: MessageSquare };

export default function ListingDetail() {
  const { id = "" } = useParams();
  const [sp] = useSearchParams();
  useEffect(() => {
    if (sp.get("spotlight")) toast.success("Spotlight is on. Your listing is pinned to the top of the board.");
  }, [sp]);
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: bases } = useInstallations(true);
  const [photo, setPhoto] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = useQuery({ queryKey: ["listing", id], queryFn: () => apiGet<Listing>(`/listings/${id}`), retry: false });
  const del = useMutation({
    mutationFn: () => apiDelete<MessageOut>(`/listings/${id}`),
    onSuccess: () => {
      toast.success("Listing removed");
      qc.invalidateQueries({ queryKey: ["listings"] });
      window.history.back();
    },
  });

  if (q.isPending) {
    return <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="aspect-[16/9] animate-pulse rounded-md bg-muted" /></div>;
  }
  if (q.isError || !q.data) {
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center" data-testid="listing-not-found">
        <h1 className="text-3xl font-bold uppercase">{notFound ? "Listing not found" : "Listing unavailable"}</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed by the seller or a moderator.</p>
        <Link to="/search" className={cn(buttonVariants(), "mt-6")} data-testid="listing-back-to-search">Back to search</Link>
      </div>
    );
  }
  const l = q.data;
  const base = bases?.find((b) => b.id === l.installation_id);
  const isOwner = !!me && me.id === l.owner_id;
  const canDelete = isOwner || me?.role === "admin";
  const Icon = CONTACT_ICON[l.contact_method];
  const details = Object.entries(l.details).filter(([, v]) => v !== null && v !== "");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to={`/installation/${l.installation_id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink" data-testid="listing-back-link">
        <ArrowLeft className="size-4" /> {base?.name ?? "Back"}
      </Link>

      {l.status !== "approved" && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-gold/60 bg-accent px-4 py-3 text-sm" data-testid="listing-status-notice">
          <AlertTriangle className="size-4 text-coyote" /> This listing is <strong className="uppercase">{l.status}</strong> and not publicly visible.
        </div>
      )}

      {l.sample && (
        <p className="mt-4 rounded-md border border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground" data-testid="listing-sample-notice">
          Sample listing — a placeholder shown for illustration until real postings replace it. Not a real offer.
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-border bg-muted" data-testid="listing-gallery">
            {l.photos.length ? (
              <img src={l.photos[photo]} alt={l.title} className="h-full w-full object-cover" data-testid="listing-main-photo" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"><ImageOff className="size-10" />No photos provided</div>
            )}
            {l.featured && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-[3px] bg-gold px-2 py-1 text-xs font-bold uppercase tracking-wider text-ink">
                <Star className="size-3 fill-ink" /> Spotlight
              </span>
            )}
          </div>
          {l.photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {l.photos.map((p, i) => (
                <button
                  key={p + i}
                  onClick={() => setPhoto(i)}
                  className={cn("h-20 w-28 shrink-0 overflow-hidden rounded border-2 transition-[border-color] duration-150", i === photo ? "border-ocp" : "border-transparent opacity-70 hover:opacity-100")}
                  data-testid={`listing-thumb-${i}`}
                >
                  <img src={p} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-[3px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", CATEGORY_BADGE[l.category])}>{CATEGORY_LABEL[l.category]}</span>
              {l.seller_verified && <VerifiedRibbon />}
              {l.sample && <SampleTag />}
            </div>
            <h1 className="mt-3 text-3xl font-bold uppercase leading-tight sm:text-4xl" data-testid="listing-title">{l.title}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5" data-testid="listing-location"><MapPin className="size-4" />{l.area} · {base?.name ?? l.installation_id}</span>
              <span className="inline-flex items-center gap-1.5" data-testid="listing-posted"><Clock className="size-4" />Posted {ago(l.created_at)}</span>
              <span className="inline-flex items-center gap-1.5" data-testid="listing-updated"><CalendarClock className="size-4" />Updated {dateLabel(l.updated_at.slice(0, 10))}</span>
            </div>
          </div>

          <div className="mt-8 rounded-md border border-border bg-card p-6">
            <h2 className="stencil text-sm text-coyote">Description</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed" data-testid="listing-description">{l.description}</p>
          </div>

          {details.length > 0 && (
            <div className="mt-6 rounded-md border border-border bg-card p-6">
              <h2 className="stencil text-sm text-coyote">Specs</h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {details.map(([k, v]) => (
                  <div key={k} className="border-l-[3px] border-ocp/70 pl-3">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{DETAIL_LABELS[k] ?? k}</dt>
                    <dd className="mt-0.5 font-medium" data-testid={`listing-detail-${k}`}>{fmtDetail(k, v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-md border border-border bg-card p-6 shadow-sm">
              <div className="font-heading text-4xl font-semibold" data-testid="listing-price">{priceLabel(l)}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                {l.category === "housing" ? "Move-in" : "Available"}: <span className="font-medium text-ink" data-testid="listing-available-date">{dateLabel(l.available_date)}</span>
              </div>
              <div className="my-5 h-px bg-border" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Seller</p>
              <p className="mt-1 font-semibold" data-testid="listing-seller-name">{l.contact_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">Prefers contact by <strong className="text-ink">{l.contact_method}</strong></p>
              {revealed ? (
                <a href={contactHref(l.contact_method, l.contact_value)} className={cn(buttonVariants({ size: "lg" }), "mt-4 h-12 w-full gap-2")} data-testid="listing-contact-link">
                  <Icon className="size-4" /> {l.contact_value}
                </a>
              ) : (
                <Button size="lg" className="mt-4 h-12 w-full gap-2 active:scale-[0.98]" onClick={() => setRevealed(true)} data-testid="listing-reveal-contact-button">
                  <Eye className="size-4" /> Show contact
                </Button>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Meet in a public place or on post. Never wire money, pay deposits sight-unseen, or use gift cards.</p>
            </div>
            <ReportDialog listingId={l.id} />
            {isOwner && !l.featured && (
              <Link to={`/upgrade/${l.id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2 border-gold text-coyote")} data-testid="listing-upgrade-link">
                <Star className="size-4" /> Spotlight this listing
              </Link>
            )}
            {canDelete && (
              <Button variant="ghost" className="w-full gap-2 text-destructive" onClick={() => confirm("Remove this listing permanently?") && del.mutate()} data-testid="listing-delete-button">
                <Trash2 className="size-4" /> Remove listing
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
