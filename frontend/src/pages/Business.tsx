import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, CreditCard, Inbox, MapPinned, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost, apiPut, ApiError } from "@/lib/api";
import { CAMPAIGN_STATUS_LABEL, CUSTOMER_TYPE_LABEL as TYPES, cents } from "@/lib/format";
import { useAccountProfile, useBrand, useInstallations, useMe } from "@/lib/hooks";
import type { AccountProfile, AdCampaign, AdCampaignIn, BillingQuote, CheckoutOut, CustomerType, Inquiry, Plan, Usage } from "@/lib/types";

const errorText = (error: unknown) =>
  error instanceof ApiError && typeof error.body === "object" && error.body && "detail" in error.body
    ? String((error.body as { detail: unknown }).detail) : "Please try again.";
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—");

// Checkout endpoints either hand back a Stripe URL or say plainly that payments are off.
function goToCheckout(r: CheckoutOut) {
  if (r.checkout_url) window.location.assign(r.checkout_url);
  else toast.info(r.message);
}

function AccountSetup({ profile }: { profile: AccountProfile | null }) {
  const qc = useQueryClient();
  const me = useMe();
  const [customerType, setCustomerType] = useState<CustomerType>(profile?.customer_type ?? "military_homeowner");
  const [businessName, setBusinessName] = useState(profile?.business_name ?? me.data?.name ?? "");
  const [billingEmail, setBillingEmail] = useState(profile?.billing_email ?? me.data?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const save = useMutation({
    mutationFn: () => apiPut<AccountProfile>("/accounts/me", { customer_type: customerType, business_name: businessName, billing_email: billingEmail, phone: phone || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["account-profile"] }); toast.success("Business account saved"); },
    onError: (error) => toast.error(errorText(error)),
  });
  return <section className="rounded-md border border-border bg-card p-5" data-testid="business-onboarding">
    <div className="flex items-start gap-3"><Building2 className="mt-0.5 size-5 text-ocp" /><div><h2 className="stencil text-xl">1 · Account</h2><p className="mt-1 text-sm text-muted-foreground">Your customer type sets your property pricing.</p></div></div>
    <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
      <div className="space-y-1.5"><Label>Customer type</Label><Select value={customerType} onValueChange={(value: string) => setCustomerType(value as CustomerType)}><SelectTrigger data-testid="business-customer-type"><SelectValue>{(value) => TYPES[value as CustomerType]}</SelectValue></SelectTrigger><SelectContent>{Object.entries(TYPES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="business-name">Business or account name</Label><Input id="business-name" required value={businessName} onChange={(event) => setBusinessName(event.target.value)} data-testid="business-name" /></div>
      <div className="space-y-1.5"><Label htmlFor="billing-email">Billing email</Label><Input id="billing-email" type="email" required value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} data-testid="business-billing-email" /></div>
      <div className="space-y-1.5"><Label htmlFor="business-phone">Phone (optional)</Label><Input id="business-phone" value={phone} onChange={(event) => setPhone(event.target.value)} data-testid="business-phone" /></div>
      <div className="sm:col-span-2"><Button type="submit" disabled={save.isPending} data-testid="business-save">{save.isPending ? "Saving…" : "Save account"}</Button></div>
    </form>
  </section>;
}

function PropertyPlans() {
  const [count, setCount] = useState("1");
  const n = Number(count);
  const quote = useQuery({
    queryKey: ["billing-quote", n],
    queryFn: () => apiPost<BillingQuote>("/billing/quote", { property_count: n }),
    enabled: Number.isInteger(n) && n >= 1,
  });
  const plans = useQuery({ queryKey: ["billing-plans"], queryFn: () => apiGet<Plan[]>("/billing/plans/mine") });
  const usage = useQuery({ queryKey: ["billing-usage"], queryFn: () => apiGet<Usage>("/billing/usage") });
  const buy = useMutation({
    mutationFn: () => apiPost<CheckoutOut>("/payments/plan-checkout", { property_count: n }),
    onSuccess: goToCheckout,
    onError: (error) => toast.error(errorText(error)),
  });
  const q = quote.data;
  return <section className="rounded-md border border-border bg-card p-5" data-testid="business-billing">
    <div className="flex items-start gap-3"><ReceiptText className="mt-0.5 size-5 text-ocp" /><div><h2 className="stencil text-xl">2 · Property plan</h2><p className="mt-1 text-sm text-muted-foreground">Six months are paid at checkout. The annual renewal is charged automatically when they end.</p></div></div>

    {usage.data && <p className="mt-4 rounded bg-muted p-3 text-sm" data-testid="business-usage">
      <strong>{usage.data.paid_properties}</strong> paid {usage.data.paid_properties === 1 ? "property" : "properties"} · <strong>{usage.data.housing_listings}</strong> housing {usage.data.housing_listings === 1 ? "listing" : "listings"} posted.
      {!usage.data.enforced && <span className="block text-xs text-muted-foreground">While payments are not working yet, housing can be posted without a plan.</span>}
    </p>}

    <div className="mt-5 flex max-w-md flex-wrap items-end gap-3">
      <div className="space-y-1.5"><Label htmlFor="property-count">Properties to advertise</Label><Input id="property-count" className="w-32" min="1" step="1" type="number" value={count} onChange={(event) => setCount(event.target.value)} data-testid="business-property-count" /></div>
    </div>
    {q && <div className="mt-4 rounded border border-ocp/30 bg-muted p-4 text-sm" data-testid="business-quote-result">
      {q.status === "pricing_required" ? <p>{q.message}</p> : <>
        <p>Due today for 6 months: <strong>{cents(q.initial_amount_cents)}</strong></p>
        <p>Annual renewal after that: <strong>{cents(q.annual_renewal_cents)}</strong></p>
        <Button className="mt-4 gap-2 bg-gold text-ink hover:bg-gold/90" disabled={!q.payments_enabled || buy.isPending} onClick={() => buy.mutate()} data-testid="business-buy-plan">
          <CreditCard className="size-4" /> {!q.payments_enabled ? "Payments not working yet" : buy.isPending ? "Opening checkout…" : `Pay ${cents(q.initial_amount_cents)}`}
        </Button>
      </>}
    </div>}

    {plans.data && plans.data.length > 0 && <div className="mt-6" data-testid="business-plans">
      <h3 className="stencil text-base">Your plans</h3>
      <div className="mt-2 space-y-2">{plans.data.map((p) => <div key={p.id} className="grid gap-1 rounded border border-border p-3 text-sm sm:grid-cols-4">
        <strong>{p.property_count} {p.property_count === 1 ? "property" : "properties"}</strong>
        <span className="uppercase text-muted-foreground">{p.status.replace("_", " ")}</span>
        <span>Paid through {date(p.paid_through)}</span>
        <span>{p.auto_renew ? `Renews at ${cents(p.annual_renewal_cents)}/yr` : "Will not renew"}</span>
      </div>)}</div>
    </div>}
  </section>;
}

function CampaignInquiries({ campaignId }: { campaignId: string }) {
  const q = useQuery({ queryKey: ["campaign-inquiries", campaignId], queryFn: () => apiGet<Inquiry[]>(`/campaigns/${campaignId}/inquiries`) });
  if (!q.data) return null;
  if (q.data.length === 0) return <p className="mt-2 text-xs text-muted-foreground">No inquiries yet.</p>;
  return <ul className="mt-2 space-y-2">{q.data.map((i) => <li key={i.id} className="rounded bg-muted p-2 text-xs">
    <strong>{i.name}</strong> · <a className="underline" href={`mailto:${i.email}`}>{i.email}</a>{i.phone && ` · ${i.phone}`} · {date(i.created_at)}
    <span className="block whitespace-pre-line">{i.message}</span>
  </li>)}</ul>;
}

function Advertising({ profile }: { profile: AccountProfile }) {
  const qc = useQueryClient();
  const bases = useInstallations();
  const { station } = useBrand();
  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: () => apiGet<AdCampaign[]>("/campaigns/mine") });
  const blank: AdCampaignIn = { name: "", installation_id: "", market: "", starts_on: "", ends_on: "", inquiry_email: profile.billing_email, website_url: null, notes: "" };
  const [form, setForm] = useState<AdCampaignIn>(blank);
  const [open, setOpen] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => apiPost<AdCampaign>("/campaigns", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); setForm(blank); toast.success("Request sent. We will price your market and notify you here."); },
    onError: (error) => toast.error(errorText(error)),
  });
  const pay = useMutation({
    mutationFn: (id: string) => apiPost<CheckoutOut>(`/payments/campaign-checkout/${id}`),
    onSuccess: goToCheckout,
    onError: (error) => toast.error(errorText(error)),
  });
  if (profile.customer_type !== "real_estate_company") return null;
  const change = (key: keyof AdCampaignIn, value: string) => setForm((current) => ({ ...current, [key]: value || (key === "website_url" ? null : "") }));
  return <section className="rounded-md border border-border bg-card p-5" data-testid="business-advertising">
    <div className="flex items-start gap-3"><MapPinned className="mt-0.5 size-5 text-ocp" /><div><h2 className="stencil text-xl">2 · Geographic advertising</h2><p className="mt-1 text-sm text-muted-foreground">Request a placement on a {station} board. We price the market, you pay, and the ad runs on your dates with impressions, clicks and inquiries counted.</p></div></div>
    <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
      <div className="space-y-1.5"><Label htmlFor="campaign-name">Ad headline</Label><Input id="campaign-name" required minLength={3} value={form.name} onChange={(event) => change("name", event.target.value)} data-testid="campaign-name" /></div>
      <div className="space-y-1.5"><Label>{station[0].toUpperCase() + station.slice(1)}</Label><Select value={form.installation_id} onValueChange={(value: string) => change("installation_id", value)}><SelectTrigger data-testid="campaign-installation"><SelectValue placeholder={`Choose a ${station}`} /></SelectTrigger><SelectContent>{(bases.data ?? []).map((base) => <SelectItem key={base.id} value={base.id}>{base.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="campaign-market">Target market</Label><Input id="campaign-market" required placeholder="e.g., Fayetteville / Spring Lake" value={form.market} onChange={(event) => change("market", event.target.value)} data-testid="campaign-market" /></div>
      <div className="space-y-1.5"><Label htmlFor="campaign-url">Website (optional)</Label><Input id="campaign-url" type="url" placeholder="https://" value={form.website_url ?? ""} onChange={(event) => change("website_url", event.target.value)} data-testid="campaign-url" /></div>
      <div className="space-y-1.5"><Label htmlFor="campaign-start">Start date</Label><Input id="campaign-start" type="date" required value={form.starts_on} onChange={(event) => change("starts_on", event.target.value)} data-testid="campaign-start" /></div>
      <div className="space-y-1.5"><Label htmlFor="campaign-end">End date</Label><Input id="campaign-end" type="date" required value={form.ends_on} onChange={(event) => change("ends_on", event.target.value)} data-testid="campaign-end" /></div>
      <div className="space-y-1.5"><Label htmlFor="campaign-email">Send inquiries to</Label><Input id="campaign-email" type="email" required value={form.inquiry_email} onChange={(event) => change("inquiry_email", event.target.value)} data-testid="campaign-email" /></div>
      <div className="space-y-1.5"><Label htmlFor="campaign-notes">Ad text</Label><Textarea id="campaign-notes" maxLength={2000} value={form.notes} onChange={(event) => change("notes", event.target.value)} data-testid="campaign-notes" /></div>
      <div className="sm:col-span-2"><Button type="submit" disabled={save.isPending || !form.installation_id} data-testid="business-create-campaign">{save.isPending ? "Sending…" : "Request market price"}</Button></div>
    </form>

    <div className="mt-6"><h3 className="stencil text-base">Your campaigns</h3>
      {campaigns.data?.length ? <div className="mt-3 space-y-2">{campaigns.data.map((c) => <div key={c.id} className="rounded border border-border p-3 text-sm" data-testid={`campaign-${c.id}`}>
        <div className="grid gap-1 sm:grid-cols-4">
          <strong>{c.name}</strong>
          <span>{c.market} · {c.starts_on} to {c.ends_on}</span>
          <span className="uppercase text-muted-foreground">{CAMPAIGN_STATUS_LABEL[c.status]}{c.price_cents ? ` · ${cents(c.price_cents)}` : ""}</span>
          <span>{c.impressions} impressions · {c.clicks} clicks · {c.inquiries} inquiries</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {c.status === "awaiting_payment" && <Button size="sm" className="gap-2 bg-gold text-ink hover:bg-gold/90" disabled={pay.isPending} onClick={() => pay.mutate(c.id)} data-testid={`campaign-pay-${c.id}`}><CreditCard className="size-4" /> Pay {cents(c.price_cents)}</Button>}
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(open === c.id ? null : c.id)} data-testid={`campaign-inquiries-${c.id}`}><Inbox className="size-4" /> Inquiries</Button>
        </div>
        {open === c.id && <CampaignInquiries campaignId={c.id} />}
      </div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No campaign requests yet.</p>}
    </div>
  </section>;
}

export default function Business() {
  const me = useMe();
  const { domain } = useBrand();
  const account = useAccountProfile(Boolean(me.data));
  const [sp] = useSearchParams();
  useEffect(() => {
    if (sp.get("paid") === "plan") toast.success("Payment received. Your properties are covered.");
    if (sp.get("paid") === "campaign") toast.success("Payment received. Your ad runs on its scheduled dates.");
    if (sp.get("cancelled")) toast.info("Checkout cancelled. Nothing was charged.");
  }, [sp]);
  if (me.isPending) return null;
  if (!me.data) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="stencil text-4xl">Advertise on {domain}</h1><p className="mt-3 text-muted-foreground">Create an account to list properties or buy geographic advertising.</p><Link to="/register"><Button className="mt-6">Create account</Button></Link></div>;
  const profile = account.data ?? null;
  return <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">Business center</p><h1 className="mt-1 text-4xl font-bold uppercase">List properties. Reach your market.</h1></div>
    <AccountSetup key={profile?.id ?? "new-account"} profile={profile} />
    {!profile ? <div className="rounded-md border border-border bg-muted p-5 text-sm"><CheckCircle2 className="mr-2 inline size-4 text-ocp" />Save your account to see pricing and plans.</div>
      : profile.customer_type === "real_estate_company" ? <Advertising profile={profile} /> : <PropertyPlans />}
  </div>;
}
