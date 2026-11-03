import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { LogoMark } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrand, useInstallations, useSelectedBase } from "@/lib/hooks";
import { RATES_YEAR } from "@/lib/pcs-rates";
import { cn } from "@/lib/utils";

/** Site guide: answers from the site's own knowledge, runs entirely in the browser (no outside service).
    Each intent is matched on keywords; every answer links straight to the right page. */

type Msg = { from: "bot" | "you"; body: ReactNode; chips?: string[] };

const A = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="font-semibold text-ocp underline underline-offset-2">{children}</Link>
);

export function HelpBot() {
  const brand = useBrand();
  const { data: bases } = useInstallations();
  const { baseId } = useSelectedBase();
  const navigate = useNavigate();
  const base = bases?.find((b) => b.id === baseId);
  const short = base?.short_name ?? `your ${brand.station}`;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const end = useRef<HTMLDivElement>(null);

  const START: string[] = ["Find housing", "Sell something", "Move money", "Countdown", "Is this a scam?"];

  const answer = (q: string): Msg => {
    const s = q.toLowerCase();
    const has = (...w: string[]) => w.some((x) => s.includes(x));
    if (has("scam", "fraud", "fake", "wire", "gift card", "deposit", "report", "suspicious"))
      return { from: "bot", body: <>Never wire money, pay a deposit sight-unseen, or use gift cards. Every listing has a <strong>Report this listing</strong> button; reports go to our moderators and suspicious posts are hidden while we look. Red flags and what to do are on the <A to="/safety#scams">Safety page</A>.</>, chips: ["Find housing", "Get verified"] };
    if (has("verif", ".mil", "ribbon", "badge", "trust"))
      return { from: "bot", body: <>Sellers who <A to="/register">create an account</A> with a <strong>{brand.verified}</strong> email get the Verified Military ribbon on every listing. It shows buyers the seller is a service member. Guests can still post without an account.</>, chips: ["Sell something", "Is this a scam?"] };
    if (has("photo", "picture", "image", "upload", "camera"))
      return { from: "bot", body: <>On the <A to="/create">Post listing</A> form, tap <strong>Add photos</strong> under Photos — it opens your camera roll or files. Up to 10 photos, JPEG/PNG/WebP, 8 MB each. They upload straight to {brand.domain}.</>, chips: ["Sell something"] };
    if (has("spotlight", "featured", "boost", "top of", "pay", "price", "cost", "fee", "free"))
      return { from: "bot", body: <>Browsing and posting are free. <strong>Spotlight</strong> pins a listing to the top of its board for 7, 14 or 30 days ($4.99–$12.99). Payment checkout is <strong>not working yet</strong> while the payment-account owner completes provider testing; no charge can be made until then.</>, chips: ["Sell something", "Find housing"] };
    if (has("hous", "rent", "home", "apartment", "lease", "bah", "buy a house", "for sale"))
      return { from: "bot", body: <>Housing near {short}: <A to={`/search?installation_id=${baseId}&category=housing`}>browse rentals and homes for sale</A>. Filter by move-in date, price and town. PCSing out? <A to="/create?type=housing">List your home</A> for the family coming in.</>, chips: ["Choose my " + brand.station, "Vehicles", "Get verified"] };
    if (has("car", "truck", "vehicle", "suv", "motorcycle", "rv", "ship my"))
      return { from: "bot", body: <><A to={`/search?installation_id=${baseId}&category=vehicle`}>Vehicles at {short}</A> — cars, trucks, SUVs, motorcycles and RVs from families who can't ship them. Selling before OCONUS? <A to="/create?type=vehicle">Post your vehicle</A> in two minutes.</>, chips: ["Household goods", "Sell something"] };
    if (has("furniture", "couch", "sofa", "appliance", "washer", "household", "goods", "stuff", "weight"))
      return { from: "bot", body: <>Over the weight allowance? <A to={`/search?installation_id=${baseId}&category=goods`}>Household goods at {short}</A> — furniture, appliances, kids' gear, tools. <A to="/create?type=goods">Post yours</A> with a PCS deadline so buyers know it must go.</>, chips: ["Sell something", "Find housing"] };
    if (has("sell", "post", "list", "create", "advert"))
      return { from: "bot", body: <>Tap <A to="/create">Post listing</A>, pick Housing, Vehicle or Household goods, add photos and a contact method. No account needed; <A to="/register">sign up</A> to edit or remove it later and to earn the Verified ribbon.</>, chips: ["Add photos", "Get verified", "Spotlight"] };
    if (has("base", "installation", "duty station", "station", "post", "where", "choose", "change", "switch", "towns", "area"))
      return { from: "bot", body: <>Use the picker at the top of any page, or open the <A to={`/installation/${baseId}`}>{base?.name ?? "board"}</A>. {bases?.length ?? ""} {brand.stations} have boards, each with local sections for the towns around the gate{base ? ` — at ${short}: ${base.areas.filter((a) => !a.startsWith("On ")).slice(0, 4).join(", ")}` : ""}.</>, chips: ["Find housing", "Vehicles"] };
    if (has("account", "log", "sign", "password", "reset", "forgot", "register"))
      return { from: "bot", body: <><A to="/login">Sign in</A> or <A to="/register">create an account</A>. Forgot your password? <A to="/forgot-password">Request a reset link</A> — it arrives by email and expires in an hour. Your listings live under <A to="/my-listings">My listings</A>.</>, chips: ["Get verified"] };
    if (has("calculat", "dla", "malt", "tle", "per diem", "entitle", "allowance", "how much", "money", "mileage", "reimburs"))
      return { from: "bot", body: <>The <A to="/tools?tab=money">Move money estimator</A> adds up DLA for your grade, mileage (MALT), travel per diem and temporary lodging (TLE) with the {RATES_YEAR} rates. It runs on your phone; nothing is sent anywhere.</>, chips: ["Countdown", "Inventory"] };
    if (has("countdown", "checklist", "timeline", "report date", "days left", "when should"))
      return { from: "bot", body: <>Enter your report date in the <A to="/tools?tab=countdown">Countdown & checklist</A> and you get a dated to-do list from 90 days out to your first month on station, with checkboxes and an add-to-calendar button.</>, chips: ["Move money", "Inventory"] };
    if (has("inventory", "claim", "damage", "lost", "broke", "movers", "serial"))
      return { from: "bot", body: <>Use the <A to="/tools?tab=inventory">Photo inventory</A>: room by room, with a photo per item, declared values and a CSV export. It's the proof a DPS loss or damage claim needs.</>, chips: ["Countdown", "Move money"] };
    if (has("resource", "orders", "move", "pcs", "dps", "shipment", "official"))
      return { from: "bot", body: <>{brand.domain} is a marketplace — orders, entitlements and shipments run through official programs. Our <A to="/resources">PCS resources</A> page lists Plan My Move, DPS, HOMES.mil, BAH lookup and {brand.branch} relocation links, each labeled with its source.</>, chips: ["Find housing", "Choose my " + brand.station] };
    if (has("app", "install", "phone", "home screen"))
      return { from: "bot", body: <>{brand.domain} installs like an app: on Android/desktop Chrome use the browser menu → <em>Install app</em>; on iPhone use Safari → Share → <em>Add to Home Screen</em>. Same listings, full screen.</>, chips: ["Find housing"] };
    if (has("contact", "seller", "message", "call", "text", "email"))
      return { from: "bot", body: <>Open any listing and tap <strong>Show contact</strong> — sellers choose email, call or text. Meet in a public place or on {brand.station === "installation" ? "post" : "base"}; there's no middleman and no fee.</>, chips: ["Is this a scam?"] };
    if (has("hi", "hello", "hey", "help", "what is", "about"))
      return { from: "bot", body: <>{brand.domain} is an independent marketplace for {brand.branch} PCS moves: housing, vehicles and household goods, organized by {brand.station}. What do you need?</>, chips: START };
    return { from: "bot", body: <>I can help with finding or posting housing, vehicles and household goods, choosing your {brand.station}, verification, photos, Spotlight, scams and official PCS links. Try one of these:</>, chips: START };
  };

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { from: "you", body: q }, answer(q)]);
    setText("");
  };

  useEffect(() => {
    if (open && msgs.length === 0) setMsgs([{ from: "bot", body: <>Hi, I'm Private, your {brand.domain} guide. Ask me anything about the site, or pick one:</>, chips: START }]);
  }, [open]); // oxlint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Private, the site guide" : "Ask Private, the site guide"}
        className="fixed right-4 z-50 flex size-14 items-center justify-center rounded-full bg-ocp text-paper shadow-xl transition-transform duration-150 hover:scale-105 active:scale-95 md:right-6"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
        data-testid="helpbot-toggle"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
      {open && (
        <div
          className="fixed right-4 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl md:right-6"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 152px)" }}
          data-testid="helpbot-panel"
        >
          <div className="flex items-center gap-2 bg-ink px-4 py-3 text-paper">
            <LogoMark className="h-7 w-6" />
            <span className="stencil text-sm">Private</span>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-paper/60">No data leaves this site</span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.from === "you" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[88%] rounded-md px-3 py-2 leading-relaxed", m.from === "you" ? "bg-ocp text-paper" : "bg-muted")}>
                  {m.body}
                  {m.chips && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.chips.map((c) => (
                        <button key={c} onClick={() => ask(c)} className="rounded-full border border-ocp/40 bg-card px-2.5 py-1 text-xs font-medium text-ocp hover:bg-accent" data-testid="helpbot-chip">
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2 border-t border-border p-3">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask Private about the site..." aria-label="Ask Private" data-testid="helpbot-input" />
            <Button type="submit" size="icon" aria-label="Send" data-testid="helpbot-send"><Send className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Post a listing" onClick={() => { setOpen(false); navigate("/create"); }}>+</Button>
          </form>
        </div>
      )}
    </>
  );
}
