"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCatalog } from "@/hooks/use-catalog";
import { deleteStation, saveStation } from "@/lib/catalog-store";
import type { Station } from "@/types";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const emptyStation: Station = { code: "", name: "", city: "", state: "" };

export function StationManager() {
  const { stations } = useCatalog();
  const [editing, setEditing] = useState<Station | null>(null);
  const [form, setForm] = useState<Station>(emptyStation);
  const [error, setError] = useState("");

  const openCreate = () => {
    setEditing(null);
    setForm(emptyStation);
    setError("");
  };

  const openEdit = (station: Station) => {
    setEditing(station);
    setForm({ ...station });
    setError("");
  };

  const handleSave = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code || code.length < 3) {
      setError("Station code must be at least 3 characters");
      return;
    }
    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) {
      setError("All fields are required");
      return;
    }
    if (!editing && stations.some((s) => s.code === code)) {
      setError("Station code already exists");
      return;
    }

    try {
      await saveStation({ ...form, code: code.toUpperCase() });
      setForm(emptyStation);
      setEditing(null);
      setError("");
    } catch {
      setError("Failed to save station");
    }
  };

  const handleDelete = async (code: string) => {
    const ok = await deleteStation(code);
    if (!ok) {
      setError("Cannot delete — station is used by a train route");
      return;
    }
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{stations.length} stations</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Station
        </Button>
      </div>

      {(editing !== null || form.code || form.name) && (
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
              disabled={!!editing}
            />
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setForm(emptyStation);
                setEditing(null);
                setError("");
              }}
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
                <td className="px-4 py-3 text-muted">{station.state}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(station)}
                      className="rounded-lg p-2 text-primary hover:bg-primary/10"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(station.code)}
                      className="rounded-lg p-2 text-danger hover:bg-danger/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
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
