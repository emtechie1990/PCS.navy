import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Car, Home as HomeIcon, Info, Plus, Sofa, X } from "lucide-react";
import { toast } from "sonner";
import { VerifiedRibbon } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiPost } from "@/lib/api";
import { useBrand, useInstallations, useMe, useSelectedBase } from "@/lib/hooks";
import type { Category, ContactMethod, Listing, ListingDetails, ListingIn } from "@/lib/types";
import { cn } from "@/lib/utils";

type FieldDef =
  | { key: string; label: string; kind: "text" | "number" | "date"; placeholder?: string; required?: boolean }
  | { key: string; label: string; kind: "select"; options: Record<string, string>; required?: boolean }
  | { key: string; label: string; kind: "bool" };

const FORMS: Record<Category, { label: string; icon: typeof HomeIcon; blurb: string; priceUnit: boolean; fields: FieldDef[] }> = {
  housing: {
    label: "Housing", icon: HomeIcon, blurb: "Rent or sell a home, townhouse or apartment.", priceUnit: true,
    fields: [
      { key: "listing_type", label: "Listing type", kind: "select", options: { rent: "For rent", sale: "For sale" }, required: true },
      { key: "beds", label: "Bedrooms", kind: "number", required: true },
      { key: "baths", label: "Bathrooms", kind: "number", required: true },
      { key: "sqft", label: "Square feet", kind: "number" },
      { key: "pets", label: "Pet policy", kind: "text", placeholder: "e.g. Dogs under 50 lbs" },
      { key: "lease_term", label: "Lease term", kind: "text", placeholder: "e.g. 12 months" },
      { key: "military_clause", label: "Military clause accepted", kind: "bool" },
    ],
  },
  vehicle: {
    label: "Vehicle", icon: Car, blurb: "Cars, trucks, SUVs and motorcycles.", priceUnit: false,
    fields: [
      { key: "year", label: "Year", kind: "number", required: true },
      { key: "make", label: "Make", kind: "text", placeholder: "Ford", required: true },
      { key: "model", label: "Model / trim", kind: "text", placeholder: "F-150 XLT", required: true },
      { key: "mileage", label: "Mileage", kind: "number", required: true },
      { key: "transmission", label: "Transmission", kind: "select", options: { Automatic: "Automatic", Manual: "Manual" } },
      { key: "drivetrain", label: "Drivetrain", kind: "select", options: { "4x4": "4x4 / AWD", "4x2": "2WD" } },
      { key: "title_status", label: "Title status", kind: "select", options: { Clean: "Clean", Lien: "Lien", Salvage: "Salvage / rebuilt" }, required: true },
      { key: "vin", label: "VIN (optional)", kind: "text" },
    ],
  },
  goods: {
    label: "Household goods", icon: Sofa, blurb: "Furniture, appliances, kids' gear, tools.", priceUnit: false,
    fields: [
      { key: "item_type", label: "Item type", kind: "select", options: { Furniture: "Furniture", Appliances: "Appliances", Electronics: "Electronics", "Kids & baby": "Kids & baby", "Tools & outdoor": "Tools & outdoor", Other: "Other" }, required: true },
      { key: "condition", label: "Condition", kind: "select", options: { New: "New", "Like new": "Like new", Good: "Good", Fair: "Fair" }, required: true },
      { key: "dimensions", label: "Dimensions", kind: "text", placeholder: "e.g. 84\" x 36\"" },
      { key: "pcs_deadline", label: "Must go by (PCS date)", kind: "date" },
      { key: "pickup_only", label: "Pickup only", kind: "bool" },
    ],
  },
};

const CONTACT_LABEL: Record<ContactMethod, string> = { email: "Email", phone: "Phone call", text: "Text message" };

