import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { Category, Listing } from "./types";

export const CATEGORY_LABEL: Record<Category, string> = {
  housing: "Housing",
  vehicle: "Vehicle",
  goods: "Household goods",
};

export const CATEGORY_BADGE: Record<Category, string> = {
  housing: "bg-ocp/15 text-ocp-dark",
  vehicle: "bg-coyote/20 text-ink",
  goods: "bg-gold/30 text-ink",
};

export function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function money2(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function priceLabel(l: Pick<Listing, "price" | "price_unit">): string {
  return `${money(l.price)}${l.price_unit === "month" ? "/mo" : ""}`;
}

export function ago(iso: string): string {
  return `${formatDistanceToNow(new Date(iso))} ago`;
}

export function dateLabel(iso: string | null): string {
  if (!iso) return "Now";
  return format(parseISO(iso), "MMM d, yyyy");
}

export function contactHref(method: string, value: string): string {
  if (method === "email") return `mailto:${value}`;
  const digits = value.replace(/[^\d+]/g, "");
  return method === "text" ? `sms:${digits}` : `tel:${digits}`;
}
