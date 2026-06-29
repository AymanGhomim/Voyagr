import { useState } from "react";
import { Map, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Day } from "@/lib/trip-data";

type Props = { destination: string; days: Day[] };

export function MapView({ destination, days }: Props) {
  const [open, setOpen] = useState(false);
  const allPlaces = days.flatMap((d) => d.places);
  const query = allPlaces.length > 0
    ? allPlaces.map((p) => p.name).join(",")
    : destination;

  const embedUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=-180,-90,180,90` +
    `&layer=mapnik&marker=0,0` +
    `#map=10/${encodeURIComponent(destination)}`;

  // Use a simple search embed
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?` +
    new URLSearchParams({ bbox: "-180,-90,180,90", layer: "mapnik" }).toString();

  // Better: use Google Maps embed-like approach via osm
  const osmSearch = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition"
      >
        <Map className="h-4 w-4" /> Map View
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Map View</p>
                  <h3 className="text-base font-semibold mt-0.5">{destination}</h3>
                </div>
                <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent transition">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Places list */}
              {allPlaces.length > 0 && (
                <div className="px-5 py-3 border-b border-border overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {allPlaces.map((p, i) => (
                      <span key={p.id ?? i} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {p.emoji} {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Map iframe */}
              <div className="relative h-96">
                <iframe
                  title="Trip Map"
                  width="100%"
                  height="100%"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(destination)}&output=embed&z=11`}
                  className="border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="px-5 py-3 border-t border-border">
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(destination)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition"
                >
                  Open in Google Maps →
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
