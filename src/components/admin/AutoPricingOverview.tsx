"use client";

import { Badge } from "@/components/ui/Badge";
import { CLASS_LABELS } from "@/types";

const OCCUPANCY_TIERS = [
  { label: "Below 20% seats filled", effect: "15% discount" },
  { label: "50–70% filled", effect: "15% surcharge" },
  { label: "70–85% filled", effect: "30% surcharge" },
  { label: "Above 85% filled", effect: "50% surcharge" },
];

const TIME_RULES = [
  { label: "Metro / local peak (7–10 AM, 5–8 PM)", effect: "15% surcharge" },
  { label: "Metro / local off-peak", effect: "5% discount" },
  { label: "Intercity weekends", effect: "8% surcharge" },
  { label: "Intercity late night (10 PM–5 AM)", effect: "8% discount" },
];

const BASE_FORMULA = [
  "Distance along the route (km from schedule stops)",
  "Train category (intercity, metro, local)",
  "Travel class multiplier (SL, 3A, 2A, etc.)",
  "Train type premium (Rajdhani, Shatabdi, Superfast, …)",
  "Time-based demand (peak hours, weekends)",
];

export function AutoPricingOverview() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h2 className="font-semibold">Automatic fare engine</h2>
        <p className="mt-2 text-sm text-muted">
          Ticket prices are calculated by the system — admins do not enter fares when
          creating trains. Fares update automatically when distance, class, occupancy,
          or travel time changes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Base fare formula</h3>
          <p className="mt-1 text-sm text-muted">Applied at search and booking</p>
          <ul className="mt-4 space-y-2 text-sm">
            {BASE_FORMULA.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Formula: km × category rate × class multiplier × train type × time demand
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Live occupancy adjustment</h3>
          <p className="mt-1 text-sm text-muted">Applied on top of the computed base fare</p>
          <ul className="mt-4 space-y-3 text-sm">
            {OCCUPANCY_TIERS.map((tier) => (
              <li key={tier.label} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted">{tier.label}</span>
                <Badge variant="accent">{tier.effect}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Time-based demand</h3>
          <p className="mt-1 text-sm text-muted">No manual date-range rules required</p>
          <ul className="mt-4 space-y-3 text-sm">
            {TIME_RULES.map((rule) => (
              <li key={rule.label} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted">{rule.label}</span>
                <Badge variant="default">{rule.effect}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Class multipliers</h3>
          <p className="mt-1 text-sm text-muted">Relative to 3A / standard class</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(CLASS_LABELS) as Array<keyof typeof CLASS_LABELS>).map((cls) => (
              <Badge key={cls} variant="default">{CLASS_LABELS[cls]}</Badge>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            Sleeper and second sitting use lower multipliers; AC First uses the highest.
          </p>
        </section>
      </div>
    </div>
  );
}
