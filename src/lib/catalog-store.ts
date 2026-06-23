"use client";

import { SEED_STATIONS, SEED_TRAINS } from "@/data/seed-data";
import type { Station, Train } from "@/types";

export interface Catalog {
  stations: Station[];
  trains: Train[];
}

const listeners = new Set<() => void>();
const serverSnapshot: Catalog = { stations: SEED_STATIONS, trains: SEED_TRAINS };
let cache: Catalog = { stations: SEED_STATIONS, trains: SEED_TRAINS };
let loading = false;
let loaded = false;

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeCatalog(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCatalogSnapshot(): Catalog {
  return cache;
}

export function getCatalogServerSnapshot(): Catalog {
  return serverSnapshot;
}

export function isCatalogLoaded() {
  return loaded;
}

export async function loadCatalog(): Promise<Catalog> {
  if (loading) return cache;
  loading = true;
  try {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    if (res.ok) {
      cache = await res.json();
      loaded = true;
      notify();
    }
  } finally {
    loading = false;
  }
  return cache;
}

export function getStations(): Station[] {
  return cache.stations;
}

export function getTrains(): Train[] {
  return cache.trains;
}

export function getStation(code: string): Station | undefined {
  return cache.stations.find((s) => s.code === code);
}

export function getStationLabel(code: string): string {
  const station = getStation(code);
  return station ? `${station.name} (${station.code})` : code;
}

export async function saveStation(station: Station): Promise<void> {
  const res = await fetch("/api/catalog", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "station", data: station }),
  });
  if (!res.ok) throw new Error("Failed to save station");
  cache = await res.json();
  notify();
}

export async function deleteStation(code: string): Promise<boolean> {
  const res = await fetch(`/api/catalog?station=${encodeURIComponent(code)}`, {
    method: "DELETE",
  });
  if (res.status === 409) return false;
  if (!res.ok) throw new Error("Failed to delete station");
  cache = await res.json();
  notify();
  return true;
}

export async function saveTrain(train: Train): Promise<void> {
  const res = await fetch("/api/catalog", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "train", data: train }),
  });
  if (!res.ok) throw new Error("Failed to save train");
  cache = await res.json();
  notify();
}

export async function deleteTrain(number: string): Promise<void> {
  const res = await fetch(`/api/catalog?train=${encodeURIComponent(number)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete train");
  cache = await res.json();
  notify();
}

export async function deleteTrainStop(trainNumber: string, stopIndex: number): Promise<void> {
  const res = await fetch(
    `/api/catalog?train=${encodeURIComponent(trainNumber)}&stopIndex=${stopIndex}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete stop");
  }
  cache = await res.json();
  notify();
}
