import type { SeatInventory, TravelClass, BerthType, Train } from "@/types";

/**
 * Initialize seat inventory for a train and date
 */
export function initializeSeatInventory(
  train: Train,
  travelClass: TravelClass,
  travelDate: string
): SeatInventory[] {
  const inventory: SeatInventory[] = [];
  const capacity = train.seatCapacity?.[travelClass];

  if (!capacity) {
    console.warn(`No seat capacity defined for ${train.number} - ${travelClass}`);
    return [];
  }

  Object.entries(capacity).forEach(([berthType, total]) => {
    inventory.push({
      trainNumber: train.number,
      travelDate,
      class: travelClass,
      berthType: berthType as BerthType,
      total: total as number,
      booked: 0,
      blocked: 0,
      waitlisted: 0,
    });
  });

  return inventory;
}

/**
 * Get available seats for a given class and berth type
 */
export function getAvailableSeats(inventory: SeatInventory[]): number {
  return inventory.reduce((total, inv) => total + (inv.total - inv.booked - inv.blocked), 0);
}

/**
 * Get available seats by berth type
 */
export function getAvailableSeatsByBerth(
  inventory: SeatInventory[]
): Partial<Record<BerthType, number>> {
  const available: Partial<Record<BerthType, number>> = {};

  inventory.forEach((inv) => {
    available[inv.berthType] = (available[inv.berthType] || 0) + (inv.total - inv.booked - inv.blocked);
  });

  return available;
}

/**
 * Calculate occupancy rate as percentage
 */
export function calculateOccupancyRate(inventory: SeatInventory[]): number {
  const totalCapacity = inventory.reduce((sum, inv) => sum + inv.total, 0);
  const totalBooked = inventory.reduce((sum, inv) => sum + inv.booked, 0);

  if (totalCapacity === 0) return 0;
  return Math.round((totalBooked / totalCapacity) * 100);
}

/**
 * Book seats
 */
export function bookSeats(
  inventory: SeatInventory[],
  passengerCount: number,
  berthPreferences?: Partial<Record<BerthType, number>>
): { success: boolean; bookedSeats: string[]; message: string } {
  const totalAvailable = getAvailableSeats(inventory);

  if (totalAvailable < passengerCount) {
    return {
      success: false,
      bookedSeats: [],
      message: `Only ${totalAvailable} seats available, but ${passengerCount} requested`,
    };
  }

  const bookedSeats: string[] = [];
  let remainingPassengers = passengerCount;

  // First, try to fulfill berth preferences
  if (berthPreferences) {
    Object.entries(berthPreferences).forEach(([berthType, count]) => {
      const inv = inventory.find((i) => i.berthType === berthType);
      if (inv && remainingPassengers > 0) {
        const toBook = Math.min(count as number, inv.total - inv.booked - inv.blocked, remainingPassengers);
        inv.booked += toBook;
        for (let i = 0; i < toBook; i++) {
          bookedSeats.push(`${berthType}-${inv.booked - toBook + i + 1}`);
        }
        remainingPassengers -= toBook;
      }
    });
  }

  // Fill remaining from any available seats
  for (let i = 0; i < inventory.length && remainingPassengers > 0; i++) {
    const inv = inventory[i];
    const available = inv.total - inv.booked - inv.blocked;
    const toBook = Math.min(available, remainingPassengers);

    if (toBook > 0) {
      inv.booked += toBook;
      for (let j = 0; j < toBook; j++) {
        bookedSeats.push(`${inv.berthType}-${inv.booked - toBook + j + 1}`);
      }
      remainingPassengers -= toBook;
    }
  }

  if (remainingPassengers > 0) {
    return {
      success: false,
      bookedSeats: [],
      message: "Could not fulfill all bookings",
    };
  }

  return {
    success: true,
    bookedSeats,
    message: `Successfully booked ${bookedSeats.length} seats`,
  };
}

/**
 * Block seats for maintenance
 */
export function blockSeats(
  inventory: SeatInventory[],
  berthType: BerthType,
  count: number
): boolean {
  const inv = inventory.find((i) => i.berthType === berthType);
  if (!inv) return false;

  const available = inv.total - inv.booked - inv.blocked;
  if (available < count) return false;

  inv.blocked += count;
  return true;
}

/**
 * Unblock seats
 */
export function unblockSeats(
  inventory: SeatInventory[],
  berthType: BerthType,
  count: number
): boolean {
  const inv = inventory.find((i) => i.berthType === berthType);
  if (!inv || inv.blocked < count) return false;

  inv.blocked -= count;
  return true;
}

/**
 * Cancel booking and release seats
 */
export function releaseSeats(
  inventory: SeatInventory[],
  seats: string[]
): boolean {
  for (const seat of seats) {
    const [berthType] = seat.split("-");
    const inv = inventory.find((i) => i.berthType === berthType);
    if (!inv || inv.booked === 0) return false;
    inv.booked -= 1;
  }
  return true;
}

/**
 * Add to waitlist
 */
export function addToWaitlist(inventory: SeatInventory[], count: number): boolean {
  // Find the main berth type to track waitlist
  const primaryInv = inventory[0];
  if (!primaryInv) return false;

  primaryInv.waitlisted += count;
  return true;
}

/**
 * Remove from waitlist (when seat becomes available or passenger cancels)
 */
export function removeFromWaitlist(inventory: SeatInventory[], count: number): boolean {
  const primaryInv = inventory[0];
  if (!primaryInv || primaryInv.waitlisted < count) return false;

  primaryInv.waitlisted -= count;
  return true;
}

/**
 * Generate seat map display data
 */
export function generateSeatMapData(inventory: SeatInventory[]): {
  berthType: BerthType;
  total: number;
  available: number;
  booked: number;
  blocked: number;
  occupancyPercent: number;
}[] {
  return inventory.map((inv) => ({
    berthType: inv.berthType,
    total: inv.total,
    available: inv.total - inv.booked - inv.blocked,
    booked: inv.booked,
    blocked: inv.blocked,
    occupancyPercent: Math.round((inv.booked / inv.total) * 100),
  }));
}
