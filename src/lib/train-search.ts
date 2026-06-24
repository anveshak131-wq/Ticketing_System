"use client";

import { getStations, getTrains, getStation, getStationLabel } from "@/lib/catalog-store";
import { calculateDynamicPrice } from "@/lib/pricing-engine";
import { calculateRouteFare } from "@/lib/segment-fare";
import { getTrainCategory } from "@/lib/station-utils";
import { buildSeatInventory } from "@/lib/seat-availability";
import {
  calculateOccupancyRate,
  getAvailableSeats,
  getAvailableSeatsByBerth,
} from "@/lib/seat-management";
import { expandUrbanServices } from "@/lib/urban-service-schedule";
import type { Reservation, Train, TrainCategory, TrainSearchResult, TravelClass } from "@/types";

export interface TrainSearchOptions {
  category?: TrainCategory;
  /** Show departures from this time onward (metro/local) */
  preferredTime?: string;
  maxResults?: number;
}

function enrichTrainResult(
  train: Train,
  from: string,
  to: string,
  date: string,
  reservations: Reservation[],
  serviceKey?: string
): TrainSearchResult {
  const availableSeats: Partial<Record<TravelClass, number>> = {};
  const availableBerths: TrainSearchResult["availableBerths"] = {};
  const fare: Partial<Record<TravelClass, number>> = {};
  const dynamicPrice: Partial<Record<TravelClass, number>> = {};
  const occupancyRateByClass: TrainSearchResult["occupancyRateByClass"] = {};
  let waitlistCount = 0;

  for (const cls of train.classes) {
    const inventory = buildSeatInventory(
      train,
      cls,
      date,
      reservations,
      train.departureTime
    );
    const routeFare = calculateRouteFare(train, from, to, cls, date);
    const occupancyRate = calculateOccupancyRate(inventory);

    availableSeats[cls] = getAvailableSeats(inventory);
    availableBerths[cls] = getAvailableSeatsByBerth(inventory);
    fare[cls] = routeFare;
    dynamicPrice[cls] = calculateDynamicPrice(routeFare, occupancyRate);
    occupancyRateByClass[cls] = occupancyRate;
    waitlistCount += inventory.reduce((sum, item) => sum + item.waitlisted, 0);
  }

  const occupancyValues = Object.values(occupancyRateByClass);
  const occupancyRate = occupancyValues.length
    ? Math.round(
        occupancyValues.reduce((sum, rate) => sum + rate, 0) / occupancyValues.length
      )
    : 0;

  return {
    ...train,
    serviceKey,
    availableSeats,
    availableBerths,
    fare,
    dynamicPrice,
    occupancyRate,
    occupancyRateByClass,
    waitlistCount,
  };
}

export function searchTrains(
  from: string,
  to: string,
  date: string,
  reservations: Reservation[] = [],
  options?: TrainSearchOptions
): TrainSearchResult[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = dayNames[new Date(date + "T12:00:00").getDay()];

  const matchingRoutes = getTrains().filter((train) => {
    if (options?.category && getTrainCategory(train) !== options.category) {
      return false;
    }
    const fromIdx = train.schedule.findIndex((s) => s.stationCode === from);
    const toIdx = train.schedule.findIndex((s) => s.stationCode === to);
    if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return false;
    return train.runsOn.includes(dayOfWeek);
  });

  const category = options?.category;
  const isUrbanSearch = category === "metro" || category === "local";

  if (isUrbanSearch) {
    const maxResults = options?.maxResults ?? 24;
    return matchingRoutes.flatMap((train) =>
      expandUrbanServices(
        train,
        date,
        from,
        to,
        options?.preferredTime,
        maxResults
      ).map((serviceTrain) =>
        enrichTrainResult(
          serviceTrain,
          from,
          to,
          date,
          reservations,
          `${train.number}:${serviceTrain.departureTime}`
        )
      )
    );
  }

  return matchingRoutes.map((train) => enrichTrainResult(train, from, to, date, reservations));
}

export { getStations, getTrains, getStation, getStationLabel };
