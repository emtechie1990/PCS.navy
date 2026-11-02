import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Car, ClipboardList, Home as HomeIcon, KeyRound, MapPin, ShieldCheck, Sofa } from "lucide-react";
import { BasePicker } from "@/components/Layout";
import { ListingCard, ListingGridSkeleton } from "@/components/ListingCard";
import { buttonVariants } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { useBrand, useInstallations, useSelectedBase } from "@/lib/hooks";
import type { ListingPage } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { t: "Choose your {station}", d: "Local sections for every town around the gate." },
  { t: "Search by report date", d: "Filter by move-in date, price, category and listing date." },
  { t: "Contact the seller directly", d: "Email, call or text — no middleman, no fees to browse." },
  { t: "Report anything shady", d: "Every report is reviewed; scams are pulled and investigated." },
];

export default function Home() {
  const brand = useBrand();
  const { baseId } = useSelectedBase();
  const navigate = useNavigate();
  const { data: bases } = useInstallations();
  const base = bases?.find((b) => b.id === baseId);
  const latest = useQuery({
    queryKey: ["listings", "home", baseId],
    queryFn: () => apiGet<ListingPage>(`/listings?installation_id=${baseId}&limit=8`),
  });
  const paths = [
    { id: "find-housing", title: "Find housing", body: "Rentals and homes for sale near the gate, with move-in dates that match your report date.", icon: HomeIcon, to: "/search?category=housing", cta: "Search housing" },
    { id: "list-housing", title: "List housing", body: "PCSing out? Rent or sell your home to the family PCSing in — military clause friendly.", icon: KeyRound, to: "/create?type=housing", cta: "List your home" },
    { id: "buy-sell", title: "Buy / sell items", body: `Trucks, cars, furniture and appliances from ${brand.members} who can't ship it — or don't want to.`, icon: Car, to: "/search?category=vehicle", cta: "Browse items" },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="camo relative overflow-hidden text-paper" data-testid="home-hero">
        <img src={brand.hero.image} alt={brand.hero.alt} className="absolute inset-0 h-full w-full object-cover opacity-40 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[55%] lg:opacity-100" />
        <div className="camo-veil absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pb-32 lg:pt-24">
          <div className="lg:col-span-7">
            <div className="animate-rise inline-flex items-center gap-2 border-l-[3px] border-gold-light bg-paper/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-light">
              PCS season ready · {bases?.length ?? "—"} {brand.stations} live
            </div>
            <h1 className="animate-rise mt-6 text-5xl font-bold uppercase leading-[0.95] tracking-wide [animation-delay:80ms] sm:text-6xl lg:text-7xl">
              {brand.headline[0]}
              <span className="block text-gold-light">{brand.headline[1]}</span>
            </h1>
            <p className="animate-rise mt-6 max-w-xl text-lg text-paper/80 [animation-delay:160ms]">{brand.lede}</p>
            <div className="animate-rise mt-8 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row sm:items-center">
              <div className="rounded-md bg-paper p-1.5 text-ink shadow-xl">
                <BasePicker className="h-11 w-full border-0 sm:w-72" testid="hero-base-picker" />
              </div>
              <button
                onClick={() => navigate(`/installation/${baseId}`)}
                className={cn(buttonVariants({ size: "lg" }), "h-14 bg-gold-light px-6 text-base font-semibold text-ink hover:bg-gold-light/90 active:scale-[0.98]")}
                data-testid="hero-go-to-base-button"
              >
                Go to {base?.short_name ?? brand.station} board <ArrowRight className="size-4" />
              </button>
            </div>
            <div className="animate-rise mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-paper/70 [animation-delay:320ms]">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-gold-light" /> Moderated listings</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck className="size-4 text-gold-light" /> {brand.verified}-verified sellers</span>
              <span className="inline-flex items-center gap-2"><ClipboardList className="size-4 text-gold-light" /> Official PCS links</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-ocp" />
      </section>

      {/* PATHWAYS */}
      <section className="relative z-10 mx-auto -mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {paths.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
              <Link
                to={p.to}
                className="ocp-strip group flex h-full flex-col rounded-md border border-border bg-card p-6 shadow-lg transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-xl"
                data-testid={`pathway-${p.id}-card`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded bg-ocp text-paper">
                    <p.icon className="size-5" />
                  </span>
                  <span className="font-heading text-sm text-muted-foreground">0{i + 1}</span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold uppercase">{p.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ocp">
                  {p.cta} <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LATEST AT BASE */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">Latest on the board</p>
            <h2 className="mt-1 text-3xl font-semibold uppercase sm:text-4xl" data-testid="home-latest-heading">
              {base ? base.name : `Your ${brand.station}`}
            </h2>
          </div>
          <Link to={`/search?installation_id=${baseId}`} className={buttonVariants({ variant: "outline" })} data-testid="home-view-all-link">
            View all listings <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.isPending && <ListingGridSkeleton count={4} />}
          {latest.data && !latest.isError && latest.data.items.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
          {(latest.isError || latest.data?.items.length === 0) && (
            <div className="col-span-full rounded-md border border-dashed border-border bg-card p-10 text-center" data-testid="home-latest-empty">
              <p className="font-heading text-xl uppercase">No listings here yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to post at this {brand.station}.</p>
              <Link to="/create" className={cn(buttonVariants(), "mt-4")} data-testid="home-empty-post-link">Post a listing</Link>
            </div>
          )}
        </div>
      </section>

      {/* INSTALLATIONS */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">{brand.stations}</p>
            <h2 className="mt-1 text-3xl font-semibold uppercase sm:text-4xl">Pick your {brand.station}</h2>
            <p className="mt-3 text-muted-foreground">
              Every {brand.station} gets its own board with local sections for the towns {brand.members} actually live in.
            </p>
            <Link to="/resources" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ocp hover:underline" data-testid="home-resources-link">
              Official PCS resources <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:col-span-8">
            {(bases ?? []).map((b) => (
              <Link
                key={b.id}
                to={`/installation/${b.id}`}
                data-active={b.id === baseId}
                className="ocp-strip flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 transition-colors duration-150 hover:bg-accent"
                data-testid={`home-base-${b.id}`}
              >
                <span>
                  <span className="block font-heading text-lg uppercase leading-tight">{b.name}</span>
                  <span className="text-xs text-muted-foreground">
                    <MapPin className="mr-1 inline size-3" />
                    {b.city}, {b.state}
                    {b.former_name && <> · formerly {b.former_name}</>}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-md border border-border bg-card lg:grid-cols-2">
          <img src={brand.side.image} alt={brand.side.alt} className="h-full min-h-[340px] w-full object-cover" loading="lazy" />
          <div className="p-8 sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">How it works</p>
            <h2 className="mt-1 text-3xl font-semibold uppercase sm:text-4xl">Built around your PCS timeline</h2>
            <ol className="mt-6 space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="font-heading min-w-7 text-2xl font-semibold text-ocp">0{i + 1}</span>
                  <span>
                    <span className="block font-semibold">{s.t.replace("{station}", brand.station)}</span>
                    <span className="text-sm text-muted-foreground">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-md border border-border bg-card md:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Moderated", d: "Every report is reviewed. Scam listings are pulled and investigated." },
            { icon: Sofa, t: "Built for PCS", d: "Move-in dates, weight-allowance sales and PCS deadlines — not generic classifieds." },
            { icon: BadgeCheck, t: "Military first", d: `Sellers who sign up with a ${brand.verified} email earn the Verified Military ribbon.` },
          ].map((x) => (
            <div key={x.t} className="border-b border-border p-6 last:border-0 md:border-b-0 md:border-r">
              <x.icon className="size-6 text-ocp" />
              <h3 className="mt-3 text-xl uppercase">{x.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
