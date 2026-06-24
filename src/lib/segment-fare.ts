import type { Train, TravelClass } from "@/types";
import { getTrainCategory } from "@/lib/station-utils";

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

export function calculateRouteFare(
  train: Train,
  from: string,
  to: string,
  cls: TravelClass
): number {
  const baseFare = train.baseFares[cls] ?? 0;
  const category = getTrainCategory(train);

  if (category === "intercity") {
    return baseFare;
  }

  const segmentDist = getScheduleSegmentDistance(train, from, to);
  const totalDist =
    train.schedule[train.schedule.length - 1].distance - train.schedule[0].distance;

  if (!segmentDist || totalDist <= 0) {
    return baseFare;
  }

  return Math.max(10, Math.round((baseFare * segmentDist) / totalDist));
}
