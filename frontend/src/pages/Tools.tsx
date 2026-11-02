import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Camera, CalendarDays, Calculator, ClipboardList, Download, ExternalLink, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money } from "@/lib/format";
import { useBrand } from "@/lib/hooks";
import { uid, useLocalState } from "@/lib/local-store";
import { CONUS_PER_DIEM, GRADES, MALT_PER_MILE, RATES_YEAR, TLE_DAILY_CAP, estimate, type MoveInputs } from "@/lib/pcs-rates";
import type { PhotoOut } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------- 1. Move money ---------- */
function MoveMoney() {
  const brand = useBrand();
  const [i, setI] = useLocalState<MoveInputs>("pcs.tools.money", {
    grade: "E-5", hasDependents: true, dependents12Plus: 1, dependentsUnder12: 1, miles: 1200, vehicles: 2, tleDays: 10, oconus: false,
  });
  const r = estimate(i);
  const num = (k: keyof MoveInputs) => (e: React.ChangeEvent<HTMLInputElement>) => setI({ ...i, [k]: Math.max(0, Number(e.target.value) || 0) });
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-5 rounded-md border border-border bg-card p-6 lg:col-span-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Pay grade</Label>
            <Select value={i.grade} onValueChange={(v: string) => setI({ ...i, grade: v })}>
              <SelectTrigger className="w-full" data-testid="tools-grade"><SelectValue>{(v) => String(v)}</SelectValue></SelectTrigger>
              <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Dependents travel with you?</Label>
            <Select value={i.hasDependents ? "yes" : "no"} onValueChange={(v: string) => setI({ ...i, hasDependents: v === "yes" })}>
              <SelectTrigger className="w-full" data-testid="tools-dependents"><SelectValue>{(v) => (v === "yes" ? "Yes" : "No")}</SelectValue></SelectTrigger>
              <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
            </Select>
          </div>
          {i.hasDependents && (
            <>
              <div className="space-y-1.5"><Label htmlFor="d12">Dependents 12 and over</Label><Input id="d12" type="number" min={0} value={i.dependents12Plus} onChange={num("dependents12Plus")} /></div>
              <div className="space-y-1.5"><Label htmlFor="du12">Dependents under 12</Label><Input id="du12" type="number" min={0} value={i.dependentsUnder12} onChange={num("dependentsUnder12")} /></div>
              <div className="space-y-1.5">
                <Label>Vehicles you drive</Label>
                <Select value={String(i.vehicles)} onValueChange={(v: string) => setI({ ...i, vehicles: v === "2" ? 2 : 1 })}>
                  <SelectTrigger className="w-full"><SelectValue>{(v) => `${v} vehicle${v === "2" ? "s" : ""}`}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="1">1 vehicle</SelectItem><SelectItem value="2">2 vehicles</SelectItem></SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-1.5"><Label htmlFor="miles">Official distance (miles)</Label><Input id="miles" type="number" min={0} value={i.miles} onChange={num("miles")} data-testid="tools-miles" /></div>
          <div className="space-y-1.5"><Label htmlFor="tle">Nights in temporary lodging</Label><Input id="tle" type="number" min={0} max={21} value={i.tleDays} onChange={num("tleDays")} /></div>
          <div className="space-y-1.5">
            <Label>New {brand.station} is</Label>
            <Select value={i.oconus ? "oconus" : "conus"} onValueChange={(v: string) => setI({ ...i, oconus: v === "oconus" })}>
              <SelectTrigger className="w-full"><SelectValue>{(v) => (v === "oconus" ? "Overseas (OCONUS)" : "In the U.S. (CONUS)")}</SelectValue></SelectTrigger>
              <SelectContent><SelectItem value="conus">In the U.S. (CONUS)</SelectItem><SelectItem value="oconus">Overseas (OCONUS)</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {RATES_YEAR} figures: DLA table effective 1 Jan {RATES_YEAR}; MALT {money(MALT_PER_MILE)}/mile from 1 Jul {RATES_YEAR}; standard CONUS per diem {money(CONUS_PER_DIEM)}/day;
          TLE capped at {money(TLE_DAILY_CAP)}/day. An estimate, not a payment: finance pays per the Joint Travel Regulations and your orders.
        </p>
      </div>
      <div className="lg:col-span-5">
        <div className="rounded-md border border-border bg-card p-6 shadow-sm">
          <h3 className="stencil text-sm text-coyote">Estimated move money</h3>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Dislocation allowance (DLA)", r.dla, `${i.grade}, ${i.hasDependents ? "with" : "without"} dependents`],
              ["Mileage (MALT)", r.malt, `${i.miles.toLocaleString()} mi × ${money(MALT_PER_MILE)} × ${i.hasDependents ? i.vehicles : 1} vehicle${(i.hasDependents ? i.vehicles : 1) > 1 ? "s" : ""}`],
              ["Travel per diem", r.perDiem, `${r.days} travel day${r.days === 1 ? "" : "s"} at 350 mi/day`],
              ["Temporary lodging (TLE)", r.tle, `${r.tleDays} of up to ${r.maxDays} days × ${money(r.tleDaily)}`],
            ].map(([label, amount, note]) => (
              <div key={String(label)} className="flex items-start justify-between gap-3 border-l-[3px] border-ocp/70 pl-3">
                <dt><span className="block font-medium">{label}</span><span className="text-xs text-muted-foreground">{note}</span></dt>
                <dd className="font-heading text-xl">{money(Number(amount))}</dd>
              </div>
            ))}
          </dl>
          <div className="my-5 h-px bg-border" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Estimated total</span>
            <span className="font-heading text-4xl" data-testid="tools-total">{money(r.total)}</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Selling the second car before you go? Compare: <Link to="/create?type=vehicle" className="font-semibold text-ocp underline">post it on {brand.domain}</Link> and pocket the sale instead of driving it {i.miles.toLocaleString()} miles.
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Official sources: <a className="underline" href="https://www.travel.dod.mil/Travel-Transportation-Rates/Dislocation-Allowance/" target="_blank" rel="noreferrer">DTMO DLA</a> ·{" "}
          <a className="underline" href="https://www.dfas.mil/MilitaryMembers/travelpay/armypcs/tle/" target="_blank" rel="noreferrer">DFAS TLE</a> ·{" "}
          <a className="underline" href="https://www.gsa.gov/travel/plan-book/per-diem-rates" target="_blank" rel="noreferrer">GSA per diem</a>
        </p>
      </div>
    </div>
  );
}

