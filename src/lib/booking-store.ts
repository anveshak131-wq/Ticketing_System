"use client";

import { createStore } from "@/lib/storage";
import type { Reservation } from "@/types";

const reservationsStore = createStore<Reservation[]>("ir-demo-reservations", () => []);

function normalize(reservation: Reservation): Reservation {
  return {
    ...reservation,
    bookingChannel: reservation.bookingChannel ?? "public",
  };
}

export function subscribeReservations(listener: () => void) {
  return reservationsStore.subscribe(listener);
}

export function getReservationsSnapshot(): Reservation[] {
  return reservationsStore.getSnapshot().map(normalize);
}

export function getReservationsServerSnapshot(): Reservation[] {
  return [];
}

export function getAllReservations(): Reservation[] {
  return reservationsStore.read().map(normalize);
}

export function getReservationByPNR(pnr: string): Reservation | null {
  const clean = pnr.replace(/\D/g, "");
  return getAllReservations().find((r) => r.pnr === clean) ?? null;
}

export function getAgentReservations(agentId: string): Reservation[] {
  return getAllReservations().filter((r) => r.bookedById === agentId);
}

export function saveReservation(reservation: Reservation): void {
  const store = getAllReservations();
  const normalized = normalize(reservation);
  const index = store.findIndex((r) => r.pnr === normalized.pnr);
  if (index >= 0) {
    store[index] = normalized;
  } else {
    store.unshift(normalized);
  }
  reservationsStore.write(store);
}

export function cancelReservation(pnr: string): Reservation | null {
  const reservation = getReservationByPNR(pnr);
  if (!reservation) return null;
  const updated: Reservation = {
    ...reservation,
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  saveReservation(updated);
  return updated;
}

export function deleteReservation(pnr: string): boolean {
  const store = getAllReservations();
  const next = store.filter((r) => r.pnr !== pnr);
  if (next.length === store.length) return false;
  reservationsStore.write(next);
  return true;
}
