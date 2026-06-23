import type {
  BerthPreference,
  BerthType,
  Passenger,
  Reservation,
  SeatInventory,
  Train,
  TravelClass,
} from "@/types";
import { initializeSeatInventory } from "@/lib/seat-management";

const ACTIVE_BOOKING_STATUSES = new Set<Reservation["status"]>([
  "confirmed",
  "modified",
]);

const BERTH_FILL_ORDER: BerthType[] = ["LB", "MB", "UB", "SL", "SU", "SEAT"];

function isBerthType(value: string): value is BerthType {
  return ["UB", "MB", "LB", "SU", "SL", "SEAT"].includes(value);
}

export function berthPreferenceToType(
  preference: BerthPreference
): BerthType | undefined {
  return preference === "none" ? undefined : preference;
}

function getInventoryByBerth(inventory: SeatInventory[], berthType: BerthType) {
  return inventory.find((item) => item.berthType === berthType);
}

function getAvailableInBerth(inventory: SeatInventory[], berthType: BerthType) {
  const item = getInventoryByBerth(inventory, berthType);
  return item ? Math.max(0, item.total - item.booked - item.blocked) : 0;
}

function markBooked(inventory: SeatInventory[], berthType: BerthType): boolean {
  const item = getInventoryByBerth(inventory, berthType);
  if (!item || getAvailableInBerth(inventory, berthType) <= 0) return false;
  item.booked += 1;
  return true;
}

function markNextAvailableBooked(inventory: SeatInventory[]): boolean {
  const berthTypes = inventory
    .map((item) => item.berthType)
    .sort(
      (a, b) =>
        BERTH_FILL_ORDER.indexOf(a) - BERTH_FILL_ORDER.indexOf(b)
    );

  for (const berthType of berthTypes) {
    if (markBooked(inventory, berthType)) return true;
  }

  return false;
}

function applyReservationToInventory(
  inventory: SeatInventory[],
  reservation: Reservation
) {
  if (reservation.seats?.length) {
    reservation.seats.forEach((seat) => {
      const [berthType] = seat.split("-");
      if (isBerthType(berthType)) {
        markBooked(inventory, berthType);
      } else {
        markNextAvailableBooked(inventory);
      }
    });
    return;
  }

  reservation.passengers.forEach((passenger) => {
    const preferredBerth = berthPreferenceToType(passenger.berthPreference);
    if (preferredBerth && markBooked(inventory, preferredBerth)) return;
    markNextAvailableBooked(inventory);
  });
}

export function buildSeatInventory(
  train: Train,
  travelClass: TravelClass,
  travelDate: string,
  reservations: Reservation[] = []
): SeatInventory[] {
  const inventory = initializeSeatInventory(train, travelClass, travelDate);

  reservations
    .filter(
      (reservation) =>
        reservation.trainNumber === train.number &&
        reservation.travelDate === travelDate &&
        reservation.travelClass === travelClass &&
        ACTIVE_BOOKING_STATUSES.has(reservation.status)
    )
    .forEach((reservation) => applyReservationToInventory(inventory, reservation));

  return inventory;
}

export function buildBerthPreferenceCounts(
  passengers: Passenger[]
): Partial<Record<BerthType, number>> {
  return passengers.reduce<Partial<Record<BerthType, number>>>((counts, passenger) => {
    const berthType = berthPreferenceToType(passenger.berthPreference);
    if (!berthType) return counts;
    counts[berthType] = (counts[berthType] ?? 0) + 1;
    return counts;
  }, {});
}
