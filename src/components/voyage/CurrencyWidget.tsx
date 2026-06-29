import { useEffect, useState } from "react";
import { DollarSign, Loader2, ArrowRightLeft } from "lucide-react";

// Map destination keywords to currency codes
const DEST_CURRENCY: [string[], string][] = [
  [["egypt", "cairo"], "EGP"],
  [["japan", "tokyo", "osaka"], "JPY"],
  [["europe", "france", "paris", "italy", "rome", "spain", "barcelona", "germany", "berlin", "greece", "santorini"], "EUR"],
  [["uk", "london", "england", "britain"], "GBP"],
  [["thailand", "bangkok"], "THB"],
  [["uae", "dubai", "abu dhabi"], "AED"],
  [["saudi", "riyadh", "jeddah"], "SAR"],
  [["india", "delhi", "mumbai"], "INR"],
  [["turkey", "istanbul"], "TRY"],
  [["bali", "indonesia", "jakarta"], "IDR"],
  [["iceland", "reykjavik"], "ISK"],
  [["canada", "toronto", "vancouver"], "CAD"],
  [["australia", "sydney", "melbourne"], "AUD"],
];

function detectCurrency(destination: string): string {
  const lower = destination.toLowerCase();
  for (const [keywords, code] of DEST_CURRENCY) {
    if (keywords.some((k) => lower.includes(k))) return code;
  }
  return "EUR";
}

export function CurrencyWidget({ destination }: { destination: string }) {
  const currency = detectCurrency(destination);
  const [rate, setRate] = useState<number | null>(null);
  const [amount, setAmount] = useState("100");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currency === "USD") { setRate(1); setLoading(false); return; }
    fetch(`https://api.frankfurter.app/latest?from=USD&to=${currency}`)
      .then((r) => r.json())
      .then((d) => { setRate(d.rates?.[currency] ?? null); })
      .catch(() => setRate(null))
      .finally(() => setLoading(false));
  }, [currency]);

  const converted = rate && !isNaN(Number(amount))
    ? (Number(amount) * rate).toLocaleString("en", { maximumFractionDigits: 2 })
    : "—";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Currency</span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Fetching rate…
        </div>
      ) : rate === null ? (
        <p className="text-xs text-muted-foreground">Rate unavailable</p>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1">USD</p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-foreground/30 transition"
              min={0}
            />
          </div>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground mt-4 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1">{currency}</p>
            <div className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm font-semibold">
              {converted}
            </div>
          </div>
        </div>
      )}
      {rate && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          1 USD = {rate.toLocaleString("en", { maximumFractionDigits: 4 })} {currency} · via Frankfurter
        </p>
      )}
    </div>
  );
}
