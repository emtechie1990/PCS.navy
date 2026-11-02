import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";
import { useBrand } from "@/lib/hooks";
import type { Report, ReportIn, ReportReason } from "@/lib/types";

const REASONS: Record<ReportReason, string> = {
  scam: "Scam or fraud (wire money, gift cards, fake landlord)",
  prohibited: "Prohibited item (issued gear, weapons, etc.)",
  misleading: "Misleading details or photos",
  duplicate: "Duplicate / spam",
  unavailable: "No longer available",
  other: "Something else",
};

export function ReportDialog({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("scam");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const m = useMutation({
    mutationFn: (body: ReportIn) => apiPost<Report>(`/listings/${listingId}/report`, body),
    onSuccess: () => {
      toast.success("Report sent. Our moderators will review this listing.");
      setOpen(false);
      setDetails("");
    },
    onError: () => toast.error("Could not send report. Try again."),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/5" data-testid="report-listing-button" />}
      >
        <Flag className="size-4" /> Report this listing
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="stencil">Report listing</DialogTitle>
          <DialogDescription>Reports are confidential and reviewed by {useBrand().domain} moderators.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v: string) => setReason(v as ReportReason)}>
              <SelectTrigger className="w-full" data-testid="report-reason-select">
                <SelectValue>{(v) => REASONS[v as ReportReason]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REASONS) as ReportReason[]).map((r) => (
                  <SelectItem key={r} value={r} data-testid={`report-reason-${r}`}>{REASONS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-details">What happened?</Label>
            <Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={4} placeholder="Optional details" data-testid="report-details-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-email">Your email (optional, for follow-up)</Label>
            <Input id="report-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="report-email-input" />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => m.mutate({ reason, details, reporter_email: email.trim() || null })}
            disabled={m.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
            data-testid="report-submit-button"
          >
            {m.isPending ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
