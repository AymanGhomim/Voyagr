import { useState, useRef, useEffect, memo } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, Search, Compass, Bell, Settings, Sparkles, MapPin, Clock,
  Send, Wand2, ArrowLeft, X, Loader2, Calendar as CalendarIcon,
  Menu, CheckCircle2, Layers, Satellite, LogOut, LogIn, PenLine, AlertCircle, Ticket,
  Share2, FileDown, Moon, Sun,
} from "lucide-react";
import { trips as initialTrips, type Trip, type Day } from "@/lib/trip-data";
import { useAuth, useAuthUser, type AuthUser } from "@/lib/auth";
import { AuthModal } from "@/components/voyage/AuthModal";
import { ManualPlanModal } from "@/components/voyage/ManualPlanModal";
import { lazy, Suspense } from "react";
import { useOnboarding } from "@/components/voyage/Onboarding";
import { exportTripPDF } from "@/lib/export-pdf";

// Lazy-loaded heavy components
const BookingModal = lazy(() => import("@/components/voyage/BookingModal").then(m => ({ default: m.BookingModal })));
const ShareModal = lazy(() => import("@/components/voyage/ShareModal").then(m => ({ default: m.ShareModal })));
const WeatherWidget = lazy(() => import("@/components/voyage/WeatherWidget").then(m => ({ default: m.WeatherWidget })));
const CurrencyWidget = lazy(() => import("@/components/voyage/CurrencyWidget").then(m => ({ default: m.CurrencyWidget })));
const MapView = lazy(() => import("@/components/voyage/MapView").then(m => ({ default: m.MapView })));
const BudgetTracker = lazy(() => import("@/components/voyage/BudgetTracker").then(m => ({ default: m.BudgetTracker })));
const OnboardingModal = lazy(() => import("@/components/voyage/Onboarding").then(m => ({ default: m.OnboardingModal })));
import { PlaceImage } from "@/components/voyage/PlaceImage";
import { generateItinerary } from "@/lib/ai-planner";
import santorini from "@/assets/hero-santorini.webp";
import tokyo from "@/assets/place-tokyo.webp";
import bali from "@/assets/place-bali.webp";
import iceland from "@/assets/place-iceland.webp";

const COVERS = [santorini, tokyo, bali, iceland];

