import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Plus, ShieldAlert, ShieldCheck, User } from "lucide-react";
import { Logo } from "@/components/Brand";
import { GetAppLink, InstallBanner, MobileTabBar } from "@/components/MobileApp";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { BrandContext, useBrand, useBrandQuery, useInstallations, useMe, useSelectedBase } from "@/lib/hooks";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/search?category=housing", label: "Find housing", id: "find-housing" },
  { to: "/search?category=vehicle", label: "Vehicles", id: "vehicles" },
  { to: "/search?category=goods", label: "Household goods", id: "goods" },
  { to: "/resources", label: "PCS resources", id: "resources" },
  { to: "/safety", label: "Safety", id: "safety" },
];

export function BasePicker({ className, testid = "base-picker" }: { className?: string; testid?: string }) {
  const { station } = useBrand();
  const { data: bases } = useInstallations();
  const { baseId, setBase } = useSelectedBase();
  const navigate = useNavigate();
  const names = Object.fromEntries((bases ?? []).map((b) => [b.id, b.name]));
  return (
    <Select
      value={baseId}
      onValueChange={(v: string) => {
        setBase(v);
        navigate(`/installation/${v}`);
      }}
    >
      <SelectTrigger className={cn("min-w-[190px]", className)} data-testid={testid}>
        <SelectValue>{(v) => names[v as string] ?? `Choose ${station}`}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(bases ?? []).map((b) => (
          <SelectItem key={b.id} value={b.id} data-testid={`base-option-${b.id}`}>
            {b.name}, {b.state}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AccountMenu() {
  const { data: me, isError } = useMe();
  if (!me || isError) {
    return (
      <div className="flex items-center gap-1">
        <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })} data-testid="nav-login-link">
          Sign in
        </Link>
        <Link
          to="/register"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")}
          data-testid="nav-register-link"
        >
          Create account
        </Link>
      </div>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="gap-1.5" data-testid="account-menu-trigger" />}
      >
        <User className="size-4" />
        <span className="max-w-[110px] truncate">{me.name}</span>
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate text-xs">{me.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/my-listings" data-testid="menu-my-listings" />}>My listings</DropdownMenuItem>
        {me.role === "admin" && (
          <DropdownMenuItem render={<Link to="/admin" data-testid="menu-admin" />}>
            <ShieldCheck className="size-4" /> Admin review
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void endSession("/")} data-testid="menu-logout">
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/90 backdrop-blur-md" style={{ top: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.id}
              to={n.to}
              className="ocp-strip whitespace-nowrap px-3 py-2 text-sm font-medium text-ink/75 transition-colors duration-150 hover:text-ink"
              data-testid={`nav-${n.id}-link`}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <BasePicker className="hidden md:flex" testid="header-base-picker" />
          <Link
            to="/create"
            className={cn(buttonVariants({ size: "sm" }), "hidden gap-1 sm:inline-flex active:scale-[0.98]")}
            data-testid="nav-post-listing-button"
          >
            <Plus className="size-4" /> Post listing
          </Link>
          <AccountMenu />
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open menu" data-testid="mobile-menu-button" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-6">
              <SheetTitle className="stencil">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                <BasePicker className="mb-3 w-full" testid="mobile-base-picker" />
                {NAV.map((n) => (
                  <Link key={n.id} to={n.to} className="rounded px-2 py-2.5 text-sm font-medium hover:bg-muted" data-testid={`mobile-nav-${n.id}`}>
                    {n.label}
                  </Link>
                ))}
                <Link to="/create" className={cn(buttonVariants(), "mt-3")} data-testid="mobile-post-listing">
                  <Plus className="size-4" /> Post listing
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { disclaimer, members, station, stations, domain, siblings } = useBrand();
  return (
    <footer className="camo relative mt-24 pb-24 text-paper md:pb-0">
      <div className="absolute inset-0 bg-ink/90" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-5">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm text-paper/70">
            Housing, vehicles and household goods — listed by {members} and military families, organized by {station}.
          </p>
        </div>
        <div className="md:col-span-3">
          <h4 className="stencil text-sm text-gold">Marketplace</h4>
          <ul className="mt-3 space-y-2 text-sm text-paper/75">
            <li><Link to="/search?category=housing" className="hover:text-paper" data-testid="footer-housing-link">Find housing</Link></li>
            <li><Link to="/create?type=housing" className="hover:text-paper" data-testid="footer-list-housing-link">List housing</Link></li>
            <li><Link to="/search?category=vehicle" className="hover:text-paper" data-testid="footer-vehicles-link">Buy / sell vehicles</Link></li>
            <li><Link to="/search?category=goods" className="hover:text-paper" data-testid="footer-goods-link">Household goods</Link></li>
            <li><a href="/near" className="hover:text-paper" data-testid="footer-near-link">Browse by town and {station}</a></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <h4 className="stencil text-sm text-gold">Trust & safety</h4>
          <ul className="mt-3 space-y-2 text-sm text-paper/75">
            <li><Link to="/resources" className="hover:text-paper" data-testid="footer-resources-link">Official PCS resources</Link></li>
            <li><Link to="/safety#scams" className="hover:text-paper" data-testid="footer-scam-link">Report a scam</Link></li>
            <li><Link to="/safety#prohibited" className="hover:text-paper" data-testid="footer-prohibited-link">Prohibited listings</Link></li>
            <li><Link to="/safety#privacy" className="hover:text-paper" data-testid="footer-privacy-link">Privacy & terms</Link></li>
            <li><GetAppLink className="text-gold" /></li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 border-t border-paper/15 pt-6 text-xs text-paper/60 md:col-span-12 md:flex-row md:items-start" data-testid="footer-disclaimer">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold" />
          <p className="flex-1">{disclaimer} Always verify listings in person and never wire money or pay with gift cards. Boards for all {stations} are open — every post has its own.</p>
          <p className="shrink-0">
            Also serving:{" "}
            {siblings.map((s, i) => (
              <span key={s.domain}>
                {i > 0 && " · "}
                {s.domain === domain ? <span className="font-semibold text-paper">{s.domain}</span> : <a href={s.url} className="text-gold hover:underline">{s.domain}</a>}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { data: brand, isError } = useBrandQuery();
  if (isError) {
    return <p className="p-10 text-center text-sm text-muted-foreground">The site is starting up. Refresh in a moment.</p>;
  }
  if (!brand) return null;
  return (
    <BrandContext value={brand}>
      <div className="flex min-h-screen flex-col">
        {/* status-bar backdrop for the installed app (iOS black-translucent / notch) */}
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-ink" style={{ height: "env(safe-area-inset-top)" }} />
        <div className="bg-ink text-[11px] text-paper/75" style={{ paddingTop: "env(safe-area-inset-top)" }} data-testid="independent-service-banner">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 sm:px-6 lg:px-8">
            <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
            <span className="truncate">{brand.disclaimer}</span>
            <Link to="/safety" className="ml-auto shrink-0 text-gold hover:underline" data-testid="banner-learn-more">
              Learn more
            </Link>
          </div>
        </div>
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <MobileTabBar />
        <InstallBanner />
        <Toaster richColors mobileOffset={{ bottom: 92 }} />
      </div>
    </BrandContext>
  );
}
