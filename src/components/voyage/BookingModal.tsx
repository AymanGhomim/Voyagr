import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, CreditCard, CheckCircle2, Plane, Hotel, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  trip: { title: string; destination: string; dates: string; days: { places: unknown[] }[] };
  onClose: () => void;
};

type Step = "details" | "payment" | "confirm";

function generateRef() {
  return "VYG-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

const PRICE_PER_PERSON_PER_DAY = 120; // USD

export function BookingModal({ trip, onClose }: Props) {
  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  // Details
  const [travelers, setTravelers] = useState(1);
  const [roomType, setRoomType] = useState<"single" | "double" | "suite">("double");

  // Payment
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const numDays = trip.days.length || 1;
  const roomMultiplier = roomType === "single" ? 1 : roomType === "double" ? 1.4 : 2.2;
  const total = Math.round(travelers * numDays * PRICE_PER_PERSON_PER_DAY * roomMultiplier);

  function formatCard(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(val: string) {
    return val.replace(/\D/g, "").slice(0, 4).replace(/(.{2})/, "$1/");
  }

  function validatePayment() {
    const e: Record<string, string> = {};
    if (!card.name.trim()) e.name = "Required";
    if (card.number.replace(/\s/g, "").length < 16) e.number = "Enter a valid 16-digit card number";
    if (card.expiry.length < 5) e.expiry = "Enter MM/YY";
    if (card.cvv.length < 3) e.cvv = "Enter 3-digit CVV";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleConfirm() {
    if (!validatePayment()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setBookingRef(generateRef());
    setStep("confirm");
    setLoading(false);
    toast.success("Booking confirmed! 🎉");
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-black/[0.08] bg-white text-black shadow-2xl"
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-black/40">
                {step === "details" ? "Trip Details" : step === "payment" ? "Payment" : "Confirmed"}
              </p>
              <h2 className="mt-0.5 text-lg font-semibold">{trip.title}</h2>
            </div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/[0.04] transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">

            {/* ── Step 1: Details ── */}
            {step === "details" && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-5">

                {/* Trip summary */}
                <div className="rounded-2xl bg-black/[0.04] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Plane className="h-4 w-4 text-black/40" />
                    <span className="font-medium">{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-black/50">
                    <Calendar className="h-4 w-4" />
                    <span>{trip.dates}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-black/50">
                    <Hotel className="h-4 w-4" />
                    <span>{numDays} night{numDays !== 1 ? "s" : ""} · {trip.days.reduce((a: number, d) => a + d.places.length, 0)} places</span>
                  </div>
                </div>

                {/* Travelers */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-black/40">Travelers</label>
                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => setTravelers(Math.max(1, travelers - 1))}
                      className="grid h-9 w-9 place-items-center rounded-full border border-black/[0.08] text-lg hover:bg-black/[0.04] transition">−</button>
                    <span className="w-8 text-center text-lg font-semibold">{travelers}</span>
                    <button onClick={() => setTravelers(Math.min(10, travelers + 1))}
                      className="grid h-9 w-9 place-items-center rounded-full border border-black/[0.08] text-lg hover:bg-black/[0.04] transition">+</button>
                    <Users className="h-4 w-4 text-black/30 ml-1" />
                  </div>
                </div>

                {/* Room type */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-black/40">Room Type</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["single", "double", "suite"] as const).map((r) => (
                      <button key={r} onClick={() => setRoomType(r)}
                        className={`rounded-xl border py-2.5 text-sm font-medium capitalize transition ${roomType === r ? "border-black bg-black text-white" : "border-black/[0.08] hover:border-black/25"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between rounded-2xl bg-black/[0.04] px-4 py-3">
                  <span className="text-sm text-black/50">Estimated total</span>
                  <span className="text-xl font-bold">${total.toLocaleString()}</span>
                </div>

                <button onClick={() => setStep("payment")}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3.5 text-sm font-semibold text-white hover:bg-black/85 transition">
                  Continue to Payment <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Payment ── */}
            {step === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-4">

                <div className="flex items-center gap-2 text-sm text-black/40 -mt-1">
                  <CreditCard className="h-4 w-4" />
                  Card details are for demo only — nothing is charged.
                </div>

                {/* Name */}
                <Field label="Cardholder Name" error={errors.name}>
                  <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })}
                    placeholder="Ahmed Mohamed" className={input(errors.name)} />
                </Field>

                {/* Card number */}
                <Field label="Card Number" error={errors.number}>
                  <input value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
                    placeholder="1234 5678 9012 3456" className={input(errors.number)} maxLength={19} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry" error={errors.expiry}>
                    <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                      placeholder="MM/YY" className={input(errors.expiry)} maxLength={5} />
                  </Field>
                  <Field label="CVV" error={errors.cvv}>
                    <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                      placeholder="123" className={input(errors.cvv)} maxLength={3} />
                  </Field>
                </div>

                {/* Summary */}
                <div className="rounded-2xl bg-black/[0.04] px-4 py-3 space-y-1 text-sm">
                  <div className="flex justify-between text-black/50"><span>{travelers} traveler{travelers > 1 ? "s" : ""} × {numDays} nights</span><span>${(total * 0.85).toLocaleString()}</span></div>
                  <div className="flex justify-between text-black/50"><span>Taxes & fees</span><span>${(total * 0.15).toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold pt-1 border-t border-black/[0.08]"><span>Total</span><span>${total.toLocaleString()}</span></div>
                </div>

                <button onClick={handleConfirm} disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3.5 text-sm font-semibold text-white hover:bg-black/85 transition disabled:opacity-50">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <>Confirm Booking — ${total.toLocaleString()}</>}
                </button>

                <button onClick={() => setStep("details")} className="w-full text-center text-xs text-black/35 hover:text-black/60 transition">
                  ← Back
                </button>
              </motion.div>
            )}

            {/* ── Step 3: Confirmed ── */}
            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center space-y-4">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-black">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Booking Confirmed!</h3>
                  <p className="mt-1 text-sm text-black/50">Your trip to {trip.destination} is all set.</p>
                </div>
                <div className="rounded-2xl bg-black/[0.04] px-4 py-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-black/50">Reference</span><span className="font-mono font-bold">{bookingRef}</span></div>
                  <div className="flex justify-between"><span className="text-black/50">Dates</span><span>{trip.dates}</span></div>
                  <div className="flex justify-between"><span className="text-black/50">Travelers</span><span>{travelers}</span></div>
                  <div className="flex justify-between"><span className="text-black/50">Room</span><span className="capitalize">{roomType}</span></div>
                  <div className="flex justify-between font-bold pt-1 border-t border-black/[0.08]"><span>Total Paid</span><span>${total.toLocaleString()}</span></div>
                </div>
                <p className="text-xs text-black/35">A confirmation has been sent to your email.</p>
                <button onClick={onClose}
                  className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white hover:bg-black/85 transition">
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-black/40">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function input(error?: string) {
  return `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${error ? "border-red-400 focus:border-red-500" : "border-black/[0.08] focus:border-black/40"}`;
}
