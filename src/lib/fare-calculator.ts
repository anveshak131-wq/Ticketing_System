import { getTrainCategory } from "@/lib/station-utils";
import type { Train, TrainCategory, TravelClass } from "@/types";

/** Per-km tariff (INR) before class and train-type adjustments */
const CATEGORY_KM_RATES: Record<TrainCategory, number> = {
  intercity: 1.05,
  metro: 1.8,
  local: 0.9,
};

const CLASS_MULTIPLIERS: Record<TravelClass, number> = {
  SL: 0.48,
  "2S": 0.38,
  "3A": 1,
  "2A": 1.58,
  "1A": 2.85,
  CC: 0.72,
};

const TRAIN_TYPE_MULTIPLIERS: Record<string, number> = {
  Rajdhani: 1.35,
  Shatabdi: 1.28,
  Duronto: 1.22,
  Superfast: 1.1,
  Metro: 1,
  Local: 1,
};

const MIN_FARE: Record<TrainCategory, number> = {
  intercity: 50,
  metro: 10,
  local: 5,
};

export interface FareBreakdown {
  distanceKm: number;
  category: TrainCategory;
  classMultiplier: number;
  trainTypeMultiplier: number;
  timeMultiplier: number;
  baseFare: number;
}

function getTrainTypeMultiplier(trainType: string): number {
  return TRAIN_TYPE_MULTIPLIERS[trainType] ?? 1;
}

export function getScheduleSegmentDistance(
  train: Train,
  from: string,
  to: string
): number | null {
  const fromIdx = train.schedule.findIndex((s) => s.stationCode === from);
  const toIdx = train.schedule.findIndex((s) => s.stationCode === to);
  if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return null;

  const fromDist = train.schedule[fromIdx].distance;
  const toDist = train.schedule[toIdx].distance;
  return toDist - fromDist;
}

function getSegmentDistanceKm(train: Train, from: string, to: string): number {
  const segment = getScheduleSegmentDistance(train, from, to);
  if (segment !== null && segment > 0) return segment;

  const total =
    train.schedule[train.schedule.length - 1].distance - train.schedule[0].distance;
  return total > 0 ? total : 0;
}

/**
 * Peak/off-peak and weekend demand — no manual admin input required.
 */
export function getTimeDemandMultiplier(
  category: TrainCategory,
  departureTime: string,
  travelDate: string
): number {
  const hour = Number.parseInt(departureTime.split(":")[0] ?? "0", 10);
  const day = new Date(`${travelDate}T12:00:00`).getDay();
  const isWeekend = day === 0 || day === 6;

  if (category === "metro" || category === "local") {
    const isPeak = (hour >= 7 && hour < 10) || (hour >= 17 && hour < 20);
    return isPeak ? 1.15 : 0.95;
  }

  if (isWeekend) return 1.08;
  if (hour >= 22 || hour < 5) return 0.92;
  return 1;
}

export function getFareBreakdown(
  train: Train,
  from: string,
  to: string,
  cls: TravelClass,
  travelDate?: string
): FareBreakdown {
  const category = getTrainCategory(train);
  const distanceKm = getSegmentDistanceKm(train, from, to);
  const classMultiplier = CLASS_MULTIPLIERS[cls];
  const trainTypeMultiplier = getTrainTypeMultiplier(train.type);
  const timeMultiplier = travelDate
    ? getTimeDemandMultiplier(category, train.departureTime, travelDate)
    : 1;

  const raw =
    distanceKm * CATEGORY_KM_RATES[category] * classMultiplier * trainTypeMultiplier;
  const baseFare = Math.max(MIN_FARE[category], Math.round(raw * timeMultiplier));

  return {
    distanceKm,
    category,
    classMultiplier,
    trainTypeMultiplier,
    timeMultiplier,
    baseFare,
  };
}

/**
 * Computed ticket price from route distance, class, train type, category, and time demand.
 */
export function calculateComputedFare(
  train: Train,
  from: string,
  to: string,
  cls: TravelClass,
  travelDate?: string
): number {
  return getFareBreakdown(train, from, to, cls, travelDate).baseFare;
}
