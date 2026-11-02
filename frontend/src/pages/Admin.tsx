import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, EyeOff, Flag, Rocket, Search, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiDelete, apiGet, apiPatch, apiPut } from "@/lib/api";
import { CATEGORY_LABEL, ago, priceLabel } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { AdminStats, Installation, Listing, ListingStatus, MessageOut, Report, ReportStatus, SiteSettings } from "@/lib/types";
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

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(FILTERS).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("rounded-[3px] border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-150", filter === k ? "border-ocp bg-ocp text-paper" : "border-border bg-card hover:bg-muted")} data-testid={`admin-filter-${k}`}>
            {l}
          </button>
        ))}
      </div>
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
          <TabsTrigger value="launch" data-testid="admin-tab-launch"><Rocket className="size-3.5" /> Bases & settings</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-4"><ListingsDesk /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsDesk /></TabsContent>
        <TabsContent value="launch" className="mt-4"><LaunchDesk /></TabsContent>
      </Tabs>
    </div>
  );
}