/* ─── Dashboard ───────────────────────────────────── */
export function Dashboard() {
  const { state } = useAuth();
  const user = useAuthUser();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [tripList, setTripList] = useState<Trip[]>(initialTrips);
  const [activeId, setActiveId] = useState(initialTrips[0].id);
  const [aiOpen, setAiOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("voyagr_theme", next ? "dark" : "light");
  }

  // Init theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("voyagr_theme");
    if (saved === "dark") { document.documentElement.classList.add("dark"); setDarkMode(true); }
    else { document.documentElement.classList.remove("dark"); setDarkMode(false); }
  }, []);
  const [manualOpen, setManualOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTripIndex = tripList.findIndex((t) => t.id === activeId);
  const trip = tripList[activeTripIndex >= 0 ? activeTripIndex : 0];

  // ── Loading ─────────────────────────────────────────
  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full gradient-ocean animate-pulse shadow-glow" />
      </div>
    );
  }

  // ── Not authenticated ───────────────────────────────
  if (state.status === "unauthenticated") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "var(--gradient-glow)" }} />
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-50 blur-3xl gradient-ocean" />
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative z-10 glass-strong mx-4 w-full max-w-md rounded-3xl p-10 text-center shadow-card"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-ocean shadow-glow">
            <LogIn className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="mt-6 font-display text-4xl">Welcome back</h2>
          <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
            Sign in to access your trips, itineraries, and AI assistant.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
            style={{ background: "var(--gradient-ocean)" }}
          >
            <LogIn className="h-4 w-4" /> Sign in to Voyagr
          </button>
          <Link to="/" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground transition">← Back to home</Link>
        </motion.div>
        <AnimatePresence>
          {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  // ── Helpers ─────────────────────────────────────────
  const updateTrip = (id: string, patch: Partial<Trip>) =>
    setTripList((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const handleCreate = (data: { title: string; destination: string; start: string; end: string; budget: number }) => {
    const id = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
    const fmt = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    const newTrip: Trip = {
      id,
      title: data.title,
      destination: data.destination,
      dates: `${fmt(data.start)} – ${fmt(data.end)}`,
      cover: COVERS[tripList.length % COVERS.length],
      budget: { spent: 0, total: data.budget },
      members: [{ name: user?.name ?? "You", color: user?.avatarColor ?? "from-emerald-400 to-teal-500" }],
      days: [],
      // Store raw dates for AI planner
      _startDate: data.start,
      _endDate: data.end,
    } as Trip & { _startDate?: string; _endDate?: string };
    setTripList((prev) => [newTrip, ...prev]);
    setActiveId(id);
    setNewOpen(false);
    toast.success("Trip created! 🎉", { description: `${data.title} is ready to plan.` });
  };

  const handleSaveDays = (days: Day[]) => {
    updateTrip(activeId, { days });
    setManualOpen(false);
    setAiOpen(false);
    toast.success("Plan saved! 🗺️");
  };

  const sidebarContent = (
    <SidebarNav
      trips={tripList} activeId={activeId}
      onSelect={(id) => { setActiveId(id); setMobileMenuOpen(false); }}
      onNew={() => { setNewOpen(true); setMobileMenuOpen(false); }}
      user={user}
      darkMode={darkMode}
      toggleDark={toggleDark}
    />
  );

  const tripWithDates = trip as Trip & { _startDate?: string; _endDate?: string };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed -top-40 right-0 h-[600px] w-[800px] rounded-full opacity-40 blur-3xl gradient-ocean" />

      {/* Mobile header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-ocean shadow-glow">
            <span className="font-display text-xl text-primary-foreground">V</span>
          </div>
          <span className="text-lg font-semibold">Voyagr</span>
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <div className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${user.avatarColor} text-xs font-bold text-white`}>
              {user.name[0].toUpperCase()}
            </div>
          )}
          <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-1.5 rounded-full glass-strong px-3 py-2 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> AI
          </button>
          <button onClick={() => setMobileMenuOpen(true)} className="grid h-9 w-9 place-items-center rounded-xl glass">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 z-50 h-full w-72 border-r border-border bg-background/95 backdrop-blur-2xl lg:hidden"
              initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex max-w-[1600px] gap-4 p-4 pt-0 lg:pt-4">
        <div className="hidden lg:block">{sidebarContent}</div>
        <main className="flex-1 min-w-0">
          <TripWorkspace
            trip={trip}
            onOpenAI={() => setAiOpen(true)}
            onOpenManual={() => setManualOpen(true)}
            onUpdateTrip={(updated) => updateTrip(activeId, updated)}
            onShare={() => setShareOpen(true)}
            onBook={() => setBookingOpen(true)}
          />
        </main>
        <ChatPanel tripTitle={trip.title} user={user} />
      </div>

      <AnimatePresence>
        {aiOpen && (
          <AIAssistantModal
            trip={tripWithDates}
            onClose={() => setAiOpen(false)}
            onSaveDays={handleSaveDays}
          />
        )}
        {manualOpen && (
          <ManualPlanModal
            destination={trip.destination}
            startDate={tripWithDates._startDate}
            endDate={tripWithDates._endDate}
            existingDays={trip.days}
            onClose={() => setManualOpen(false)}
            onSave={handleSaveDays}
          />
        )}
        {newOpen && <NewTripModal onClose={() => setNewOpen(false)} onCreate={handleCreate} />}
        <Suspense fallback={null}>
          {bookingOpen && <BookingModal trip={trip} onClose={() => setBookingOpen(false)} />}
          {shareOpen && <ShareModal trip={trip} onClose={() => setShareOpen(false)} />}
          {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}
        </Suspense>
      </AnimatePresence>
    </div>
  );
}

/* ─── Sidebar ─────────────────────────────────────── */
function SidebarNav({ trips, activeId, onSelect, onNew, user, darkMode, toggleDark }: {
  trips: Trip[]; activeId: string;
  onSelect: (id: string) => void; onNew: () => void;
  user: AuthUser | null;
  darkMode: boolean; toggleDark: () => void;
}) {
  const [search, setSearch] = useState("");
  const { logout } = useAuth();
  const filtered = search.trim()
    ? trips.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.destination.toLowerCase().includes(search.toLowerCase()))
    : trips;

  return (
    <aside className="glass flex w-72 shrink-0 flex-col rounded-3xl p-4 h-[calc(100vh-2rem)] lg:sticky lg:top-4">
      <Link to="/" className="flex items-center gap-2 px-2 py-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-ocean shadow-glow">
          <span className="font-display text-xl text-primary-foreground">V</span>
        </div>
        <span className="text-lg font-semibold">Voyagr</span>
      </Link>
      <Link to="/" className="mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-white/5">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to landing
      </Link>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips…"
          className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
      </div>
      <button type="button" onClick={onNew}
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.01]"
        style={{ background: "var(--gradient-ocean)" }}>
        <Plus className="h-4 w-4" /> New trip
      </button>
      <p className="mt-6 px-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {search ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : "Your trips"}
      </p>
      <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-6 text-center text-xs text-muted-foreground">
              No trips match "{search}"
            </motion.p>
          ) : filtered.map((t) => {
            const active = t.id === activeId;
            return (
              <motion.button key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }} onClick={() => onSelect(t.id)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl p-2 pr-3 text-left transition ${active ? "bg-white/10 ring-1 ring-white/15" : "hover:bg-white/5"}`}>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <img src={t.cover} alt={t.title} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover" />
                  {active && <div className="absolute inset-0 ring-2 ring-primary/60 rounded-xl" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.destination} · {t.dates.split("–")[0].trim()}</p>
                </div>
                {active && <span className="h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_10px_oklch(0.78_0.18_45)]" />}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="mt-3 border-t border-white/5 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <button onClick={toggleDark} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 transition" title="Toggle theme">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 transition" onClick={() => toast("No new notifications 🔔")}><Bell className="h-4 w-4" /></button>
          <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 transition" onClick={() => toast("Explore coming soon 🧭")}><Compass className="h-4 w-4" /></button>
          <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 transition" onClick={() => toast("Settings coming soon ⚙️")}><Settings className="h-4 w-4" /></button>
          <button onClick={() => { logout(); toast("Signed out ✈️"); }} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 transition text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /></button>
        </div>
        {user && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-2">
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br ${user.avatarColor} text-xs font-bold text-white`}>{user.name[0].toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─── Trip Workspace ─────────────────────────────── */
function TripWorkspace({ trip, onOpenAI, onOpenManual, onUpdateTrip, onShare, onBook }: {
  trip: Trip; onOpenAI: () => void; onOpenManual: () => void;
  onUpdateTrip: (patch: Partial<Trip>) => void;
  onShare: () => void; onBook: () => void;
}) {
  const removePlace = (dayIdx: number, placeId: string) => {
    const newDays = trip.days.map((d, i) =>
      i === dayIdx ? { ...d, places: d.places.filter((p) => p.id !== placeId) } : d,
    );
    onUpdateTrip({ days: newDays });
  };

  return (
    <div className="space-y-4">
      {/* Hero */}
      <motion.div key={trip.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative h-72 overflow-hidden rounded-3xl">
        <img src={trip.cover} alt={trip.title} width={1920} height={1280} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">{trip.destination} · {trip.dates}</p>
            <h1 className="mt-2 font-display text-4xl md:text-6xl">{trip.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {trip.members.map((m) => (
                <div key={m.name} title={m.name} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-background bg-gradient-to-br ${m.color} text-xs font-semibold text-white`}>{m.name[0]}</div>
              ))}
              <button title="Invite" onClick={() => toast("Invite coming soon 👥")} className="grid h-9 w-9 place-items-center rounded-full border-2 border-background bg-white/10 hover:bg-white/20 transition"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            {/* Planning mode buttons */}
            <button onClick={onOpenManual} className="inline-flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-sm font-medium hover:bg-white/15 transition">
              <PenLine className="h-4 w-4" /> Plan manually
            </button>
            <button onClick={onOpenAI} className="inline-flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-sm font-medium hover:bg-white/15 transition">
              <Sparkles className="h-4 w-4 text-accent" /> AI plan
            </button>
            <button onClick={onShare}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button onClick={() => exportTripPDF(trip)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition">
              <FileDown className="h-4 w-4" /> PDF
            </button>
            <button
              onClick={onBook}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90 active:scale-95"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <Ticket className="h-4 w-4" /> Book Trip
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <BudgetCard trip={trip} />
        <StatCard label="Places" value={trip.days.reduce((a, d) => a + d.places.length, 0).toString()} hint="curated" />
        <StatCard label="Days" value={trip.days.length > 0 ? trip.days.length.toString() : "—"} hint={trip.days.length > 0 ? "planned" : "draft"} />
      </div>

      {/* Weather + Currency + Map + Budget */}
      <Suspense fallback={<div className="h-32 rounded-2xl bg-muted animate-pulse" />}>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Weather Forecast</p>
            <WeatherWidget destination={trip.destination} dates={trip.dates} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <CurrencyWidget destination={trip.destination} />
            <BudgetTracker budget={trip.budget} />
          </div>
          <MapView destination={trip.destination} days={trip.days} />
        </div>
      </Suspense>

      {/* Itinerary */}
      <div className="space-y-6">
        {trip.days.length === 0 ? (
          <EmptyDays onOpenAI={onOpenAI} onOpenManual={onOpenManual} />
        ) : (
          trip.days.map((d, dayIdx) => (
            <div key={d.day}>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Day {d.day} · {d.date}</p>
                  <h2 className="font-display text-3xl">{d.title}</h2>
                </div>
                <button onClick={onOpenManual} className="rounded-full glass px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10 transition">
                  + Add place
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {d.places.map((p, i) => <PlaceCard key={p.id} place={p} index={i} onRemove={() => removePlace(dayIdx, p.id)} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BudgetCard({ trip }: { trip: Trip }) {
  const pct = trip.budget.total > 0 ? Math.min(100, Math.round((trip.budget.spent / trip.budget.total) * 100)) : 0;
  const isOver = pct >= 90;
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Budget</p>
        <p className={`text-xs font-medium ${isOver ? "text-destructive" : "text-muted-foreground"}`}>{pct}%{isOver ? " ⚠️" : ""}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold">€{trip.budget.spent.toLocaleString()}<span className="text-base text-muted-foreground"> / {trip.budget.total.toLocaleString()}</span></p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          className="h-full rounded-full" style={{ background: isOver ? "var(--destructive)" : "var(--gradient-ocean)" }} />
      </div>
    </div>
  );
}

const StatCard = memo(function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
});

function PlaceCard({ place, index, onRemove }: {
  place: { id: string; name: string; city: string; emoji: string; tag: string; time: string; image: string };
  index: number; onRemove: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group lift relative h-56 overflow-hidden rounded-3xl border border-white/10 cursor-pointer"
      onClick={() => toast(`${place.emoji} ${place.name}`, { description: `${place.city} · ${place.tag} at ${place.time}` })}>
      <PlaceImage
        name={place.name}
        city={place.city}
        tag={place.tag}
        alt={place.name}
        className="transition duration-700 group-hover:scale-105"
        width={800}
        height={600}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute right-3 top-3 hidden h-7 w-7 place-items-center rounded-full bg-background/60 text-muted-foreground hover:text-destructive backdrop-blur-sm group-hover:grid transition"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full glass-strong px-3 py-1 text-xs"><Clock className="h-3 w-3" /> {place.time}</div>
      <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full glass-strong px-3 py-1 text-xs">{place.tag}</div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-2 text-2xl">{place.emoji}<span className="text-base font-semibold">{place.name}</span></div>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {place.city}</p>
      </div>
    </motion.div>
  );
}

function EmptyDays({ onOpenAI, onOpenManual }: { onOpenAI: () => void; onOpenManual: () => void }) {
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-12 text-center">
      <div aria-hidden className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-glow)" }} />
      <div className="relative">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-ocean shadow-glow"><Wand2 className="h-6 w-6 text-primary-foreground" /></div>
        <h3 className="mt-5 font-display text-3xl">This trip is a blank canvas</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Plan it yourself, or let AI design the whole trip for you.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={onOpenAI}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
            style={{ background: "var(--gradient-ocean)" }}>
            <Sparkles className="h-4 w-4" /> Generate with AI
          </button>
          <button onClick={onOpenManual}
            className="inline-flex items-center gap-2 rounded-full glass-strong px-6 py-3 text-sm font-medium hover:bg-white/10 transition">
            <PenLine className="h-4 w-4" /> Plan manually
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Assistant Modal ─────────────────────────── */
type AIStage = "idle" | "thinking" | "done" | "error";

function AIAssistantModal({ trip, onClose, onSaveDays }: {
  trip: Trip & { _startDate?: string; _endDate?: string };
  onClose: () => void;
  onSaveDays: (days: Day[]) => void;
}) {
  const [stage, setStage] = useState<AIStage>("idle");
  const [prompt, setPrompt] = useState("");
  const [generatedDays, setGeneratedDays] = useState<Day[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [thinkingStep, setThinkingStep] = useState(0);

  const hasKey = !!import.meta.env.VITE_GEMINI_API_KEY;
  const numDays = trip._startDate && trip._endDate
    ? Math.max(1, Math.round((new Date(trip._endDate).getTime() - new Date(trip._startDate).getTime()) / 86_400_000) + 1)
    : 5;

  const thinkingSteps = [
    `Exploring top spots in ${trip.destination}…`,
    "Mapping golden-hour windows…",
    "Balancing culture, food & rest…",
    "Arranging perfect day flow…",
  ];

  const generate = async () => {
    if (!hasKey) { setErrorMsg("No Gemini API key found. Add VITE_GEMINI_API_KEY to your .env file."); setStage("error"); return; }
    setStage("thinking");
    setThinkingStep(0);

    // Step animation
    const interval = setInterval(() => setThinkingStep((s) => Math.min(s + 1, thinkingSteps.length - 1)), 1200);
    try {
      const days = await generateItinerary(
        trip.destination,
        trip._startDate ?? new Date().toISOString().split("T")[0],
        trip._endDate ?? new Date(Date.now() + numDays * 86_400_000).toISOString().split("T")[0],
        prompt,
      );
      clearInterval(interval);
      setGeneratedDays(days);
      setStage("done");
    } catch (err) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(msg.includes("NO_API_KEY") ? "Add VITE_GEMINI_API_KEY to your .env file." : msg);
      setStage("error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }} onClick={(e) => e.stopPropagation()}
        className="glass-strong relative w-full max-w-2xl overflow-hidden rounded-3xl p-8 shadow-card max-h-[90vh] overflow-y-auto">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-50 blur-3xl gradient-ocean" />
        <button onClick={onClose} className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 transition"><X className="h-4 w-4" /></button>

        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs"><Sparkles className="h-3.5 w-3.5 text-accent" /> Voyagr</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              📍 {trip.destination} · {numDays} day{numDays !== 1 ? "s" : ""}
            </div>
          </div>
          <h2 className="mt-4 font-display text-4xl">AI trip planner</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generating a real itinerary for <strong>{trip.destination}</strong> based on your {numDays}-day trip.
          </p>

          {trip.days.length > 0 && stage === "idle" && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
              Existing itinerary will be replaced when you add the new one.
            </div>
          )}

          {!hasKey && stage === "idle" && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              No API key found — add <code className="rounded bg-white/10 px-1">VITE_GEMINI_API_KEY</code> to your .env file.
            </div>
          )}

          {/* Prompt input */}
          <div className="mt-5">
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Your preferences (optional)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              disabled={stage === "thinking"}
              placeholder={`e.g. romantic, slow mornings, skip museums, good food…`}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Idle: generate button */}
          {stage === "idle" && (
            <button onClick={generate}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "var(--gradient-ocean)" }}>
              <Wand2 className="h-4 w-4" /> Generate {numDays}-day itinerary
            </button>
          )}

          {/* Thinking */}
          {stage === "thinking" && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="relative h-8 w-8">
                  <div className="absolute inset-0 rounded-full gradient-ocean blur-md opacity-70 animate-pulse" />
                  <div className="absolute inset-1 rounded-full bg-background grid place-items-center"><Sparkles className="h-3.5 w-3.5 text-accent" /></div>
                </div>
                {thinkingSteps[thinkingStep]}
              </div>
              {thinkingSteps.slice(0, thinkingStep + 1).map((s, i) => (
                <motion.div key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="glass rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
                  <span className="text-accent">✓</span> {s}
                </motion.div>
              ))}
            </div>
          )}

          {/* Error */}
          {stage === "error" && (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setStage("idle")} className="rounded-full glass px-5 py-2.5 text-sm hover:bg-white/10 transition">← Try again</button>
            </div>
          )}

          {/* Done: preview + add */}
          {stage === "done" && generatedDays.length > 0 && (
            <div className="mt-6 space-y-2">
              {generatedDays.map((day, i) => (
                <motion.div key={day.day} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="glass flex items-center gap-3 rounded-2xl p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-lg">{day.places[0]?.emoji ?? "✨"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Day {day.day} · {day.date}</p>
                    <p className="text-sm truncate">{day.title}</p>
                    <p className="text-[10px] text-muted-foreground/70 truncate">{day.places.map((p) => p.name).join(" · ")}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground shrink-0">{day.places.length} stops</p>
                </motion.div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => onSaveDays(generatedDays)}
                  className="flex-1 rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
                  style={{ background: "var(--gradient-ocean)" }}>
                  Add to trip
                </button>
                <button onClick={() => { setStage("idle"); setGeneratedDays([]); }}
                  className="rounded-full glass px-5 py-3 text-sm hover:bg-white/10 transition">Regenerate</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Chat Panel ─────────────────────────────────── */
function ChatPanel({ tripTitle, user }: { tripTitle: string; user: AuthUser | null }) {
  const [msgs, setMsgs] = useState([
    { who: "Maya", text: "Should we add Pyrgos sunset? 🌅", color: "from-fuchsia-400 to-violet-500" },
    { who: "Leo", text: "Yes! And book Ammoudi for 8pm.", color: "from-amber-400 to-orange-500" },
    { who: "Voyagr", text: "I found a quiet rooftop in Pyrgos with a 9.4 sunset rating. Add it?", color: "from-cyan-400 to-violet-500", ai: true },
  ]);
  const [val, setVal] = useState("");
  const [typing, setTyping] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => {
    const t = setTimeout(() => { setTyping(false); setMsgs((prev) => [...prev, { who: "Sana", text: "Let's do it! 🙌", color: "from-sky-400 to-cyan-500" }]); }, 3000);
    return () => clearTimeout(t);
  }, []);
  const sendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    const text = val.trim();
    setMsgs((prev) => [...prev, { who: user?.name ?? "You", text, color: user?.avatarColor ?? "from-emerald-400 to-teal-500" }]);
    setVal("");
    if (text.includes("?") || text.toLowerCase().includes("suggest") || text.toLowerCase().includes("add")) {
      setTimeout(() => { setMsgs((prev) => [...prev, { who: "Voyagr", text: "Great idea! Let me check the best options for that 🗺️", color: "from-cyan-400 to-violet-500", ai: true }]); }, 1200);
    }
  };
  return (
    <aside className="glass hidden w-80 shrink-0 flex-col rounded-3xl p-4 xl:flex h-[calc(100vh-2rem)] sticky top-4">
      <div className="flex items-center justify-between">
        <div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Crew</p><p className="text-sm font-semibold truncate max-w-[140px]">{tripTitle}</p></div>
        <div className="flex -space-x-2">{["M","L","S"].map((c,i)=><div key={i} className="grid h-7 w-7 place-items-center rounded-full border-2 border-background gradient-ocean text-[11px] font-semibold">{c}</div>)}</div>
      </div>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex gap-2">
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br ${m.color} text-[10px] font-semibold`}>{(m as {ai?:boolean}).ai ? "✨" : m.who[0]}</div>
            <div className={`max-w-[80%] rounded-2xl rounded-tl-sm px-3 py-2 text-sm ${(m as {ai?:boolean}).ai ? "glass-strong border-primary/30" : "bg-white/5"}`}>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.who}</p>
              <p className="mt-0.5">{m.text}</p>
            </div>
          </motion.div>
        ))}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 pl-9 text-xs text-muted-foreground">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </span>
              Sana is typing…
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMsg} className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5">
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Message your crew…" className="flex-1 bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus:outline-none" />
        <button type="submit" disabled={!val.trim()} className="grid h-8 w-8 place-items-center rounded-xl text-primary-foreground shadow-glow transition disabled:opacity-50" style={{ background: "var(--gradient-ocean)" }}><Send className="h-3.5 w-3.5" /></button>
      </form>
    </aside>
  );
}

/* ─── New Trip Modal ─────────────────────────────── */
function NewTripModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (data: { title: string; destination: string; start: string; end: string; budget: number }) => void;
}) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [budget, setBudget] = useState("2000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !destination.trim() || !start || !end) { setError("Please fill in all required fields."); return; }
    if (new Date(end) < new Date(start)) { setError("End date must be after start date."); return; }
    const b = Number(budget);
    if (!Number.isFinite(b) || b <= 0) { setError("Please enter a valid budget."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    onCreate({ title: title.trim(), destination: destination.trim(), start, end, budget: b });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-md p-4" onClick={onClose}>
      <motion.form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="glass-strong relative w-full max-w-lg rounded-3xl p-7 shadow-glow">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 transition"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-ocean shadow-glow"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
          <div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">New journey</p><h2 className="font-display text-2xl">Plan a new trip</h2></div>
        </div>
        <div className="mt-6 space-y-4">
          <Field label="Trip name *"><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunset in Lisbon" maxLength={60} className="auth-input" /></Field>
          <Field label="Destination *"><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Lisbon, Portugal" maxLength={60} className="auth-input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date *">
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="date" value={start} min={today} onChange={(e) => { setStart(e.target.value); if (end && e.target.value > end) setEnd(""); }} className="auth-input pr-10 [color-scheme:dark]" />
              </div>
            </Field>
            <Field label="End date *">
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="date" value={end} min={start || today} onChange={(e) => setEnd(e.target.value)} className="auth-input pr-10 [color-scheme:dark]" />
              </div>
            </Field>
          </div>
          <Field label="Budget (€)"><input type="number" min={1} max={999999} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="2000" className="auth-input" /></Field>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">{error}</motion.p>
          )}
        </AnimatePresence>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/5 transition disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] disabled:opacity-70"
            style={{ background: "var(--gradient-ocean)" }}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><Sparkles className="h-4 w-4" /> Create trip</>}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
