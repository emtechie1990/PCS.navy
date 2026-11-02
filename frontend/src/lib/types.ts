// Hand-written mirrors of backend/models/schemas.py and lib/brand.py — keep in sync.

export type Category = "housing" | "vehicle" | "goods";
export type ListingStatus = "pending" | "approved" | "hidden" | "investigating";
export type ContactMethod = "email" | "phone" | "text";
export type ReportStatus = "open" | "investigating" | "resolved" | "dismissed";
export type ReportReason = "scam" | "prohibited" | "misleading" | "duplicate" | "unavailable" | "other";

export type SourceKind = "official" | "partner" | "community";
export type ResourceGroup = "Plan the move" | "Housing" | "Money & entitlements" | "Family support";

export interface PcsResource {
  name: string;
  url: string;
  source: string;
  kind: SourceKind;
  group: ResourceGroup;
  description: string;
}

/** GET /api/brand — everything branch-specific the UI shows. */
export interface Brand {
  slug: "army" | "navy" | "airforce";
  domain: string;
  url: string;
  branch: string;
  members: string;
  member: string;
  station: string;
  stations: string;
  verified: string;
  logo: "shield" | "anchor" | "wings";
  theme: string;
  headline: [string, string];
  lede: string;
  hero: { image: string; alt: string };
  side: { image: string; alt: string };
  default_installation: string;
  disclaimer: string;
  resources: PcsResource[];
  siblings: { domain: string; url: string }[];
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  verified_military: boolean;
}

export interface MessageOut {
  message: string;
}

export interface Installation {
  id: string;
  name: string;
  short_name: string;
  former_name: string | null;
  city: string;
  state: string;
  tagline: string;
  areas: string[];
  housing_office_url: string;
  hero_image: string;
  launched: boolean;
  sort: number;
}

export type ListingDetails = Record<string, string | number | boolean | null>;

export interface ListingIn {
  category: Category;
  installation_id: string;
  area: string;
  title: string;
  description: string;
  price: number;
  price_unit: "month" | "total";
  photos: string[];
  contact_name: string;
  contact_method: ContactMethod;
  contact_value: string;
  available_date: string | null;
  details: ListingDetails;
}

export interface Listing extends ListingIn {
  id: string;
  status: ListingStatus;
  featured: boolean;
  seller_verified: boolean;
  sample: boolean;
  owner_id: string | null;
  report_count: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingPage {
  items: Listing[];
  total: number;
}

export interface ReportIn {
  reason: ReportReason;
  details: string;
  reporter_email: string | null;
}

export interface Report extends ReportIn {
  id: string;
  listing_id: string;
  listing_title: string;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
}

export interface SiteSettings {
  require_approval: boolean;
  default_installation_id: string;
}

export interface AdminStats {
  total_listings: number;
  pending: number;
  investigating: number;
  hidden: number;
  open_reports: number;
  users: number;
  launched_installations: number;
}

export type ProviderId = "stripe" | "apple_pay" | "google_pay" | "paypal";

export interface PaymentProvider {
  id: ProviderId;
  label: string;
  enabled: boolean;
}

export interface FeaturePlan {
  id: string;
  label: string;
  days: number;
  amount: number;
}

export interface PaymentConfig {
  providers: PaymentProvider[];
  plans: FeaturePlan[];
  live: boolean;
}

export interface CheckoutOut {
  intent_id: string;
  status: "not_configured" | "requires_redirect" | "succeeded";
  message: string;
  checkout_url: string | null;
}
