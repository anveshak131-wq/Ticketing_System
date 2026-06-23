"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCatalog } from "@/hooks/use-catalog";
import { deleteTrain, saveTrain } from "@/lib/catalog-store";
import { CLASS_LABELS, type Train, type TrainScheduleStop, type TravelClass } from "@/types";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ALL_CLASSES = Object.keys(CLASS_LABELS) as TravelClass[];

function emptyTrain(): Train {
  return {
    number: "",
    name: "",
    type: "Superfast",
    source: "NDLS",
    destination: "BCT",
    departureTime: "06:00",
    arrivalTime: "12:00",
    duration: "6h 00m",
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    classes: ["3A"],
    baseFares: { "3A": 1000 },
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
      const baseFares = { ...prev.baseFares };
      if (!has) baseFares[cls] = baseFares[cls] ?? 500;
      if (has) delete baseFares[cls];
      return { ...prev, classes, baseFares };
    });
  };

  const updateStop = (index: number, field: keyof TrainScheduleStop, value: string | number | null) => {
    setForm((prev) => {
      const schedule = [...prev.schedule];
      schedule[index] = { ...schedule[index], [field]: value };
      return { ...prev, schedule };
    });
  };

  const addStop = () => {
    setForm((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        { stationCode: stations[0]?.code ?? "NDLS", arrival: "00:00", departure: "00:05", day: 1, distance: 0 },
      ],
    }));
  };

  const removeStop = (index: number) => {
    if (form.schedule.length <= 2) return;
    setForm((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
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

    saveTrain({ ...form, number: form.number.trim() });
    setShowForm(false);
    setEditingNumber(null);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{trains.length} trains</p>
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
              <label className="mb-1.5 block text-sm font-medium">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full rounded-xl border border-border bg-card px-4 py-2.5">
                {stations.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Destination</label>
              <select value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="w-full rounded-xl border border-border bg-card px-4 py-2.5">
                {stations.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
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
            <p className="mb-2 text-sm font-medium">Classes & Fares</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_CLASSES.map((cls) => (
                <label key={cls} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <input type="checkbox" checked={form.classes.includes(cls)} onChange={() => toggleClass(cls)} />
                  <span className="flex-1 text-sm">{CLASS_LABELS[cls]}</span>
                  {form.classes.includes(cls) && (
                    <input
                      type="number"
                      className="w-20 rounded-lg border border-border bg-card px-2 py-1 text-sm"
                      value={form.baseFares[cls] ?? 0}
                      onChange={(e) => setForm({ ...form, baseFares: { ...form.baseFares, [cls]: Number(e.target.value) } })}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Schedule Stops</p>
              <Button size="sm" variant="outline" onClick={addStop}>Add Stop</Button>
            </div>
            <div className="space-y-2">
              {form.schedule.map((stop, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-6">
                  <select value={stop.stationCode} onChange={(e) => updateStop(index, "stationCode", e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm sm:col-span-2">
                    {stations.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
                  </select>
                  <Input placeholder="Arrival" value={stop.arrival ?? ""} onChange={(e) => updateStop(index, "arrival", e.target.value || null)} />
                  <Input placeholder="Departure" value={stop.departure ?? ""} onChange={(e) => updateStop(index, "departure", e.target.value || null)} />
                  <Input type="number" placeholder="Day" value={stop.day} onChange={(e) => updateStop(index, "day", Number(e.target.value))} />
                  <div className="flex gap-1">
                    <Input type="number" placeholder="Km" value={stop.distance} onChange={(e) => updateStop(index, "distance", Number(e.target.value))} />
                    <button type="button" onClick={() => removeStop(index)} className="rounded-lg p-2 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save Train</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setError(""); }}>Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {trains.map((train) => (
          <div key={train.number} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{train.number}</Badge>
                <span className="font-semibold">{train.name}</span>
                <Badge>{train.type}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">
                {train.source} → {train.destination} · {train.departureTime}–{train.arrivalTime} · {train.schedule.length} stops
              </p>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => openEdit(train)} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => deleteTrain(train.number)} className="rounded-lg p-2 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
