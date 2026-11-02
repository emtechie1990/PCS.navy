import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, CreditCard, Lock, Star } from "lucide-react";
import { toast } from "sonner";
import { SiPaypal, SiStripe } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import { money2 as money } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { CheckoutOut, Listing, PaymentConfig, ProviderId } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROVIDER_ICON: Record<ProviderId, typeof SiStripe> = {
  stripe: SiStripe,
  paypal: SiPaypal,
};

export default function Upgrade() {
  const { id = "" } = useParams();
  const [sp] = useSearchParams();
  useEffect(() => {
    if (sp.get("cancelled")) toast.info("Checkout cancelled. Nothing was charged.");
  }, [sp]);
  const listing = useQuery({ queryKey: ["listing", id], queryFn: () => apiGet<Listing>(`/listings/${id}`) });
  const cfg = useQuery({ queryKey: ["payments-config"], queryFn: () => apiGet<PaymentConfig>("/payments/config") });
  const { data: me } = useMe();
  const [plan, setPlan] = useState("boost-14");
  const [provider, setProvider] = useState<ProviderId>("stripe");
  const checkout = useMutation({
    mutationFn: () => apiPost<CheckoutOut>("/payments/checkout", { listing_id: id, plan_id: plan, provider }),
    onSuccess: (r) => {
      if (r.checkout_url) window.location.assign(r.checkout_url);
      else toast.info(r.message);
    },
    onError: () => toast.error("Checkout unavailable"),
  });
  const selected = cfg.data?.plans.find((p) => p.id === plan);
  const isOwner = Boolean(me && listing.data?.owner_id && me.id === listing.data.owner_id);
  const checkoutReady = Boolean(cfg.data?.live && selected && isOwner && !checkout.isPending);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">Spotlight</p>
      <h1 className="mt-1 text-4xl font-bold uppercase" data-testid="upgrade-heading">Move to the top of the board</h1>
      {listing.data && <p className="mt-2 text-muted-foreground">For: <Link to={`/listing/${id}`} className="font-semibold text-ink underline">{listing.data.title}</Link></p>}

      {cfg.data && !cfg.data.live && (
        <div className="mt-6 rounded-md border border-gold/70 bg-accent p-4 text-sm" data-testid="upgrade-not-live-notice">
          <strong className="uppercase">Not working yet:</strong> payment checkout is disabled while the site completes provider testing.
          No charge can be made.
        </div>
      )}
      {cfg.data?.live && !me && (
        <div className="mt-6 rounded-md border border-gold/70 bg-accent p-4 text-sm">
          <strong className="uppercase">Sign in required:</strong> only the account owner can purchase Spotlight.
          <Link to="/login" className="ml-1 font-semibold underline">Sign in</Link>
        </div>
      )}
      {cfg.data?.live && me && listing.data && !isOwner && (
        <div className="mt-6 rounded-md border border-gold/70 bg-accent p-4 text-sm" data-testid="upgrade-owner-only-notice">
          <strong className="uppercase">Owner only:</strong> only the account that created this listing can purchase Spotlight.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <h2 className="stencil text-sm text-coyote">1 · Choose a plan</h2>
          {cfg.data?.plans.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              data-active={p.id === plan}
              className="ocp-strip flex w-full items-center justify-between rounded-md border border-border bg-card p-5 text-left transition-[border-color,box-shadow] duration-150 data-[active=true]:border-ocp data-[active=true]:shadow-md"
              data-testid={`upgrade-plan-${p.id}`}
            >
              <span className="flex items-center gap-3">
                <span className={cn("flex size-6 items-center justify-center rounded-full border", p.id === plan ? "border-ocp bg-ocp text-paper" : "border-border")}>
                  {p.id === plan && <Check className="size-3.5" />}
                </span>
                <span>
                  <span className="block font-heading text-lg uppercase">{p.label}</span>
                  <span className="text-xs text-muted-foreground">Pinned with a gold Spotlight tag for {p.days} days</span>
                </span>
              </span>
              <span className="font-heading text-2xl">{money(p.amount)}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-md border border-border bg-card p-6 shadow-sm">
            <h2 className="stencil text-sm text-coyote">2 · Pay with</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {cfg.data?.providers.map((pr) => {
                const Icon = PROVIDER_ICON[pr.id];
                return (
                  <button
                    key={pr.id}
                    onClick={() => setProvider(pr.id)}
                    data-active={pr.id === provider}
                    className="flex flex-col items-center gap-1.5 rounded-md border border-border p-3 text-xs font-medium transition-[border-color,background-color] duration-150 hover:bg-muted data-[active=true]:border-ocp data-[active=true]:bg-accent"
                    disabled={!pr.enabled || checkout.isPending}
                    data-testid={`upgrade-provider-${pr.id}`}
                  >
                    <Icon size={28} />
                    {pr.label}
                    {!pr.enabled && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Not live</span>}
                  </button>
                );
              })}
            </div>
            <div className="my-5 h-px bg-border" />
            <div className="flex items-center justify-between text-sm">
              <span>{selected?.label ?? "—"}</span>
              <span className="font-heading text-2xl" data-testid="upgrade-total">{selected ? money(selected.amount) : "—"}</span>
            </div>
            <Button className="mt-5 h-12 w-full gap-2 bg-gold text-ink hover:bg-gold/90 active:scale-[0.98]" disabled={!checkoutReady} onClick={() => checkout.mutate()} data-testid="upgrade-checkout-button">
              {provider === "stripe" ? <CreditCard className="size-4" /> : <Star className="size-4" />}
              {checkout.isPending ? "Processing…" : !cfg.data?.live ? "Payments not working yet" : !me ? "Sign in to continue" : !isOwner ? "Listing owner only" : `Pay ${selected ? money(selected.amount) : ""}`}
            </Button>
            {checkout.data && (
              <p className="mt-3 rounded bg-muted p-3 text-xs" data-testid="upgrade-checkout-result">{checkout.data.message}</p>
            )}
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" /> Payments processed securely by the selected provider.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