/* ---------- 2. Countdown + checklist ---------- */
type Task = { days: number; text: string; to?: string; href?: string };
function tasks(domain: string, station: string): Task[] {
  return [
    { days: 90, text: "Orders in hand: build your official checklist on Plan My Move", href: "https://planmymove.militaryonesource.mil" },
    { days: 90, text: "Schedule your household goods move in DPS (or set up a PPM)", href: "https://www.militarymoves.mil" },
    { days: 90, text: "Decide what ships and what sells: cars, furniture, the stuff over your weight allowance" },
    { days: 75, text: `List your home or give notice on your lease — the family coming in is looking on ${domain}`, to: "/create?type=housing" },
    { days: 60, text: `Post the vehicle you won't drive and the furniture you won't ship on ${domain}`, to: "/create?type=vehicle" },
    { days: 60, text: "Start the room-by-room photo inventory (Inventory tab) — your proof if anything is lost or damaged", to: "/tools?tab=inventory" },
    { days: 60, text: `Look for housing near the new ${station}`, to: "/search?category=housing" },
    { days: 45, text: "Book temporary lodging at both ends (TLE covers up to 21 nights)", to: "/tools?tab=money" },
    { days: 30, text: "Address changes: USPS, DEERS, banks, insurance, subscriptions" },
    { days: 30, text: "Pull school, medical, dental and vet records; refill prescriptions" },
    { days: 21, text: "Confirm pack and pickup dates with the transportation office" },
    { days: 14, text: "Stop/start utilities; sort vehicle registration and pet paperwork" },
    { days: 7, text: "Pack the 'first night' box: documents, chargers, meds, bedding, kid and pet essentials" },
    { days: 3, text: "Empty the freezer, return borrowed gear, final walkthrough photos of the old place" },
    { days: 0, text: "Moving day: check the inventory sheet against every box; keep orders and receipts with you" },
    { days: -5, text: "File the travel voucher (DD 1351-2) within 5 days of arrival" },
    { days: -30, text: "Report any loss or damage in DPS within 180 days; your photo inventory is the proof", to: "/tools?tab=inventory" },
    { days: -30, text: `Settled? Post what you don't need in the new place on ${domain}`, to: "/create" },
  ];
}

