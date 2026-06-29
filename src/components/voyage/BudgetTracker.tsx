import { useState } from "react";
import { PlusCircle, Trash2, Receipt } from "lucide-react";

type Expense = { id: string; label: string; amount: number; category: string };
const CATEGORIES = ["Food", "Transport", "Hotel", "Activity", "Shopping", "Other"];

export function BudgetTracker({ budget }: { budget: { spent: number; total: number } }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");

  const totalSpent = budget.spent + expenses.reduce((a, e) => a + e.amount, 0);
  const pct = Math.min(100, Math.round((totalSpent / budget.total) * 100));
  const remaining = budget.total - totalSpent;

  function addExpense() {
    if (!label.trim() || !amount || isNaN(Number(amount))) return;
    setExpenses((prev) => [...prev, { id: crypto.randomUUID(), label: label.trim(), amount: Number(amount), category }]);
    setLabel("");
    setAmount("");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Budget Tracker</span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-semibold">${totalSpent.toLocaleString()} spent</span>
          <span className="text-muted-foreground">of ${budget.total.toLocaleString()}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "var(--foreground)" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {remaining >= 0 ? `$${remaining.toLocaleString()} remaining` : `$${Math.abs(remaining).toLocaleString()} over budget`}
        </p>
      </div>

      {/* Add expense */}
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Expense"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-foreground/30 transition"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="$"
          type="number"
          min={0}
          className="w-16 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-foreground/30 transition"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/30 transition"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={addExpense}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-foreground text-background hover:opacity-80 transition"
        >
          <PlusCircle className="h-4 w-4" />
        </button>
      </div>

      {/* Expenses list */}
      {expenses.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs">
              <span className="flex-1 font-medium truncate">{e.label}</span>
              <span className="text-muted-foreground">{e.category}</span>
              <span className="font-semibold">${e.amount}</span>
              <button onClick={() => setExpenses((prev) => prev.filter((x) => x.id !== e.id))}
                className="text-muted-foreground hover:text-destructive transition">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
