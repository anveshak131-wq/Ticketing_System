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
import type { Reservation, TrainCategory, TrainSearchResult, TravelClass } from "@/types";

export interface TrainSearchOptions {
  category?: TrainCategory;
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

  return getTrains()
    .filter((train) => {
      if (options?.category && getTrainCategory(train) !== options.category) {
        return false;
      }
      const fromIdx = train.schedule.findIndex((s) => s.stationCode === from);
      const toIdx = train.schedule.findIndex((s) => s.stationCode === to);
      if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return false;
      return train.runsOn.includes(dayOfWeek);
    })
    .map((train) => {
      const availableSeats: Partial<Record<TravelClass, number>> = {};
      const availableBerths: TrainSearchResult["availableBerths"] = {};
      const fare: Partial<Record<TravelClass, number>> = {};
      const dynamicPrice: Partial<Record<TravelClass, number>> = {};
      const occupancyRateByClass: TrainSearchResult["occupancyRateByClass"] = {};
      let waitlistCount = 0;

      for (const cls of train.classes) {
        const inventory = buildSeatInventory(train, cls, date, reservations);
        const routeFare = calculateRouteFare(train, from, to, cls);
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
            occupancyValues.reduce((sum, rate) => sum + rate, 0) /
              occupancyValues.length
          )
        : 0;

      return {
        ...train,
        availableSeats,
        availableBerths,
        fare,
        dynamicPrice,
        occupancyRate,
        occupancyRateByClass,
        waitlistCount,
      };
    });
}

export { getStations, getTrains, getStation, getStationLabel };
