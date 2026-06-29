import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Loader2 } from "lucide-react";

type WeatherDay = { date: string; max: number; min: number; code: number };

const WMO: Record<number, { label: string; Icon: typeof Sun }> = {
  0: { label: "Clear", Icon: Sun },
  1: { label: "Mainly clear", Icon: Sun },
  2: { label: "Partly cloudy", Icon: Cloud },
  3: { label: "Overcast", Icon: Cloud },
  51: { label: "Drizzle", Icon: CloudRain },
  61: { label: "Rain", Icon: CloudRain },
  71: { label: "Snow", Icon: CloudSnow },
  80: { label: "Showers", Icon: CloudRain },
  95: { label: "Thunderstorm", Icon: CloudRain },
};

function getIcon(code: number) {
  const closest = Object.keys(WMO).map(Number).reduce((a, b) =>
    Math.abs(b - code) < Math.abs(a - code) ? b : a
  );
  return WMO[closest] ?? WMO[0];
}

async function geocode(destination: string) {
  const r = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`
  );
  const d = await r.json();
  return d.results?.[0] as { latitude: number; longitude: number; name: string } | undefined;
}

async function fetchWeather(lat: number, lon: number, start: string, end: string) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
    `&start_date=${start}&end_date=${end}&timezone=auto`
  );
  return r.json();
}

function toIso(dateStr: string) {
  // "Jun 12" → try to parse with current year
  try {
    const d = new Date(`${dateStr} ${new Date().getFullYear()}`);
    return d.toISOString().split("T")[0];
  } catch { return ""; }
}

export function WeatherWidget({ destination, dates }: { destination: string; dates: string }) {
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const parts = dates.split(/[–—-]/).map((s) => s.trim());
        const start = toIso(parts[0]);
        const end = toIso(parts[1] ?? parts[0]);
        if (!start) throw new Error("Invalid dates");

        const geo = await geocode(destination);
        if (!geo) throw new Error("Location not found");

        const weather = await fetchWeather(geo.latitude, geo.longitude, start, end);
        const result: WeatherDay[] = (weather.daily?.time ?? []).map((date: string, i: number) => ({
          date,
          max: Math.round(weather.daily.temperature_2m_max[i]),
          min: Math.round(weather.daily.temperature_2m_min[i]),
          code: weather.daily.weathercode[i],
        }));
        setDays(result.slice(0, 7));
      } catch (e: unknown) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [destination, dates]);

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
      <Loader2 className="h-3 w-3 animate-spin" /> Loading weather…
    </div>
  );

  if (error || !days.length) return (
    <div className="text-xs text-muted-foreground py-2 flex items-center gap-1">
      <Wind className="h-3 w-3" /> Weather unavailable for these dates
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 pb-1 min-w-max">
        {days.map((d) => {
          const { Icon, label } = getIcon(d.code);
          const shortDate = new Date(d.date + "T12:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
          return (
            <div key={d.date} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-3 py-2.5 text-center min-w-[72px]">
              <p className="text-[10px] text-muted-foreground">{shortDate}</p>
              <Icon className="h-5 w-5 text-foreground/70" title={label} />
              <p className="text-xs font-semibold">{d.max}°</p>
              <p className="text-[10px] text-muted-foreground">{d.min}°</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
