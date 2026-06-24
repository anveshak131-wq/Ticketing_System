import type { LineStation, Train } from "@/types";

/** Flat fare charged for each station segment on metro/local lines */
export const URBAN_FARE_PER_STATION = 10;

export function calculateUrbanStationFare(
  stationsTraveled: number,
  rate = URBAN_FARE_PER_STATION
): number {
  return Math.max(1, stationsTraveled) * rate;
}

export function countScheduleStations(train: Train, from: string, to: string): number {
  const fromIdx = train.schedule.findIndex((s) => s.stationCode === from);
  const toIdx = train.schedule.findIndex((s) => s.stationCode === to);
  if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return 1;
  return toIdx - fromIdx;
}

export function countLineStations(
  lineStations: LineStation[],
  fromStation: string,
  toStation: string
): number {
  const from = lineStations.find((s) => s.stationCode === fromStation);
  const to = lineStations.find((s) => s.stationCode === toStation);
  if (!from || !to) {
    throw new Error("One or both stations not found on line");
  }
  return Math.abs(to.stopOrder - from.stopOrder);
}
