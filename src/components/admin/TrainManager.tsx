"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCatalog } from "@/hooks/use-catalog";
import { deleteTrain, saveTrain } from "@/lib/catalog-store";
import { getFareBreakdown } from "@/lib/fare-calculator";
import { formatCurrency } from "@/lib/utils";
import { CLASS_LABELS, NETWORK_LABELS, type Train, type TrainCategory, type TrainScheduleStop, type TravelClass } from "@/types";
import { motion } from "framer-motion";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ALL_CLASSES = Object.keys(CLASS_LABELS) as TravelClass[];

function emptyTrain(): Train {
  return {
    number: "",
    name: "",
    type: "Superfast",
    category: "intercity",
    source: "NDLS",
    destination: "BCT",
    departureTime: "06:00",
    arrivalTime: "12:00",
    duration: "6h 00m",
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    classes: ["3A"],
    seatCapacity: { "3A": { UB: 20, MB: 20, LB: 20 } },
    schedule: [
      { stationCode: "NDLS", arrival: null, departure: "06:00", day: 1, distance: 0 },
      { stationCode: "BCT", arrival: "12:00", departure: null, day: 1, distance: 500 },
    ],
  };
}

export function TrainManager() {
  const { stations, trains } = useCatalog();
  const [editingNumber, setEditingNumber] = useState<string | null>(null);
  const [form, setForm] = useState<Train>(emptyTrain());
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const openCreate = () => {
    setEditingNumber(null);
    setForm(emptyTrain());
    setShowForm(true);
    setError("");
  };

  const openEdit = (train: Train) => {
    setEditingNumber(train.number);
    setForm(JSON.parse(JSON.stringify(train)) as Train);
    setShowForm(true);
    setError("");
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      runsOn: prev.runsOn.includes(day)
        ? prev.runsOn.filter((d) => d !== day)
        : [...prev.runsOn, day],
    }));
  };

  const toggleClass = (cls: TravelClass) => {
    setForm((prev) => {
      const has = prev.classes.includes(cls);
      const classes = has ? prev.classes.filter((c) => c !== cls) : [...prev.classes, cls];
      return { ...prev, classes };
    });
  };

  const updateStop = (index: number, field: keyof TrainScheduleStop, value: string | number | null) => {
    setForm((prev) => {
      const schedule = [...prev.schedule];
      schedule[index] = { ...schedule[index], [field]: value };
      const next: Train = { ...prev, schedule };

      if (field === "stationCode" && typeof value === "string") {
        if (index === 0) next.source = value;
        if (index === schedule.length - 1) next.destination = value;
      }

      return next;
    });
  };

  const addStop = () => {
    if (form.schedule.length >= 20) {
      setError("Maximum 20 stops allowed");
      return;
    }
    setForm((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule.slice(0, -1),
        { stationCode: "", arrival: "00:00", departure: "00:05", day: 1, distance: 0 },
        prev.schedule[prev.schedule.length - 1], // Re-add destination as last stop
      ],
    }));
    setError("");
  };

  const extendRoute = () => {
    if (form.schedule.length >= 20) {
      setError("Maximum 20 stops allowed");
      return;
    }
    setForm((prev) => ({
      ...prev,
      destination: "",
      schedule: [
        ...prev.schedule,
        { stationCode: "", arrival: "00:00", departure: null, day: 1, distance: 0 },
      ],
    }));
    setError("");
  };

  const removeStop = (index: number) => {
    if (form.schedule.length <= 2) {
      setError("Need at least 2 stops (source and destination)");
      return;
    }
    if (index === 0 || index === form.schedule.length - 1) {
      setError("Cannot delete source or destination stations");
      return;
    }
    setForm((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
    setError("");
  };

  const handleSave = async () => {
    if (!form.number.trim() || !form.name.trim()) {
      setError("Train number and name are required");
      return;
    }
    if (form.classes.length === 0) {
      setError("Select at least one class");
      return;
    }
    if (form.runsOn.length === 0) {
      setError("Select at least one running day");
      return;
    }
    if (!editingNumber && trains.some((t) => t.number === form.number)) {
      setError("Train number already exists");
      return;
    }

    if (form.schedule.length < 2) {
      setError("Train must have at least 2 stops");
      return;
    }

    const hasMissingStation = form.schedule.some((stop) => !stop.stationCode);
    if (hasMissingStation) {
      setError("All stops must have a station selected");
      return;
    }

    try {
      const { baseFares: _removed, ...trainWithoutFares } = form;
      await saveTrain({
        ...trainWithoutFares,
        number: form.number.trim(),
        source: form.schedule[0].stationCode,
        destination: form.schedule[form.schedule.length - 1].stationCode,
      });
      setShowForm(false);
      setEditingNumber(null);
      setError("");
    } catch {
      setError("Failed to save train");
    }
  };

  const filteredTrains = trains.filter(
    (train) =>
      train.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      train.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formStations = stations.filter((s) => {
    const network = form.category ?? "intercity";
    return (s.network ?? "intercity") === network;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {filteredTrains.length} of {trains.length} trains
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Train
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-5"
        >
          <h3 className="font-semibold">{editingNumber ? "Edit Train" : "New Train"}</h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Train Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} disabled={!!editingNumber} />
            <Input label="Train Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <select
                value={form.category ?? "intercity"}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as TrainCategory })
                }
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5"
              >
                {(Object.keys(NETWORK_LABELS) as TrainCategory[]).map((category) => (
                  <option key={category} value={category}>
                    {NETWORK_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Source</label>
              <select 
                value={form.source} 
                onChange={(e) => {
                  const newSource = e.target.value;
                  setForm((prev) => {
                    const schedule = [...prev.schedule];
                    schedule[0] = { ...schedule[0], stationCode: newSource };
                    return { ...prev, source: newSource, schedule };
                  });
                }} 
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5"
              >
                {formStations.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Destination</label>
              <select 
                value={form.destination} 
                onChange={(e) => {
                  const newDest = e.target.value;
                  setForm((prev) => {
                    const schedule = [...prev.schedule];
                    schedule[schedule.length - 1] = { ...schedule[schedule.length - 1], stationCode: newDest };
                    return { ...prev, destination: newDest, schedule };
                  });
                }} 
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5"
              >
                <option value="" disabled>Select destination...</option>
                {formStations.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <Input label="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            <Input label="Departure" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} />
            <Input label="Arrival" value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Runs On</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button key={day} type="button" onClick={() => toggleDay(day)} className={`rounded-lg px-3 py-1 text-xs font-medium ${form.runsOn.includes(day) ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-muted"}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Classes</p>
            <p className="mb-3 text-xs text-muted">
              Fares are computed automatically from distance, class, train type, and demand.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_CLASSES.map((cls) => (
                <label key={cls} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <input type="checkbox" checked={form.classes.includes(cls)} onChange={() => toggleClass(cls)} />
                  <span className="flex-1 text-sm">{CLASS_LABELS[cls]}</span>
                </label>
              ))}
            </div>
            {form.classes.length > 0 && form.schedule.length >= 2 && (
              <div className="mt-4 rounded-xl border border-border bg-foreground/5 p-4">
                <p className="text-sm font-medium">Sample fares (full route, today)</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {form.classes.map((cls) => {
                    const preview = getFareBreakdown(
                      form,
                      form.schedule[0].stationCode,
                      form.schedule[form.schedule.length - 1].stationCode,
                      cls,
                      new Date().toISOString().split("T")[0]
                    );
                    return (
                      <li key={cls}>
                        {CLASS_LABELS[cls]}: {formatCurrency(preview.baseFare)}
                        <span className="text-xs"> ({preview.distanceKm} km)</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Schedule Stops</p>
                <p className="text-xs text-muted mt-1">{form.schedule.length} stops configured</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={addStop}>
                  <Plus className="h-4 w-4" />
                  Add Stop
                </Button>
                <Button size="sm" variant="outline" onClick={extendRoute}>
                  <Plus className="h-4 w-4" />
                  Extend Route
                </Button>
              </div>
            </div>

            {/* Column Headers */}
            <div className="mb-2 px-3 py-2 grid gap-2 sm:grid-cols-6 text-xs font-semibold text-muted">
              <div className="sm:col-span-2">Station</div>
              <div>Arrival</div>
              <div>Departure</div>
              <div>Day</div>
              <div className="flex justify-between">
                <span>Distance</span>
                <span>Action</span>
              </div>
            </div>

            {/* Stops List */}
            <div className="space-y-2">
              {form.schedule.map((stop, index) => {
                const isSource = index === 0;
                const isDestination = index === form.schedule.length - 1;
                const stationName = stations.find((s) => s.code === stop.stationCode)?.name || "Unknown";

                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 transition-colors ${
                      isSource || isDestination
                        ? "border-primary/30 bg-primary/5"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    {/* Stop Header with Type Badge */}
                    {(isSource || isDestination) && (
                      <div className="mb-2 flex gap-2">
                        {isSource && <span className="text-xs font-semibold rounded-full bg-success/20 text-success px-2 py-0.5">SOURCE</span>}
                        {isDestination && <span className="text-xs font-semibold rounded-full bg-warning/20 text-warning px-2 py-0.5">DESTINATION</span>}
                      </div>
                    )}

                    {/* Stop Details Grid */}
                    <div className="grid gap-2 sm:grid-cols-6 items-end">
                      {/* Station Selection */}
                      <div className="sm:col-span-2">
                        <select
                          value={stop.stationCode}
                          onChange={(e) => updateStop(index, "stationCode", e.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium"
                        >
                          <option value="" disabled>Select station...</option>
                          {formStations.map((s) => (
                            <option key={s.code} value={s.code}>
                              {s.code} - {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Arrival Time */}
                      <div>
                        <label className="text-xs text-muted block mb-1">Arrival</label>
                        <Input
                          type="time"
                          placeholder="--:--"
                          value={stop.arrival ?? ""}
                          onChange={(e) => updateStop(index, "arrival", e.target.value || null)}
                          className="text-sm"
                          disabled={isSource}
                          title={isSource ? "Source station has no arrival" : ""}
                        />
                      </div>

                      {/* Departure Time */}
                      <div>
                        <label className="text-xs text-muted block mb-1">Departure</label>
                        <Input
                          type="time"
                          placeholder="--:--"
                          value={stop.departure ?? ""}
                          onChange={(e) => updateStop(index, "departure", e.target.value || null)}
                          className="text-sm"
                        />
                      </div>

                      {/* Day */}
                      <div>
                        <label className="text-xs text-muted block mb-1">Day</label>
                        <Input
                          type="number"
                          min={1}
                          max={7}
                          value={stop.day}
                          onChange={(e) => updateStop(index, "day", Number(e.target.value))}
                          className="text-sm"
                        />
                      </div>

                      {/* Distance & Delete */}
                      <div className="flex gap-1">
                        <div className="flex-1">
                          <label className="text-xs text-muted block mb-1">Km</label>
                          <Input
                            type="number"
                            min={0}
                            value={stop.distance}
                            onChange={(e) => updateStop(index, "distance", Number(e.target.value))}
                            className="text-sm"
                            disabled={isSource}
                            title={isSource ? "Source distance is 0" : ""}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeStop(index);
                          }}
                          disabled={form.schedule.length <= 2 || isSource || isDestination}
                          className="rounded-lg p-2 text-danger hover:bg-danger/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
                          title={
                            form.schedule.length <= 2
                              ? "Need at least 2 stops"
                              : isSource || isDestination
                                ? "Cannot delete source/destination"
                                : "Delete stop"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stop Info Row */}
                    <div className="mt-2 text-xs text-muted">
                      Stop {index + 1} of {form.schedule.length} • {stationName}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 p-3 rounded-lg bg-foreground/5 text-xs text-muted space-y-1">
              <p className="font-medium text-foreground">Legend:</p>
              <ul className="space-y-1 pl-2">
                <li>• <strong>SOURCE</strong> - Starting station (no arrival time)</li>
                <li>• <strong>DESTINATION</strong> - Final station (no departure time)</li>
                <li>• <strong>Day</strong> - Day number in journey (1 = start date)</li>
                <li>• <strong>Km</strong> - Cumulative distance from source</li>
              </ul>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save Train</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setError(""); }}>Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <Input
          placeholder="Search by train name or number..."
          className="w-full pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredTrains.map((train) => (
          <div key={train.number} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{train.number}</Badge>
                <span className="font-semibold">{train.name}</span>
                <Badge>{train.type}</Badge>
                <Badge variant="default">
                  {NETWORK_LABELS[train.category ?? "intercity"]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted">
                {train.source} → {train.destination} · {train.departureTime}–{train.arrivalTime} · {train.schedule.length} stops
              </p>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => openEdit(train)} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => void deleteTrain(train.number)} className="rounded-lg p-2 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
