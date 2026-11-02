import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { CalendarDays, ImageOff, MapPin, Star } from "lucide-react";
import { SampleTag, VerifiedRibbon } from "@/components/Brand";
import { CATEGORY_BADGE, CATEGORY_LABEL, ago, dateLabel, priceLabel } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ListingCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const photo = listing.photos[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.05, duration: 0.35 }}
    >
      <Link
        to={`/listing/${listing.id}`}
        className="ocp-strip group block overflow-hidden rounded-md border border-border bg-card shadow-[0_1px_0_rgba(26,26,26,0.04)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg"
        data-testid={`listing-card-${listing.id}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {photo ? (
            <img
              src={photo}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-8" />
            </div>
          )}
          <span className={cn("absolute left-3 top-3 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", CATEGORY_BADGE[listing.category])}>
            {CATEGORY_LABEL[listing.category]}
          </span>
          {listing.featured && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-[3px] bg-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ink">
              <Star className="size-3 fill-ink" /> Spotlight
            </span>
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-heading text-2xl font-semibold text-ink" data-testid="listing-card-price">
              {priceLabel(listing)}
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">{listing.sample && <SampleTag />}{ago(listing.created_at)}</span>
          </div>
          <h3 className="line-clamp-2 font-sans text-[15px] font-semibold leading-snug tracking-normal text-ink">{listing.title}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{listing.area}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {listing.category === "housing" ? "Move-in" : "Available"} {dateLabel(listing.available_date)}
            </span>
          </div>
          {listing.seller_verified && <div className="pt-1"><VerifiedRibbon compact /></div>}
        </div>
      </Link>
    </motion.div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-md border border-border bg-card">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}
