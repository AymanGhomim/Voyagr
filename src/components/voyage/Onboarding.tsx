import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, Ticket, ArrowRight, X } from "lucide-react";

const STEPS = [
  {
    icon: MapPin,
    title: "Create your trip",
    desc: "Add a destination and travel dates to get started.",
  },
  {
    icon: Sparkles,
    title: "Let AI plan for you",
    desc: "Hit 'AI Plan' and get a full day-by-day itinerary in seconds.",
  },
  {
    icon: Ticket,
    title: "Book when you're ready",
    desc: "Use 'Book Trip' to confirm your booking directly from the app.",
  },
];

const KEY = "voyagr_onboarded";

export function useOnboarding() {
  const [show, setShow] = useState(() => !localStorage.getItem(KEY));
  function dismiss() {
    localStorage.setItem(KEY, "1");
    setShow(false);
  }
  return { show, dismiss };
}

export function OnboardingModal({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onDismiss();
  }

  const { icon: Icon, title, desc } = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          key={step}
          className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
          initial={{ y: 24, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -24, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
        >
          <button onClick={onDismiss} className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full hover:bg-accent transition">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <div className="p-8 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-foreground">
              <Icon className="h-8 w-8 text-background" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-5 bg-foreground" : "w-1.5 bg-border"}`} />
              ))}
            </div>

            <button
              onClick={next}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background hover:opacity-85 transition"
            >
              {step < STEPS.length - 1 ? <>Next <ArrowRight className="h-4 w-4" /></> : "Get Started 🚀"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
