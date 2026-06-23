"use client";

import { SEED_STATIONS, SEED_TRAINS } from "@/data/seed-data";
import { createStore } from "@/lib/storage";
import type { Station, Train } from "@/types";

const CATALOG_KEY = "ir-demo-catalog";

interface Catalog {
  stations: Station[];
  trains: Train[];
}

const catalogStore = createStore<Catalog>(CATALOG_KEY, () => ({
  stations: SEED_STATIONS,
  trains: SEED_TRAINS,
}));

export function subscribeCatalog(listener: () => void) {
  return catalogStore.subscribe(listener);
}

export function getCatalogSnapshot(): Catalog {
  return catalogStore.getSnapshot();
}

export function getCatalogServerSnapshot(): Catalog {
  return catalogStore.getServerSnapshot();
}

export function getStations(): Station[] {
  return catalogStore.read().stations;
}

export function getTrains(): Train[] {
  return catalogStore.read().trains;
}

export function getStation(code: string): Station | undefined {
  return getStations().find((s) => s.code === code);
}

export function getStationLabel(code: string): string {
  const station = getStation(code);
  return station ? `${station.name} (${station.code})` : code;
}

export function saveStation(station: Station): void {
  const catalog = catalogStore.read();
  const index = catalog.stations.findIndex((s) => s.code === station.code);
  if (index >= 0) {
    catalog.stations[index] = station;
  } else {
    catalog.stations.push(station);
  }
  catalog.stations.sort((a, b) => a.code.localeCompare(b.code));
  catalogStore.write({ ...catalog });
}

export function deleteStation(code: string): boolean {
  const catalog = catalogStore.read();
  const usedByTrain = catalog.trains.some(
    (t) =>
      t.source === code ||
      t.destination === code ||
      t.schedule.some((s) => s.stationCode === code)
  );
  if (usedByTrain) return false;
  catalogStore.write({
    ...catalog,
    stations: catalog.stations.filter((s) => s.code !== code),
  });
  return true;
}

export function saveTrain(train: Train): void {
  const catalog = catalogStore.read();
  const index = catalog.trains.findIndex((t) => t.number === train.number);
  if (index >= 0) {
    catalog.trains[index] = train;
  } else {
    catalog.trains.push(train);
  }
  catalog.trains.sort((a, b) => a.number.localeCompare(b.number));
  catalogStore.write({ ...catalog });
}

export function deleteTrain(number: string): void {
  const catalog = catalogStore.read();
  catalogStore.write({
    ...catalog,
    trains: catalog.trains.filter((t) => t.number !== number),
  });
}
