import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, EyeOff, Flag, MapPinned, Megaphone, ReceiptText, Rocket, Search, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { CAMPAIGN_STATUS_LABEL, CATEGORY_LABEL, CUSTOMER_TYPE_LABEL, ago, cents, priceLabel } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { AdCampaign, AdminAccount, AdminStats, CampaignStatus, Plan, Installation, Listing, ListingStatus, MessageOut, Report, ReportStatus, SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ListingStatus, string> = {
  approved: "bg-ocp text-paper",
  pending: "bg-gold text-ink",
  investigating: "bg-coyote text-paper",
  hidden: "bg-ink text-paper",
};

const FILTERS: Record<string, string> = { all: "All", pending: "Pending", reported: "Reported", investigating: "Investigating", hidden: "Hidden", approved: "Approved" };

function ListingsDesk() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const qs = filter === "reported" ? "?reported=true" : filter === "all" ? "" : `?status=${filter}`;
  const q = useQuery({ queryKey: ["admin", "listings", filter], queryFn: () => apiGet<Listing[]>(`/admin/listings${qs}`) });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["listings"] });
  };
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) => apiPatch<Listing>(`/admin/listings/${id}`, { status }),
    onSuccess: (l) => { toast.success(`Listing marked ${l.status}`); refresh(); },
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete<MessageOut>(`/listings/${id}`),
    onSuccess: () => { toast.success("Listing deleted"); refresh(); },
  });
  const promote = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => apiPatch<Listing>(`/admin/listings/${id}/promote`, { promote: on }),
    onSuccess: (l) => { toast.success(l.promote ? "Added to the marketing feed" : "Removed from the marketing feed"); refresh(); },
    onError: () => toast.error("Only approved, real listings with a photo can be promoted"),
  });

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(FILTERS).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("rounded-[3px] border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-150", filter === k ? "border-ocp bg-ocp text-paper" : "border-border bg-card hover:bg-muted")} data-testid={`admin-filter-${k}`}>
            {l}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Promoted listings appear in the marketing catalog feed <a className="font-mono underline" href="/api/feeds/catalog.csv" target="_blank" rel="noreferrer">/api/feeds/catalog.csv</a>. Add that URL as a scheduled data feed in Meta Commerce Manager or TikTok Catalog to advertise them there.
      </p>
      <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground" data-testid="admin-listings-empty">Queue clear.</TableCell></TableRow>
            )}
            {q.data?.map((l) => (
              <TableRow key={l.id} data-testid={`admin-listing-row-${l.id}`}>
                <TableCell className="max-w-[320px]">
                  <Link to={`/listing/${l.id}`} className="block truncate font-medium hover:underline">{l.title}</Link>
                  <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[l.category]} · {priceLabel(l)} · {ago(l.created_at)} · {l.owner_id ? "account" : "guest"}</span>
                </TableCell>
                <TableCell className="text-xs">{l.installation_id}<br /><span className="text-muted-foreground">{l.area}</span></TableCell>
                <TableCell><span className={cn("rounded-[3px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", STATUS_STYLE[l.status])} data-testid="admin-listing-status">{l.status}</span></TableCell>
                <TableCell>{l.report_count > 0 ? <Badge variant="destructive">{l.report_count}</Badge> : <span className="text-muted-foreground">0</span>}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button size="icon-sm" variant="outline" title="Approve" aria-label="Approve" disabled={l.status === "approved"} onClick={() => setStatus.mutate({ id: l.id, status: "approved" })} data-testid={`admin-approve-${l.id}`}><CheckCircle2 className="size-4 text-ocp" /></Button>
                    <Button size="icon-sm" variant="outline" title="Investigate" aria-label="Investigate" disabled={l.status === "investigating"} onClick={() => setStatus.mutate({ id: l.id, status: "investigating" })} data-testid={`admin-investigate-${l.id}`}><Search className="size-4 text-coyote" /></Button>
                    <Button size="icon-sm" variant="outline" title="Hide" aria-label="Hide" disabled={l.status === "hidden"} onClick={() => setStatus.mutate({ id: l.id, status: "hidden" })} data-testid={`admin-hide-${l.id}`}><EyeOff className="size-4" /></Button>
                    {!l.sample && <Button size="icon-sm" variant={l.promote ? "default" : "outline"} title={l.promote ? "Remove from marketing feed" : "Promote in marketing feed"} aria-label="Promote" onClick={() => promote.mutate({ id: l.id, on: !l.promote })} data-testid={`admin-promote-${l.id}`}><Megaphone className="size-4" /></Button>}
                    <Button size="icon-sm" variant="outline" title="Delete" aria-label="Delete" onClick={() => confirm("Delete permanently?") && del.mutate(l.id)} data-testid={`admin-delete-${l.id}`}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const REPORT_STATUS: Record<ReportStatus, string> = { open: "Open", investigating: "Investigating", resolved: "Resolved", dismissed: "Dismissed" };

function ReportsDesk() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "reports"], queryFn: () => apiGet<Report[]>("/admin/reports") });
  const upd = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) => apiPatch<Report>(`/admin/reports/${id}`, { status }),
    onSuccess: () => { toast.success("Report updated"); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow><TableHead>Listing</TableHead><TableHead>Reason</TableHead><TableHead>Details</TableHead><TableHead>Filed</TableHead><TableHead>Status</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {q.data?.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground" data-testid="admin-reports-empty">No reports.</TableCell></TableRow>}
          {q.data?.map((r) => (
            <TableRow key={r.id} data-testid={`admin-report-row-${r.id}`}>
              <TableCell className="max-w-[220px]"><Link to={`/listing/${r.listing_id}`} className="block truncate font-medium hover:underline">{r.listing_title || r.listing_id}</Link></TableCell>
              <TableCell><Badge variant={r.reason === "scam" ? "destructive" : "secondary"} className="uppercase">{r.reason}</Badge></TableCell>
              <TableCell className="max-w-[280px] whitespace-normal text-xs text-muted-foreground">{r.details || "—"}{r.reporter_email && <span className="block">From: {r.reporter_email}</span>}</TableCell>
              <TableCell className="text-xs">{ago(r.created_at)}</TableCell>
              <TableCell>
                <Select value={r.status} onValueChange={(v: string) => upd.mutate({ id: r.id, status: v as ReportStatus })}>
                  <SelectTrigger size="sm" className="w-36" data-testid={`admin-report-status-${r.id}`}><SelectValue>{(v) => REPORT_STATUS[v as ReportStatus]}</SelectValue></SelectTrigger>
                  <SelectContent>{(Object.keys(REPORT_STATUS) as ReportStatus[]).map((s) => <SelectItem key={s} value={s} data-testid={`admin-report-status-option-${s}`}>{REPORT_STATUS[s]}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LaunchDesk() {
  const qc = useQueryClient();
  const bases = useQuery({ queryKey: ["installations", true], queryFn: () => apiGet<Installation[]>("/installations?include_unlaunched=true") });
  const site = useQuery({ queryKey: ["site"], queryFn: () => apiGet<SiteSettings>("/site") });
  const toggle = useMutation({
    mutationFn: ({ id, launched }: { id: string; launched: boolean }) => apiPatch<Installation>(`/admin/installations/${id}`, { launched }),
    onSuccess: (b) => { toast.success(`${b.name} ${b.launched ? "launched" : "taken offline"}`); qc.invalidateQueries({ queryKey: ["installations"] }); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });
  const save = useMutation({
    mutationFn: (s: SiteSettings) => apiPut<SiteSettings>("/admin/settings", s),
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["site"] }); qc.invalidateQueries({ queryKey: ["installations"] }); },
  });
  const names = Object.fromEntries((bases.data ?? []).map((b) => [b.id, b.name]));
  const s = site.data;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-md border border-border bg-card p-5 lg:col-span-1">
        <h3 className="stencil inline-flex items-center gap-2 text-sm text-coyote"><Settings2 className="size-4" /> Site settings</h3>
        {s && (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Launch base (default for new visitors)</p>
              <Select value={s.default_installation_id} onValueChange={(v: string) => save.mutate({ ...s, default_installation_id: v })}>
                <SelectTrigger className="w-full" data-testid="admin-default-base-select"><SelectValue>{(v) => names[v as string] ?? v}</SelectValue></SelectTrigger>
                <SelectContent>{(bases.data ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={s.require_approval} onCheckedChange={(c) => save.mutate({ ...s, require_approval: Boolean(c) })} data-testid="admin-require-approval-checkbox" />
              <span><strong>Require approval</strong> — new listings stay pending until a moderator approves them.</span>
            </label>
          </>
        )}
      </div>
      <div className="rounded-md border border-border bg-card p-5 lg:col-span-2">
        <h3 className="stencil inline-flex items-center gap-2 text-sm text-coyote"><Rocket className="size-4" /> Installation launch control</h3>
        <p className="mt-1 text-xs text-muted-foreground">Only launched installations appear in pickers and search. Experiment with one base or open them all.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {bases.data?.map((b) => (
            <label key={b.id} data-active={b.launched} className="ocp-strip flex cursor-pointer items-center justify-between rounded border border-border px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted">
              <span><span className="font-medium">{b.name}</span> <span className="text-xs text-muted-foreground">{b.state}</span></span>
              <Checkbox checked={b.launched} onCheckedChange={(c) => toggle.mutate({ id: b.id, launched: Boolean(c) })} data-testid={`admin-launch-${b.id}`} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—");

function AccountsDesk() {
  const q = useQuery({ queryKey: ["admin", "accounts"], queryFn: () => apiGet<AdminAccount[]>("/admin/accounts") });
  return <div className="overflow-x-auto rounded-md border border-border bg-card" data-testid="admin-accounts">
    <Table><TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Type</TableHead><TableHead>Housing listings</TableHead><TableHead>Paid properties</TableHead><TableHead>Plan</TableHead></TableRow></TableHeader>
      <TableBody>
        {q.data?.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No business accounts yet.</TableCell></TableRow>}
        {q.data?.map((a) => <TableRow key={a.id}>
          <TableCell><strong>{a.business_name}</strong><span className="block text-xs text-muted-foreground">{a.email} · billing {a.billing_email}{a.phone ? ` · ${a.phone}` : ""}</span></TableCell>
          <TableCell className="text-xs">{CUSTOMER_TYPE_LABEL[a.customer_type]}</TableCell>
          <TableCell>{a.housing_listings}</TableCell>
          <TableCell>{a.paid_properties}</TableCell>
          <TableCell className="text-xs uppercase">{a.plan_status?.replace("_", " ") ?? "none"}</TableCell>
        </TableRow>)}
      </TableBody></Table>
  </div>;
}

function BillingDesk() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "plans"], queryFn: () => apiGet<Plan[]>("/admin/billing/plans") });
  const stop = useMutation({
    mutationFn: (id: string) => apiPost<Plan>(`/admin/billing/plans/${id}/stop-renewal`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "plans"] }); toast.success("Auto-renewal stopped. Paid coverage continues to its end date."); },
    onError: () => toast.error("Stripe did not accept the change. Try again."),
  });
  const soon = Date.now() + 30 * 86_400_000;
  return <div className="overflow-x-auto rounded-md border border-border bg-card" data-testid="admin-billing">
    <Table><TableHeader><TableRow><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Paid through</TableHead><TableHead>Renewal</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
      <TableBody>
        {q.data?.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No paid plans yet.</TableCell></TableRow>}
        {q.data?.map((p) => {
          const due = p.paid_through && new Date(p.paid_through).getTime() < soon;
          return <TableRow key={p.id}>
            <TableCell><strong>{p.property_count} × {CUSTOMER_TYPE_LABEL[p.customer_type]}</strong><span className="block text-xs text-muted-foreground">First 6 months {cents(p.initial_amount_cents)}</span></TableCell>
            <TableCell className="text-xs uppercase">{p.status.replace("_", " ")}</TableCell>
            <TableCell className={cn("text-xs", due && "font-semibold text-destructive")}>{shortDate(p.paid_through)}{due && " · due within 30 days"}</TableCell>
            <TableCell className="text-xs">{p.auto_renew ? `${cents(p.annual_renewal_cents)}/yr, automatic` : "Off"}</TableCell>
            <TableCell className="text-right">{p.auto_renew && <Button size="sm" variant="outline" disabled={stop.isPending} onClick={() => confirm("Stop automatic renewal for this plan?") && stop.mutate(p.id)}>Stop renewal</Button>}</TableCell>
          </TableRow>;
        })}
      </TableBody></Table>
  </div>;
}

function CampaignRow({ campaign: c }: { campaign: AdCampaign }) {
  const qc = useQueryClient();
  const [price, setPrice] = useState(c.price_cents ? String(c.price_cents / 100) : "");
  const update = useMutation({
    mutationFn: (body: { status?: CampaignStatus; price_cents?: number }) => apiPatch<AdCampaign>(`/admin/campaigns/${c.id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "campaigns"] }); toast.success("Campaign updated"); },
    onError: () => toast.error("Update failed"),
  });
  const dollars = Number(price);
  return <TableRow>
    <TableCell><strong>{c.name}</strong><span className="block text-xs text-muted-foreground">{c.installation_id} · {c.market}</span><span className="block text-xs text-muted-foreground">{c.inquiry_email}</span></TableCell>
    <TableCell className="text-xs">{c.starts_on} to {c.ends_on}</TableCell>
    <TableCell>
      <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); update.mutate({ price_cents: Math.round(dollars * 100) }); }}>
        <Input className="h-8 w-24" type="number" min="1" step="0.01" placeholder="$" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Market price in dollars" />
        <Button size="sm" variant="outline" type="submit" disabled={!(dollars >= 1) || update.isPending}>Set price</Button>
      </form>
      {c.paid_at && <span className="mt-1 block text-xs text-ocp">Paid {shortDate(c.paid_at)}</span>}
    </TableCell>
    <TableCell className="text-xs">{c.impressions} impressions<br />{c.clicks} clicks<br />{c.inquiries} inquiries</TableCell>
    <TableCell>
      <Select value={c.status} onValueChange={(v: string) => update.mutate({ status: v as CampaignStatus })}>
        <SelectTrigger size="sm" className="w-40"><SelectValue>{(v) => CAMPAIGN_STATUS_LABEL[v as CampaignStatus]}</SelectValue></SelectTrigger>
        <SelectContent>{Object.entries(CAMPAIGN_STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </TableCell>
  </TableRow>;
}

function CampaignDesk() {
  const campaigns = useQuery({ queryKey: ["admin", "campaigns"], queryFn: () => apiGet<AdCampaign[]>("/admin/campaigns") });
  return <div className="rounded-md border border-border bg-card p-5" data-testid="admin-campaigns">
    <h3 className="stencil inline-flex items-center gap-2 text-sm text-coyote"><MapPinned className="size-4" /> Geographic advertising</h3>
    <p className="mt-1 text-xs text-muted-foreground">Setting a price moves a request to Awaiting payment; the advertiser pays from their Business center and the ad runs on its dates. Impressions, clicks and inquiries are counted by the site and cannot be edited.</p>
    <div className="mt-4 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Dates</TableHead><TableHead>Market price</TableHead><TableHead>Performance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
      <TableBody>
        {campaigns.data?.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No advertising requests.</TableCell></TableRow>}
        {campaigns.data?.map((c) => <CampaignRow key={c.id} campaign={c} />)}
      </TableBody></Table></div>
  </div>;
}

export default function Admin() {
  const { data: me, isPending, isError } = useMe();
  const isAdmin = me?.role === "admin" && !isError;
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => apiGet<AdminStats>("/admin/stats"), enabled: isAdmin });

  if (!isPending && !isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center" data-testid="admin-denied">
        <h1 className="text-3xl font-bold uppercase">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">Sign in with an administrator account.</p>
        <Link to="/login" className={cn(buttonVariants(), "mt-6")} data-testid="admin-login-link">Sign in</Link>
      </div>
    );
  }
  const st = stats.data;
  const tiles = [
    { k: "Listings", v: st?.total_listings, id: "total" },
    { k: "Pending", v: st?.pending, id: "pending" },
    { k: "Investigating", v: st?.investigating, id: "investigating" },
    { k: "Hidden", v: st?.hidden, id: "hidden" },
    { k: "Open reports", v: st?.open_reports, id: "reports" },
    { k: "Users", v: st?.users, id: "users" },
    { k: "Bases live", v: st?.launched_installations, id: "bases" },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">Command desk</p>
      <h1 className="mt-1 text-4xl font-bold uppercase" data-testid="admin-heading">Admin review</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map((t) => (
          <div key={t.id} className="rounded-md border border-border bg-card p-4 border-l-[3px] border-l-ocp">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.k}</div>
            <div className="mt-1 font-heading text-3xl" data-testid={`admin-stat-${t.id}`}>{t.v ?? "—"}</div>
          </div>
        ))}
      </div>
      <Tabs defaultValue="listings" className="mt-8">
        <TabsList>
          <TabsTrigger value="listings" data-testid="admin-tab-listings">Listings</TabsTrigger>
          <TabsTrigger value="reports" data-testid="admin-tab-reports"><Flag className="size-3.5" /> Reports</TabsTrigger>
          <TabsTrigger value="accounts" data-testid="admin-tab-accounts"><Building2 className="size-3.5" /> Accounts</TabsTrigger>
          <TabsTrigger value="billing" data-testid="admin-tab-billing"><ReceiptText className="size-3.5" /> Billing</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="admin-tab-campaigns"><MapPinned className="size-3.5" /> Advertising</TabsTrigger>
          <TabsTrigger value="launch" data-testid="admin-tab-launch"><Rocket className="size-3.5" /> Bases & settings</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-4"><ListingsDesk /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsDesk /></TabsContent>
        <TabsContent value="accounts" className="mt-4"><AccountsDesk /></TabsContent>
        <TabsContent value="billing" className="mt-4"><BillingDesk /></TabsContent>
        <TabsContent value="campaigns" className="mt-4"><CampaignDesk /></TabsContent>
        <TabsContent value="launch" className="mt-4"><LaunchDesk /></TabsContent>
      </Tabs>
    </div>
  );
}
