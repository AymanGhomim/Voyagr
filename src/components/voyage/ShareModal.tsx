import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Trip } from "@/lib/trip-data";

type Props = { trip: Trip; onClose: () => void };

export function ShareModal({ trip, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // Encode trip as base64 in URL hash
  const payload = btoa(encodeURIComponent(JSON.stringify({
    title: trip.title,
    destination: trip.destination,
    dates: trip.dates,
    days: trip.days,
  })));
  const shareUrl = `${window.location.origin}/app#share=${payload}`;

  async function copy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Share Trip</p>
              <h3 className="text-base font-semibold mt-0.5">{trip.title}</h3>
            </div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with anyone to let them view your itinerary for <strong>{trip.destination}</strong>.
            </p>

            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-xs font-mono truncate text-muted-foreground">
                {shareUrl}
              </div>
              <button
                onClick={copy}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground text-background hover:opacity-80 transition"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Native share if supported */}
            {typeof navigator.share === "function" && (
              <button
                onClick={() => navigator.share({ title: trip.title, url: shareUrl })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-2.5 text-sm font-medium hover:bg-accent transition"
              >
                <Share2 className="h-4 w-4" /> Share via…
              </button>
            )}

            <p className="text-[11px] text-muted-foreground text-center">
              Anyone with this link can view the itinerary.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
