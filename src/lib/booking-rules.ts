import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

export const EDIT_CANCEL_CUTOFF_DAYS = 2;

export function canModifyReservation(travelDate: string): boolean {
  const today = startOfDay(new Date());
  const travel = startOfDay(parseISO(travelDate));
  const daysUntilTravel = differenceInCalendarDays(travel, today);
  return daysUntilTravel > EDIT_CANCEL_CUTOFF_DAYS;
}

export function getModificationDeadline(travelDate: string): string {
  const travel = startOfDay(parseISO(travelDate));
  const deadline = new Date(travel);
  deadline.setDate(deadline.getDate() - EDIT_CANCEL_CUTOFF_DAYS);
  return deadline.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
