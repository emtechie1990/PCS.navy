import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BookOpen, Download, Home, Plus, Search, Share, SquarePlus, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBrand, useMe } from "@/lib/hooks";
import { useInstallPrompt } from "@/lib/pwa";
import { cn } from "@/lib/utils";

/** App-style bottom tab bar for phones (hidden from md up, where the header nav takes over). */
export function MobileTabBar() {
  const { data: me } = useMe();
  const { pathname } = useLocation();
  const tabs = [
    { to: "/", label: "Home", icon: Home, id: "home", match: (p: string) => p === "/" || p.startsWith("/installation") },
    { to: "/search", label: "Search", icon: Search, id: "search", match: (p: string) => p.startsWith("/search") || p.startsWith("/listing") },
    { to: "/resources", label: "Resources", icon: BookOpen, id: "resources", match: (p: string) => p.startsWith("/resources") || p.startsWith("/safety") },
    { to: me ? (me.role === "admin" ? "/admin" : "/my-listings") : "/login", label: me ? "Account" : "Sign in", icon: User, id: "account", match: (p: string) => ["/login", "/register", "/my-listings", "/admin"].some((x) => p.startsWith(x)) },
  ];
  const item = (t: (typeof tabs)[number]) => (
    <NavLink
      key={t.id}
      to={t.to}
      data-active={t.match(pathname)}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-paper/60 transition-colors duration-150 data-[active=true]:text-gold"
      data-testid={`tabbar-${t.id}`}
    >
      <t.icon className="size-5" />
      {t.label}
    </NavLink>
  );
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-paper/10 bg-ink/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      data-testid="mobile-tab-bar"
    >
      <div className="relative mx-auto flex max-w-lg items-stretch px-2">
        {tabs.slice(0, 2).map(item)}
        <div className="flex flex-1 items-start justify-center">
          <Link
            to="/create"
            className="-mt-5 flex size-14 items-center justify-center rounded-full border-4 border-ink bg-gold text-ink shadow-lg transition-transform duration-150 active:scale-95"
            aria-label="Post a listing"
            data-testid="tabbar-post"
          >
            <Plus className="size-6" />
          </Link>
        </div>
        {tabs.slice(2).map(item)}
      </div>
    </nav>
  );
}

const DISMISS_KEY = "pcs.install.dismissed";

/** "Install the app" card — native prompt on Android/Chrome, step-by-step sheet on iPhone/iPad. */
export function InstallBanner() {
  const { domain, slug } = useBrand();
  const { canPrompt, install, standalone, ios } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1");
  const [iosHelp, setIosHelp] = useState(false);
  if (standalone || dismissed || (!canPrompt && !ios)) return null;
  const close = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };
  return (
    <>
      <div
        className="fixed inset-x-3 z-50 flex items-center gap-3 rounded-lg border border-paper/10 bg-ink p-3 text-paper shadow-2xl md:inset-x-auto md:right-6 md:!bottom-6 md:w-96"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)" }}
        data-testid="install-banner"
      >
        <img src={`/brand/${slug}/icons/icon-96.png`} alt="" className="size-11 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base uppercase leading-tight">Get the {domain} app</p>
          <p className="text-xs text-paper/65">Full-screen, on your home screen. Free.</p>
        </div>
        <Button
          size="sm"
          className="bg-gold text-ink hover:bg-gold/90"
          onClick={() => (canPrompt ? void install() : setIosHelp(true))}
          data-testid="install-banner-button"
        >
          <Download className="size-4" /> Install
        </Button>
        <button onClick={close} className="p-1 text-paper/50 hover:text-paper" aria-label="Dismiss" data-testid="install-banner-dismiss">
          <X className="size-4" />
        </button>
      </div>
      <IosInstallDialog open={iosHelp} onOpenChange={setIosHelp} />
    </>
  );
}

export function IosInstallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { domain } = useBrand();
  const steps = [
    { icon: Share, t: "Tap the Share button", d: "In Safari's toolbar (bottom on iPhone, top on iPad)." },
    { icon: SquarePlus, t: "Choose “Add to Home Screen”", d: "Scroll the share sheet if you don't see it." },
    { icon: Plus, t: "Tap “Add”", d: `${domain} opens full-screen like any other app.` },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-testid="ios-install-dialog">
        <DialogHeader>
          <DialogTitle className="stencil">Install on iPhone / iPad</DialogTitle>
          <DialogDescription>Three taps and {domain} lives on your home screen.</DialogDescription>
        </DialogHeader>
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={s.t} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded bg-ocp text-paper"><s.icon className="size-4" /></span>
              <span>
                <span className="block text-sm font-semibold">{i + 1}. {s.t}</span>
                <span className="text-xs text-muted-foreground">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

/** Footer / menu link that works on every platform. */
export function GetAppLink({ className }: { className?: string }) {
  const { domain } = useBrand();
  const { canPrompt, install, standalone, ios } = useInstallPrompt();
  const [iosHelp, setIosHelp] = useState(false);
  const [info, setInfo] = useState(false);
  if (standalone) return null;
  return (
    <>
      <button
        onClick={() => (canPrompt ? void install() : ios ? setIosHelp(true) : setInfo(true))}
        className={cn("inline-flex items-center gap-1.5 hover:text-paper", className)}
        data-testid="get-app-link"
      >
        <Download className="size-3.5" /> Get the app
      </button>
      <IosInstallDialog open={iosHelp} onOpenChange={setIosHelp} />
      <Dialog open={info} onOpenChange={setInfo}>
        <DialogContent className="sm:max-w-sm" data-testid="install-info-dialog">
          <DialogHeader>
            <DialogTitle className="stencil">Install {domain}</DialogTitle>
            <DialogDescription>
              On Android or desktop Chrome/Edge, open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.
              On iPhone/iPad, use Safari → Share → “Add to Home Screen”.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