function Countdown() {
  const brand = useBrand();
  const [report, setReport] = useLocalState<string>("pcs.tools.report", "");
  const [done, setDone] = useLocalState<Record<string, boolean>>("pcs.tools.done", {});
  const list = useMemo(() => tasks(brand.domain, brand.station), [brand.domain, brand.station]);
  const reportDate = report ? new Date(report + "T12:00:00") : null;
  const daysLeft = reportDate ? Math.ceil((reportDate.getTime() - Date.now()) / 86_400_000) : null;
  const due = (t: Task) => (reportDate ? new Date(reportDate.getTime() - t.days * 86_400_000) : null);
  const key = (t: Task) => `${report}|${t.days}|${t.text.slice(0, 24)}`;
  const finished = list.filter((t) => done[key(t)]).length;
  const ics = () => {
    if (!reportDate) return;
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").slice(0, 8);
    const events = [{ d: reportDate, s: `Report to new ${brand.station}` }, ...[90, 60, 30, 14, 7].map((n) => ({ d: new Date(reportDate.getTime() - n * 86_400_000), s: `PCS: ${n} days out — check your ${brand.domain} list` }))];
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${brand.domain}//PCS toolkit//EN`,
      ...events.flatMap((e) => ["BEGIN:VEVENT", `UID:${uid()}@${brand.domain.toLowerCase()}`, `DTSTART;VALUE=DATE:${stamp(e.d)}`, `SUMMARY:${e.s}`, "END:VEVENT"]), "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "pcs-dates.ics" });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-4">
        <div className="rounded-md border border-border bg-card p-6">
          <Label htmlFor="report">Report date</Label>
          <Input id="report" type="date" className="mt-1.5" value={report} onChange={(e) => setReport(e.target.value)} data-testid="tools-report-date" />
          {daysLeft !== null && (
            <div className="camo mt-5 rounded-md p-5 text-center text-paper">
              <div className="font-heading text-6xl font-bold leading-none">{Math.abs(daysLeft)}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-gold">{daysLeft >= 0 ? "days to report" : "days since reporting"}</div>
            </div>
          )}
          {reportDate && (
            <>
              <p className="mt-4 text-sm text-muted-foreground">{finished} of {list.length} done. Saved on this device.</p>
              <Button variant="outline" className="mt-3 w-full gap-2" onClick={ics} data-testid="tools-ics"><CalendarDays className="size-4" /> Add key dates to my calendar</Button>
            </>
          )}
        </div>
      </div>
      <div className="lg:col-span-8">
        {!reportDate ? (
          <div className="rounded-md border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Enter your report date to get a dated, checkable timeline from 90 days out through your first month on station.</div>
        ) : (
          <ol className="space-y-2">
            {list.map((t) => {
              const d = due(t)!;
              const late = d.getTime() < Date.now() && !done[key(t)];
              return (
                <li key={key(t)} className={cn("ocp-strip flex items-start gap-3 rounded-md border border-border bg-card px-4 py-3", done[key(t)] && "opacity-60")} data-testid="tools-task">
                  <Checkbox checked={!!done[key(t)]} onCheckedChange={(v) => setDone({ ...done, [key(t)]: !!v })} className="mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div className={cn(done[key(t)] && "line-through")}>{t.text}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span className={cn(late && "font-semibold text-destructive")}>{t.days > 0 ? `${t.days} days out` : t.days === 0 ? "Report date" : `${-t.days} days after`} · {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      {t.to && <Link to={t.to} className="font-semibold text-ocp">Open →</Link>}
                      {t.href && <a href={t.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-ocp">Official site <ExternalLink className="size-3" /></a>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

/* ---------- 3. Photo inventory ---------- */
type Item = { id: string; room: string; name: string; qty: number; value: number; condition: string; photo: string | null };
const ROOMS = ["Living room", "Kitchen", "Dining", "Bedroom 1", "Bedroom 2", "Bedroom 3", "Office", "Garage", "Storage", "Outdoor"];

function Inventory() {
  const brand = useBrand();
  const [items, setItems] = useLocalState<Item[]>("pcs.tools.inventory", []);
  const [room, setRoom] = useState(ROOMS[0]);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const total = items.reduce((s, x) => s + x.qty * x.value, 0);
  const add = () => {
    if (!name.trim()) return;
    setItems([{ id: uid(), room, name: name.trim(), qty: 1, value: Number(value) || 0, condition: "Good", photo: null }, ...items]);
    setName(""); setValue("");
  };
  const patch = (id: string, p: Partial<Item>) => setItems(items.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const addPhoto = async (id: string, file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/photos?purpose=inventory", { method: "POST", body });
      if (!res.ok) { toast.error("Photo upload failed"); return; }
      patch(id, { photo: ((await res.json()) as PhotoOut).url });
    } finally {
      setUploading(false);
    }
  };
  const csv = () => {
    const rows = [["Room", "Item", "Qty", "Value each", "Condition", "Photo"], ...items.map((x) => [x.room, x.name, x.qty, x.value, x.condition, x.photo ? window.location.origin + x.photo : ""])];
    const text = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type: "text/csv" })), download: "pcs-inventory.csv" });
    a.click();
  };
  return (
    <div>
      <div className="grid gap-3 rounded-md border border-border bg-card p-5 sm:grid-cols-[1fr_2fr_1fr_auto]">
        <Select value={room} onValueChange={(v: string) => setRoom(v)}>
          <SelectTrigger data-testid="tools-inv-room"><SelectValue>{(v) => String(v)}</SelectValue></SelectTrigger>
          <SelectContent>{ROOMS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Item, e.g. 65in TV, Samsung" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} data-testid="tools-inv-name" />
        <Input type="number" min={0} placeholder="Value $" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button onClick={add} data-testid="tools-inv-add">Add</Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{items.length} items · declared value <strong className="text-ink">{money(total)}</strong> · saved on this device</span>
        <span className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={csv} disabled={!items.length}><Download className="size-4" /> CSV</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()} disabled={!items.length}><Printer className="size-4" /> Print</Button>
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Walk each room, add what matters, snap a photo of serial numbers and condition. If the movers lose or break it, this is what your claim needs.</p>
      ) : (
        ROOMS.filter((r) => items.some((x) => x.room === r)).map((r) => (
          <section key={r} className="mt-6">
            <h3 className="stencil text-sm text-coyote">{r}</h3>
            <ul className="mt-2 divide-y divide-border rounded-md border border-border bg-card">
              {items.filter((x) => x.room === r).map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 p-3 text-sm" data-testid="tools-inv-item">
                  <label className="flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed border-border bg-muted">
                    {x.photo ? <img src={x.photo} alt="" className="size-full object-cover" /> : <Camera className="size-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={uploading} onChange={(e) => void addPhoto(x.id, e.target.files?.[0])} />
                  </label>
                  <span className="min-w-[8rem] flex-1 font-medium">{x.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">Qty <Input type="number" min={1} className="h-8 w-16" value={x.qty} onChange={(e) => patch(x.id, { qty: Math.max(1, Number(e.target.value) || 1) })} /></span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">$ <Input type="number" min={0} className="h-8 w-24" value={x.value} onChange={(e) => patch(x.id, { value: Number(e.target.value) || 0 })} /></span>
                  <Select value={x.condition} onValueChange={(v: string) => patch(x.id, { condition: v })}>
                    <SelectTrigger className="h-8 w-28"><SelectValue>{(v) => String(v)}</SelectValue></SelectTrigger>
                    <SelectContent>{["New", "Like new", "Good", "Fair", "Worn"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" aria-label="Remove item" onClick={() => setItems(items.filter((y) => y.id !== x.id))}><Trash2 className="size-4" /></Button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <p className="mt-6 text-xs text-muted-foreground">Photos are stored on {brand.domain}; the list itself stays on this device. Export the CSV before you wipe the phone.</p>
    </div>
  );
}

const TABS = [
  { v: "money", label: "Move money", icon: Calculator },
  { v: "countdown", label: "Countdown & checklist", icon: ClipboardList },
  { v: "inventory", label: "Photo inventory", icon: Camera },
];

export default function Tools() {
  const brand = useBrand();
  const [sp, setSp] = useSearchParams();
  const tab = TABS.some((t) => t.v === sp.get("tab")) ? sp.get("tab")! : "money";
  return (
    <div>
      <section className="camo relative text-paper">
        <div className="camo-veil absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">PCS toolkit</p>
          <h1 className="mt-2 text-5xl font-bold uppercase" data-testid="tools-heading">Your move, in numbers and on a timeline</h1>
          <p className="mt-3 max-w-2xl text-paper/75">
            What the move pays, what to do when, and proof for the claim if the movers break something — on your phone, no account, nothing sent anywhere.
            Built around the marketplace: sell what you won't ship, find the next place.
          </p>
        </div>
        <div className="absolute bottom-0 h-[3px] w-full bg-ocp" />
      </section>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={(v) => setSp({ tab: String(v) }, { replace: true })}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="gap-1.5" data-testid={`tools-tab-${t.v}`}><t.icon className="size-4" /> {t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="mt-8">
          {tab === "money" && <MoveMoney />}
          {tab === "countdown" && <Countdown />}
          {tab === "inventory" && <Inventory />}
        </div>
        <p className="mt-10 text-xs text-muted-foreground">
          {brand.domain} is independent and not affiliated with the U.S. {brand.branch} or DoD. Official programs: <Link to="/resources" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-xs")}>PCS resources</Link>.
        </p>
      </div>
    </div>
  );
}
