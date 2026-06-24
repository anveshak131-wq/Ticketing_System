import { formatDurationMinutes, minutesToTime, timeToMinutes } from "@/lib/time-utils";
import { getTrainCategory } from "@/lib/station-utils";
import type { Train, TrainCategory, TrainScheduleStop } from "@/types";

export interface UrbanServiceConfig {
  weekdayFirst: string;
  weekdayLast: string;
  sundayFirst: string;
  sundayLast: string;
  peakIntervalMinutes: number;
  offPeakIntervalMinutes: number;
}

/** Delhi Metro-style: ~5 AM–11:30 PM, every 2–5 min peak / 5–10 min off-peak */
export const DEFAULT_METRO_SERVICE: UrbanServiceConfig = {
  weekdayFirst: "05:00",
  weekdayLast: "23:30",
  sundayFirst: "08:00",
  sundayLast: "23:30",
  peakIntervalMinutes: 3,
  offPeakIntervalMinutes: 7,
};

/** Mumbai suburban-style: early start, frequent through the day */
export const DEFAULT_LOCAL_SERVICE: UrbanServiceConfig = {
  weekdayFirst: "04:30",
  weekdayLast: "23:45",
  sundayFirst: "06:00",
  sundayLast: "23:30",
  peakIntervalMinutes: 4,
  offPeakIntervalMinutes: 8,
};

function isPeakHour(minutes: number): boolean {
  const hour = Math.floor(minutes / 60);
  return (hour >= 7 && hour < 10) || (hour >= 17 && hour < 20);
}

function getServiceConfig(train: Train): UrbanServiceConfig {
  const category = getTrainCategory(train);
  const defaults = category === "local" ? DEFAULT_LOCAL_SERVICE : DEFAULT_METRO_SERVICE;

  return {
    weekdayFirst: train.firstService ?? defaults.weekdayFirst,
    weekdayLast: train.lastService ?? defaults.weekdayLast,
    sundayFirst: train.sundayFirstService ?? defaults.sundayFirst,
    sundayLast: train.lastService ?? defaults.sundayLast,
    peakIntervalMinutes: train.peakFrequencyMinutes ?? defaults.peakIntervalMinutes,
    offPeakIntervalMinutes: train.offPeakFrequencyMinutes ?? defaults.offPeakIntervalMinutes,
  };
}

function getTemplateBaseDeparture(train: Train): string {
  const firstStop = train.schedule[0];
  return firstStop?.departure ?? firstStop?.arrival ?? train.departureTime;
}

export function generateUrbanDepartureSlots(
  train: Train,
  travelDate: string
): string[] {
  const config = getServiceConfig(train);
  const day = new Date(`${travelDate}T12:00:00`).getDay();
  const isSunday = day === 0;
  const first = isSunday ? config.sundayFirst : config.weekdayFirst;
  const last = isSunday ? config.sundayLast : config.weekdayLast;

  const slots: string[] = [];
  let current = timeToMinutes(first);
  const end = timeToMinutes(last);

  while (current <= end) {
    slots.push(minutesToTime(current));
    current += isPeakHour(current)
      ? config.peakIntervalMinutes
      : config.offPeakIntervalMinutes;
  }

  return slots;
}

function shiftSchedule(
  schedule: TrainScheduleStop[],
  templateBaseDeparture: string,
  newBaseDeparture: string
): TrainScheduleStop[] {
  const delta = timeToMinutes(newBaseDeparture) - timeToMinutes(templateBaseDeparture);

  return schedule.map((stop) => ({
    ...stop,
    arrival: stop.arrival ? minutesToTime(timeToMinutes(stop.arrival) + delta) : null,
    departure: stop.departure
      ? minutesToTime(timeToMinutes(stop.departure) + delta)
      : null,
  }));
}

function getStopTime(stop: TrainScheduleStop): string | null {
  return stop.departure ?? stop.arrival;
}

export function buildUrbanServiceTrain(
  train: Train,
  travelDate: string,
  from: string,
  to: string,
  serviceDeparture: string
): Train {
  const templateBase = getTemplateBaseDeparture(train);
  const schedule = shiftSchedule(train.schedule, templateBase, serviceDeparture);

  const fromStop = schedule.find((stop) => stop.stationCode === from);
  const toStop = schedule.find((stop) => stop.stationCode === to);
  const segmentDeparture = fromStop ? getStopTime(fromStop) : serviceDeparture;
  const segmentArrival = toStop ? getStopTime(toStop) : train.arrivalTime;

  const durationMinutes =
    segmentDeparture && segmentArrival
      ? timeToMinutes(segmentArrival) - timeToMinutes(segmentDeparture)
      : 0;

  return {
    ...train,
    schedule,
    departureTime: segmentDeparture ?? serviceDeparture,
    arrivalTime: segmentArrival ?? train.arrivalTime,
    duration: formatDurationMinutes(Math.max(1, durationMinutes)),
  };
}

export function expandUrbanServices(
  train: Train,
  travelDate: string,
  from: string,
  to: string,
  preferredTime?: string,
  maxResults = 24
): Train[] {
  const slots = generateUrbanDepartureSlots(train, travelDate);
  const templateBase = getTemplateBaseDeparture(train);
  const fromIdx = train.schedule.findIndex((stop) => stop.stationCode === from);
  const baseFromOffset =
    fromIdx >= 0
      ? timeToMinutes(getStopTime(train.schedule[fromIdx]) ?? templateBase) -
        timeToMinutes(templateBase)
      : 0;

  const minDeparture = preferredTime
    ? timeToMinutes(preferredTime)
    : timeToMinutes(getServiceConfig(train).weekdayFirst);

  const filtered = slots
    .map((slot) => {
      const boardingTime = timeToMinutes(slot) + baseFromOffset;
      return { slot, boardingTime };
    })
    .filter(({ boardingTime }) => boardingTime >= minDeparture)
    .slice(0, maxResults);

  return filtered.map(({ slot }) =>
    buildUrbanServiceTrain(train, travelDate, from, to, slot)
  );
}

export function getUrbanServiceSummary(category: TrainCategory): string {
  const config = category === "local" ? DEFAULT_LOCAL_SERVICE : DEFAULT_METRO_SERVICE;
  return `Services every ${config.peakIntervalMinutes}–${config.offPeakIntervalMinutes} min (${config.weekdayFirst}–${config.weekdayLast})`;
}
