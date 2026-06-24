"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCatalog } from "@/hooks/use-catalog";
import { deleteStation, saveStation } from "@/lib/catalog-store";
import type { Station, StationNetwork } from "@/types";
import { NETWORK_LABELS } from "@/types";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { useState } from "react";

const emptyStation: Station = { code: "", name: "", city: "", state: "", network: "intercity" };

export function StationManager() {
  const { stations } = useCatalog();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [form, setForm] = useState<Station>(emptyStation);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyStation });
    setError("");
    setSuccess("");
  };

  const openEdit = (station: Station) => {
    setCreating(false);
    setEditing(station);
    setForm({ ...station });
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code || code.length < 3) {
      setError("Station code must be at least 3 characters");
      setSuccess("");
      return;
    }
    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) {
      setError("All fields are required");
      setSuccess("");
      return;
    }
    if (!editing && stations.some((s) => s.code === code)) {
      setError("Station code already exists");
      setSuccess("");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await saveStation({ ...form, code: code.toUpperCase() });
      setForm({ ...emptyStation });
      setCreating(false);
      setEditing(null);
      setSuccess(editing ? "Station updated successfully" : "Station added successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to save station:", err);
      setError("Failed to save station. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete station ${code}?`)) {
      return;
    }

    setIsDeleting(code);
    setError("");
    setSuccess("");

    try {
      const ok = await deleteStation(code);
      if (!ok) {
        setError("Cannot delete — station is used by a train route");
        return;
      }
      setSuccess("Station deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to delete station:", err);
      setError("Failed to delete station. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{stations.length} stations</p>
        <Button size="sm" onClick={openCreate} disabled={creating || editing !== null}>
          <Plus className="h-4 w-4" />
          Add Station
        </Button>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 flex items-center gap-3"
        >
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-700">{success}</p>
        </motion.div>
      )}

      {(creating || editing !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-semibold">{editing ? "Edit Station" : "New Station"}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Code"
              placeholder="NDLS"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              disabled={!!editing || isSaving}
            />
            <Input
              label="Name"
              placeholder="e.g., New Delhi"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isSaving}
            />
            <Input
              label="City"
              placeholder="e.g., Delhi"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              disabled={isSaving}
            />
            <Input
              label="State"
              placeholder="e.g., Delhi"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              disabled={isSaving}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Network</label>
              <select
                value={form.network ?? "intercity"}
                onChange={(e) =>
                  setForm({ ...form, network: e.target.value as StationNetwork })
                }
                disabled={isSaving}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5"
              >
                {(Object.keys(NETWORK_LABELS) as StationNetwork[]).map((network) => (
                  <option key={network} value={network}>
                    {NETWORK_LABELS[network]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 p-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setForm({ ...emptyStation });
                setCreating(false);
                setEditing(null);
                setError("");
                setSuccess("");
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-card/80">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Network</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => (
              <tr key={station.code} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Badge variant="accent">{station.code}</Badge>
                </td>
                <td className="px-4 py-3">{station.name}</td>
                <td className="px-4 py-3 text-muted">{station.city}</td>
                <td className="px-4 py-3">
                  <Badge variant={station.network === "intercity" ? "default" : "accent"}>
                    {NETWORK_LABELS[station.network ?? "intercity"]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">{station.state}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(station)}
                      className="rounded-lg p-2 text-primary hover:bg-primary/10 disabled:opacity-50"
                      aria-label="Edit"
                      disabled={creating || editing !== null || isDeleting === station.code}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(station.code)}
                      className="rounded-lg p-2 text-danger hover:bg-danger/10 disabled:opacity-50"
                      aria-label="Delete"
                      disabled={creating || editing !== null || isDeleting !== null}
                    >
                      {isDeleting === station.code ? "..." : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