export default function CreateListing() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me, isError: meErr } = useMe();
  const { verified } = useBrand();
  const { data: bases } = useInstallations();
  const { baseId } = useSelectedBase();
  const type = (["housing", "vehicle", "goods"].includes(sp.get("type") ?? "") ? sp.get("type") : "housing") as Category;
  const form = FORMS[type];

  const [installation, setInstallation] = useState(sp.get("base") ?? baseId);
  const [area, setArea] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState<"month" | "total">("month");
  const [available, setAvailable] = useState("");
  const [photos, setPhotos] = useState<string[]>([""]);
  const [contactName, setContactName] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [contactValue, setContactValue] = useState("");
  const [details, setDetails] = useState<ListingDetails>({});
  const [agree, setAgree] = useState(false);

  const base = bases?.find((b) => b.id === installation);
  const baseNames = Object.fromEntries((bases ?? []).map((b) => [b.id, b.name]));
  const signedIn = !!me && !meErr;

  const m = useMutation({
    mutationFn: (body: ListingIn) => apiPost<Listing>("/listings", body),
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      toast.success(l.status === "pending" ? "Submitted — a moderator will approve it shortly." : "Your listing is live!");
      navigate(`/listing/${l.id}`);
    },
    onError: (e) => {
      const detail = e instanceof ApiError ? (e.body as { detail?: unknown })?.detail : null;
      toast.error(typeof detail === "string" ? detail : "Please check the required fields and try again.");
    },
  });

  const setDetail = (k: string, v: string | number | boolean | null) => setDetails((d) => ({ ...d, [k]: v }));

  const switchType = (t: Category) => {
    const next = new URLSearchParams(sp);
    next.set("type", t);
    setSp(next, { replace: true });
    setDetails({});
    setPriceUnit(t === "housing" ? "month" : "total");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      toast.error("Please confirm the listing follows the safety rules.");
      return;
    }
    const missing = form.fields.filter((f) => f.kind !== "bool" && f.required && (details[f.key] === undefined || details[f.key] === ""));
    if (!area || missing.length) {
      toast.error(`Missing: ${[!area && "Area", ...missing.map((f) => f.label)].filter(Boolean).join(", ")}`);
      return;
    }
    const cleanDetails: ListingDetails = {};
    for (const f of form.fields) {
      const v = details[f.key];
      if (f.kind === "bool") cleanDetails[f.key] = Boolean(v);
      else if (v !== undefined && v !== "") cleanDetails[f.key] = f.kind === "number" ? Number(v) : v;
    }
    m.mutate({
      category: type,
      installation_id: installation,
      area,
      title: title.trim(),
      description: description.trim(),
      price: Number(price || 0),
      price_unit: form.priceUnit ? priceUnit : "total",
      photos: photos.map((p) => p.trim()).filter((p) => /^https?:\/\//.test(p)),
      contact_name: contactName.trim(),
      contact_method: contactMethod,
      contact_value: contactValue.trim(),
      available_date: available || null,
      details: cleanDetails,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coyote">Post a listing</p>
      <h1 className="mt-1 text-4xl font-bold uppercase">What are you listing?</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {(Object.keys(FORMS) as Category[]).map((c) => {
          const F = FORMS[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => switchType(c)}
              data-active={c === type}
              className="ocp-strip flex items-start gap-3 rounded-md border border-border bg-card p-4 text-left transition-[border-color,box-shadow] duration-150 hover:shadow-md data-[active=true]:border-ocp data-[active=true]:shadow-md"
              data-testid={`create-type-${c}`}
            >
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded", c === type ? "bg-ocp text-paper" : "bg-muted text-ink")}>
                <F.icon className="size-5" />
              </span>
              <span>
                <span className="block font-heading text-lg uppercase">{F.label}</span>
                <span className="text-xs text-muted-foreground">{F.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-md border border-border bg-card p-4 text-sm" data-testid="create-account-notice">
        <Info className="mt-0.5 size-4 shrink-0 text-ocp" />
        {signedIn ? (
          <p>Posting as <strong>{me.name}</strong> — manage it anytime from My listings. {me.verified_military && <VerifiedRibbon compact />}</p>
        ) : (
          <p>
            You're posting as a guest — buyers will reach you by the contact method below.{" "}
            <Link to="/login" className="font-semibold text-ocp underline" data-testid="create-signin-link">Sign in</Link> to edit or remove listings later
            (sign up with a {verified} email to earn the Verified Military ribbon).
          </p>
        )}
      </div>

      <form onSubmit={submit} className="mt-8 space-y-8" data-testid={`create-form-${type}`}>
        <fieldset className="rounded-md border border-border bg-card p-6">
          <legend className="stencil px-2 text-sm text-coyote">Location</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Installation *</Label>
              <Select value={installation} onValueChange={(v: string) => { setInstallation(v); setArea(""); }}>
                <SelectTrigger className="w-full" data-testid="create-installation-select"><SelectValue>{(v) => baseNames[v as string] ?? "Choose"}</SelectValue></SelectTrigger>
                <SelectContent>{(bases ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Area / local section *</Label>
              <Select value={area} onValueChange={(v: string) => setArea(v)}>
                <SelectTrigger className="w-full" data-testid="create-area-select"><SelectValue>{(v) => (v as string) || "Choose area"}</SelectValue></SelectTrigger>
                <SelectContent>{(base?.areas ?? []).map((a) => <SelectItem key={a} value={a} data-testid={`create-area-${a.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-border bg-card p-6">
          <legend className="stencil px-2 text-sm text-coyote">{form.label} details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" required minLength={3} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "housing" ? "3BR townhouse near the main gate" : type === "vehicle" ? "2019 Ford F-150 XLT — PCSing" : "Sectional sofa, weight allowance sale"} data-testid="create-title-input" />
            </div>
            {form.fields.map((f) => (
              <div key={f.key} className={cn("space-y-1.5", f.kind === "bool" && "flex items-center gap-2 space-y-0 pt-6")}>
                {f.kind === "bool" ? (
                  <>
                    <Checkbox id={f.key} checked={Boolean(details[f.key])} onCheckedChange={(c) => setDetail(f.key, Boolean(c))} data-testid={`create-detail-${f.key}`} />
                    <Label htmlFor={f.key}>{f.label}</Label>
                  </>
                ) : f.kind === "select" ? (
                  <>
                    <Label>{f.label}{f.required && " *"}</Label>
                    <Select value={(details[f.key] as string) ?? ""} onValueChange={(v: string) => setDetail(f.key, v)}>
                      <SelectTrigger className="w-full" data-testid={`create-detail-${f.key}`}><SelectValue>{(v) => f.options[v as string] ?? "Choose"}</SelectValue></SelectTrigger>
                      <SelectContent>{Object.entries(f.options).map(([k, l]) => <SelectItem key={k} value={k} data-testid={`create-detail-${f.key}-${k.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Label htmlFor={f.key}>{f.label}{f.required && " *"}</Label>
                    <Input id={f.key} type={f.kind} step={f.kind === "number" ? "any" : undefined} placeholder={f.placeholder} value={(details[f.key] as string | number | undefined) ?? ""} onChange={(e) => setDetail(f.key, e.target.value)} data-testid={`create-detail-${f.key}`} />
                  </>
                )}
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="price">{type === "housing" ? "Rent / price (USD) *" : "Price (USD) *"}</Label>
              <div className="flex gap-2">
                <Input id="price" type="number" min={0} required value={price} onChange={(e) => setPrice(e.target.value)} data-testid="create-price-input" />
                {form.priceUnit && (
                  <Select value={priceUnit} onValueChange={(v: string) => setPriceUnit(v as "month" | "total")}>
                    <SelectTrigger className="w-36" data-testid="create-price-unit-select"><SelectValue>{(v) => (v === "month" ? "per month" : "total")}</SelectValue></SelectTrigger>
                    <SelectContent><SelectItem value="month">per month</SelectItem><SelectItem value="total">total</SelectItem></SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="available">{type === "housing" ? "Move-in date" : "Available from"}</Label>
              <Input id="available" type="date" value={available} onChange={(e) => setAvailable(e.target.value)} data-testid="create-available-date-input" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" required minLength={10} rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, why you're selling, pickup details, distance to the gate…" data-testid="create-description-input" />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-border bg-card p-6">
          <legend className="stencil px-2 text-sm text-coyote">Photos (image URLs)</legend>
          <div className="space-y-2">
            {photos.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input value={p} onChange={(e) => setPhotos((ps) => ps.map((x, j) => (j === i ? e.target.value : x)))} placeholder="https://…/photo.jpg" data-testid={`create-photo-input-${i}`} />
                {p.startsWith("http") && <img src={p} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />}
                {photos.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove photo" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} data-testid={`create-photo-remove-${i}`}><X className="size-4" /></Button>
                )}
              </div>
            ))}
            {photos.length < 10 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPhotos((ps) => [...ps, ""])} data-testid="create-photo-add-button"><Plus className="size-4" /> Add photo</Button>
            )}
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-border bg-card p-6">
          <legend className="stencil px-2 text-sm text-coyote">Contact</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="cname">Your name / rank *</Label>
              <Input id="cname" required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="SSG Smith" data-testid="create-contact-name-input" />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred method *</Label>
              <Select value={contactMethod} onValueChange={(v: string) => setContactMethod(v as ContactMethod)}>
                <SelectTrigger className="w-full" data-testid="create-contact-method-select"><SelectValue>{(v) => CONTACT_LABEL[v as ContactMethod]}</SelectValue></SelectTrigger>
                <SelectContent>{(Object.keys(CONTACT_LABEL) as ContactMethod[]).map((c) => <SelectItem key={c} value={c} data-testid={`create-contact-method-${c}`}>{CONTACT_LABEL[c]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cvalue">{contactMethod === "email" ? "Email" : "Phone number"} *</Label>
              <Input id="cvalue" required type={contactMethod === "email" ? "email" : "tel"} value={contactValue} onChange={(e) => setContactValue(e.target.value)} data-testid="create-contact-value-input" />
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={agree} onCheckedChange={(c) => setAgree(Boolean(c))} data-testid="create-agree-checkbox" />
            <span>
              This listing is mine to sell, contains no prohibited items (issued gear, weapons, etc.), and follows the{" "}
              <Link to="/safety" className="font-semibold text-ocp underline" data-testid="create-safety-link">safety rules & terms</Link>.
            </span>
          </label>
          <Button type="submit" size="lg" className="h-12 shrink-0 px-8 active:scale-[0.98]" disabled={m.isPending} data-testid="create-submit-button">
            {m.isPending ? "Posting…" : "Post listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
