"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCatalog } from "@/hooks/use-catalog";
import { deleteStation, saveStation } from "@/lib/catalog-store";
import {
  filterStationsByNetwork,
  getNetworkCities,
  getStationNetwork,
} from "@/lib/station-utils";
import type { Station, StationNetwork } from "@/types";
import { NETWORK_LABELS } from "@/types";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptyStation: Station = { code: "", name: "", city: "", state: "", network: "intercity" };

const NETWORK_FILTERS: Array<{ id: "all" | StationNetwork; label: string }> = [
  { id: "all", label: "All Networks" },
  { id: "intercity", label: NETWORK_LABELS.intercity },
  { id: "metro", label: NETWORK_LABELS.metro },
  { id: "local", label: NETWORK_LABELS.local },
];

type StationGroup = {
  title: string;
  stations: Station[];
};

function buildStationGroups(
  stations: Station[],
  networkFilter: "all" | StationNetwork,
  cityFilter: string
): StationGroup[] {
  if (networkFilter === "intercity") {
    return [
      {
        title: NETWORK_LABELS.intercity,
        stations: filterStationsByNetwork(stations, "intercity"),
      },
    ];
  }

  if (networkFilter === "metro" || networkFilter === "local") {
    const urban = filterStationsByNetwork(stations, networkFilter);
    const cities =
      cityFilter === "all"
        ? getNetworkCities(stations, networkFilter)
        : urban.some((s) => s.city === cityFilter)
          ? [cityFilter]
          : [];

    return cities
      .map((city) => ({
        title: city,
        stations: urban.filter((s) => s.city === city),
      }))
      .filter((group) => group.stations.length > 0);
  }

  const groups: StationGroup[] = [];
  const intercity = filterStationsByNetwork(stations, "intercity");
  if (intercity.length > 0) {
    groups.push({ title: NETWORK_LABELS.intercity, stations: intercity });
  }

  for (const network of ["metro", "local"] as const) {
    const urban = filterStationsByNetwork(stations, network);
    if (urban.length === 0) continue;

    for (const city of getNetworkCities(stations, network)) {
      const cityStations = urban.filter((s) => s.city === city);
      if (cityStations.length > 0) {
        groups.push({
          title: `${NETWORK_LABELS[network]} — ${city}`,
          stations: cityStations,
        });
      }
    }
  }

  return groups;
}

function StationTable({
  stations,
  onEdit,
  onDelete,
  creating,
  editing,
  isDeleting,
}: {
  stations: Station[];
  onEdit: (station: Station) => void;
  onDelete: (code: string) => void;
  creating: boolean;
  editing: Station | null;
  isDeleting: string | null;
}) {
  if (stations.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-6 text-center text-sm text-muted">
        No stations match the current filters.
      </div>
    );
  }

  return (
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
                <Badge variant={getStationNetwork(station) === "intercity" ? "default" : "accent"}>
                  {NETWORK_LABELS[getStationNetwork(station)]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted">{station.state}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(station)}
                    className="rounded-lg p-2 text-primary hover:bg-primary/10 disabled:opacity-50"
                    aria-label="Edit"
                    disabled={creating || editing !== null || isDeleting === station.code}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(station.code)}
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
  );
}

export function StationManager() {
  const { stations } = useCatalog();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [form, setForm] = useState<Station>(emptyStation);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [networkFilter, setNetworkFilter] = useState<"all" | StationNetwork>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const availableCities = useMemo(() => {
    if (networkFilter !== "metro" && networkFilter !== "local") return [];
    return getNetworkCities(stations, networkFilter);
  }, [stations, networkFilter]);

  useEffect(() => {
    setCityFilter("all");
  }, [networkFilter]);

  const stationGroups = useMemo(
    () => buildStationGroups(stations, networkFilter, cityFilter),
    [stations, networkFilter, cityFilter]
  );

  const filteredCount = useMemo(
    () => stationGroups.reduce((sum, group) => sum + group.stations.length, 0),
    [stationGroups]
  );

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      ...emptyStation,
      network: networkFilter === "all" ? "intercity" : networkFilter,
    });
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
        <p className="text-sm text-muted">
          {filteredCount} of {stations.length} stations
        </p>
        <Button size="sm" onClick={openCreate} disabled={creating || editing !== null}>
          <Plus className="h-4 w-4" />
          Add Station
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {NETWORK_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setNetworkFilter(filter.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              networkFilter === filter.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "border border-border bg-card text-muted hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {(networkFilter === "metro" || networkFilter === "local") && availableCities.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted">Filter by place</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCityFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                cityFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Places
            </button>
            {availableCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setCityFilter(city)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  cityFilter === city
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

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

      <div className="space-y-6">
        {stationGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-3 text-sm font-semibold text-muted">
              {group.title} ({group.stations.length})
            </h3>
            <StationTable
              stations={group.stations}
              onEdit={openEdit}
              onDelete={handleDelete}
              creating={creating}
              editing={editing}
              isDeleting={isDeleting}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
