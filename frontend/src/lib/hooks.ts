import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { apiGet } from "./api";
import type { Brand, Installation, SiteSettings, UserPublic } from "./types";

// Layout fetches the brand once and renders the app only after it arrives, so every page
// below it can read a loaded Brand synchronously.
export const BrandContext = createContext<Brand | null>(null);

export function useBrandQuery() {
  return useQuery({ queryKey: ["brand"], queryFn: () => apiGet<Brand>("/brand"), staleTime: Infinity });
}

export function useBrand(): Brand {
  const brand = useContext(BrandContext);
  if (!brand) throw new Error("useBrand() called outside <BrandContext>");
  return brand;
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<UserPublic | null>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
}

export function useInstallations(includeUnlaunched = false) {
  return useQuery({
    queryKey: ["installations", includeUnlaunched],
    queryFn: () =>
      apiGet<Installation[]>(`/installations${includeUnlaunched ? "?include_unlaunched=true" : ""}`),
    staleTime: 60_000,
  });
}

export function useSite() {
  return useQuery({ queryKey: ["site"], queryFn: () => apiGet<SiteSettings>("/site"), staleTime: 60_000 });
}

// Selected duty station persisted in localStorage, falls back to the site's launch base.
const KEY = "pcs.base";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const read = () => (typeof window === "undefined" ? null : window.localStorage.getItem(KEY));

export function useSelectedBase() {
  const stored = useSyncExternalStore(subscribe, read, () => null);
  const site = useSite();
  const brand = useBrand();
  const baseId = stored ?? site.data?.default_installation_id ?? brand.default_installation;
  const setBase = useCallback((id: string) => {
    window.localStorage.setItem(KEY, id);
    listeners.forEach((l) => l());
  }, []);
  return { baseId, setBase };
}
