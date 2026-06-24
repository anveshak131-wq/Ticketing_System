export {
  calculateComputedFare,
  getFareBreakdown,
  getScheduleSegmentDistance,
  getTimeDemandMultiplier,
} from "@/lib/fare-calculator";
import { calculateComputedFare } from "@/lib/fare-calculator";
import type { Train, TravelClass } from "@/types";

export function calculateRouteFare(
  train: Train,
  from: string,
  to: string,
  cls: TravelClass,
  travelDate?: string
): number {
  return calculateComputedFare(train, from, to, cls, travelDate);
}
