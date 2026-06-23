"use client";

import type { Reservation } from "@/types";

const listeners = new Set<() => void>();
const serverSnapshot: Reservation[] = [];
let cache: Reservation[] = [];
let loading = false;
let loaded = false;

function normalize(reservation: Reservation): Reservation {
  return {
    ...reservation,
    bookingChannel: reservation.bookingChannel ?? "public",
  };
}

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeReservations(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReservationsSnapshot(): Reservation[] {
  return cache;
}

export function getReservationsServerSnapshot(): Reservation[] {
  return serverSnapshot;
}

export function isReservationsLoaded() {
  return loaded;
}

export async function loadReservations(): Promise<Reservation[]> {
  if (loading) return cache;
  loading = true;
  try {
    const res = await fetch("/api/reservations", { cache: "no-store" });
    if (res.ok) {
      const list = (await res.json()) as Reservation[];
      cache = list.map(normalize);
      loaded = true;
      notify();
    }
  } finally {
    loading = false;
  }
  return cache;
}

export function getAllReservations(): Reservation[] {
  return cache;
}

export function getReservationByPNR(pnr: string): Reservation | null {
  const clean = pnr.replace(/\D/g, "");
  return cache.find((r) => r.pnr === clean) ?? null;
}

export function getAgentReservations(agentId: string): Reservation[] {
  return cache.filter((r) => r.bookedById === agentId);
}

export async function saveReservation(reservation: Reservation): Promise<Reservation> {
  const res = await fetch("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalize(reservation)),
  });
  if (!res.ok) throw new Error("Failed to save reservation");
  const saved = normalize(await res.json());
  const index = cache.findIndex((r) => r.pnr === saved.pnr);
  if (index >= 0) cache[index] = saved;
  else cache.unshift(saved);
  notify();
  return saved;
}

export async function cancelReservation(pnr: string): Promise<Reservation | null> {
  const reservation = getReservationByPNR(pnr);
  if (!reservation) return null;
  return saveReservation({
    ...reservation,
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteReservation(pnr: string): Promise<boolean> {
  const res = await fetch(
    `/api/reservations?pnr=${encodeURIComponent(pnr.replace(/\D/g, ""))}`,
    { method: "DELETE" }
  );
  if (!res.ok) return false;
  cache = cache.filter((r) => r.pnr !== pnr.replace(/\D/g, ""));
  notify();
  return true;
}

export async function fetchReservationByPNR(pnr: string): Promise<Reservation | null> {
  const res = await fetch(
    `/api/reservations?pnr=${encodeURIComponent(pnr.replace(/\D/g, ""))}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const saved = normalize(await res.json());
  const index = cache.findIndex((r) => r.pnr === saved.pnr);
  if (index >= 0) cache[index] = saved;
  else cache.unshift(saved);
  notify();
  return saved;
}
