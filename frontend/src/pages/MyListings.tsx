import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { CATEGORY_LABEL, ago, priceLabel } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function MyListings() {
  const { data: me, isError, isPending } = useMe();
  const q = useQuery({ queryKey: ["listings", "mine"], queryFn: () => apiGet<Listing[]>("/listings/mine"), enabled: !!me });

  if (!isPending && (isError || !me)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold uppercase">Sign in to see your listings</h1>
        <Link to="/login" className={cn(buttonVariants(), "mt-6")} data-testid="my-listings-login-link">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">Your board</p>
          <h1 className="mt-1 text-4xl font-bold uppercase" data-testid="my-listings-heading">My listings</h1>
        </div>
        <Link to="/create" className={buttonVariants()} data-testid="my-listings-new-button"><Plus className="size-4" /> New listing</Link>
      </div>
      <div className="mt-8 divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
        {q.data?.length === 0 && <p className="p-8 text-center text-muted-foreground" data-testid="my-listings-empty">You haven't posted anything yet.</p>}
        {q.data?.map((l) => (
          <div key={l.id} className="ocp-strip flex flex-wrap items-center gap-4 p-4" data-testid={`my-listing-row-${l.id}`}>
            <img src={l.photos[0] ?? ""} alt="" className="h-16 w-20 rounded bg-muted object-cover" />
            <div className="min-w-0 flex-1">
              <Link to={`/listing/${l.id}`} className="font-semibold hover:underline">{l.title}</Link>
              <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[l.category]} · {l.area} · {ago(l.created_at)}</p>
            </div>
            <span className="font-heading text-lg">{priceLabel(l)}</span>
            <Badge variant={l.status === "approved" ? "default" : "secondary"} className="uppercase" data-testid="my-listing-status">{l.status}</Badge>
            {l.featured ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-coyote"><Star className="size-3.5 fill-gold text-gold" /> Spotlight</span>
            ) : (
              <Link to={`/upgrade/${l.id}`} className={buttonVariants({ variant: "outline", size: "sm" })} data-testid={`my-listing-upgrade-${l.id}`}>Spotlight</Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
