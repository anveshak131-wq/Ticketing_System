"use client";

import { getStations, getTrains, getStation, getStationLabel } from "@/lib/catalog-store";
import type { TrainSearchResult, TravelClass } from "@/types";

function hashAvailability(seed: string, travelClass: TravelClass): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const base = Math.abs(hash % 40) + 5;
  const classMultiplier: Record<TravelClass, number> = {
    SL: 1,
    "2S": 0.9,
    "3A": 0.6,
    "2A": 0.35,
    "1A": 0.15,
    CC: 0.5,
  };
  return Math.max(0, Math.floor(base * classMultiplier[travelClass]));
}

export function searchTrains(
  from: string,
  to: string,
  date: string
): TrainSearchResult[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = dayNames[new Date(date + "T12:00:00").getDay()];

  return getTrains()
    .filter((train) => {
      const fromIdx = train.schedule.findIndex((s) => s.stationCode === from);
      const toIdx = train.schedule.findIndex((s) => s.stationCode === to);
      if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return false;
      return train.runsOn.includes(dayOfWeek);
    })
    .map((train) => {
      const availableSeats: Partial<Record<TravelClass, number>> = {};
      const fare: Partial<Record<TravelClass, number>> = {};
      const seed = `${train.number}-${from}-${to}-${date}`;

      for (const cls of train.classes) {
        availableSeats[cls] = hashAvailability(seed + cls, cls);
        fare[cls] = train.baseFares[cls] ?? 0;
      }

      return { ...train, availableSeats, fare };
    });
}

export { getStations, getTrains, getStation, getStationLabel };
