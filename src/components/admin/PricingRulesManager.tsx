"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { PricingRule, PricingRuleType, TravelClass } from "@/types";

const PRICING_RULE_TYPES: { value: PricingRuleType; label: string }[] = [
  { value: "promotional", label: "Promotional" },
  { value: "demand", label: "Demand-Based" },
  { value: "occupancy", label: "Occupancy-Based" },
  { value: "date_range", label: "Date Range" },
];

const CLASSES: TravelClass[] = ["SL", "3A", "2A", "1A", "CC", "2S"];

interface PricingRulesManagerProps {
  onSave?: (rule: PricingRule) => void;
  onDelete?: (ruleId: string) => void;
}

export function PricingRulesManager({ onSave, onDelete }: PricingRulesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PricingRule>({
    id: "",
    class: "3A",
    type: "promotional",
    startDate: "",
    endDate: "",
    multiplier: 1,
    description: "",
    isActive: true,
  });

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [error, setError] = useState("");

  const handleCreate = () => {
    setEditingId(null);
    setForm({
      id: `rule-${Date.now()}`,
      class: "3A",
      type: "promotional",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      multiplier: 1,
      description: "",
      isActive: true,
    });
    setShowForm(true);
    setError("");
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingId(rule.id);
    setForm(JSON.parse(JSON.stringify(rule)));
    setShowForm(true);
    setError("");
  };

  const handleSave = () => {
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Start and end dates are required");
      return;
    }
    if (form.multiplier < 0.1 || form.multiplier > 5) {
      setError("Multiplier must be between 0.1 and 5");
      return;
    }

    if (editingId) {
      setRules(rules.map((r) => (r.id === editingId ? form : r)));
    } else {
      setRules([...rules, form]);
    }

    onSave?.(form);
    setShowForm(false);
    setError("");
  };

  const handleDelete = (ruleId: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      setRules(rules.filter((r) => r.id !== ruleId));
      onDelete?.(ruleId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{rules.length} pricing rules</p>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          <h3 className="font-semibold">
            {editingId ? "Edit Pricing Rule" : "New Pricing Rule"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as PricingRuleType })
                }
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
              >
                {PRICING_RULE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Class</label>
              <select
                value={form.class}
                onChange={(e) =>
                  setForm({ ...form, class: e.target.value as TravelClass })
                }
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
              >
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Multiplier
              </label>
              <Input
                type="number"
                step={0.1}
                min={0.1}
                max={5}
                value={form.multiplier}
                onChange={(e) =>
                  setForm({
                    ...form,
                    multiplier: parseFloat(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted mt-1">
                {form.multiplier < 1
                  ? `${Math.round((1 - form.multiplier) * 100)}% discount`
                  : form.multiplier > 1
                    ? `${Math.round((form.multiplier - 1) * 100)}% markup`
                    : "No change"}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">From</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">To</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Description
            </label>
            <Input
              placeholder="e.g., Early bird discount, Holiday surge pricing"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              Save Rule
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {rules.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">
            No pricing rules yet. Create one to get started.
          </p>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="accent">{rule.class}</Badge>
                  <Badge
                    variant={
                      rule.multiplier > 1
                        ? "danger"
                        : rule.multiplier < 1
                          ? "success"
                          : "default"
                    }
                  >
                    {rule.multiplier < 1
                      ? `−${Math.round((1 - rule.multiplier) * 100)}%`
                      : rule.multiplier > 1
                        ? `+${Math.round((rule.multiplier - 1) * 100)}%`
                        : "Standard"}
                  </Badge>
                  <span className="text-sm font-medium">
                    {PRICING_RULE_TYPES.find((t) => t.value === rule.type)
                      ?.label}
                  </span>
                  {!rule.isActive && (
                    <Badge variant="warning">Inactive</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{rule.description}</p>
                <p className="text-xs text-muted mt-1">
                  {rule.startDate} to {rule.endDate}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(rule)}
                  className="rounded-lg p-2 text-primary hover:bg-primary/10"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(rule.id)}
                  className="rounded-lg p-2 text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
