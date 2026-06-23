import { SEED_STATIONS, SEED_TRAINS, SEED_USERS } from "@/data/seed-data";
import { KV_KEYS, kvGet, kvPut } from "@/lib/server/kv";
import type { Reservation, Station, Train, User } from "@/types";

export interface Catalog {
  stations: Station[];
  trains: Train[];
}

export async function ensureSeeded(): Promise<void> {
  const catalog = await kvGet<Catalog>(KV_KEYS.catalog);
  if (!catalog) {
    await kvPut(KV_KEYS.catalog, {
      stations: SEED_STATIONS,
      trains: SEED_TRAINS,
    });
  }
  const users = await kvGet<User[]>(KV_KEYS.users);
  if (!users) {
    await kvPut(KV_KEYS.users, SEED_USERS);
  }
  const reservations = await kvGet<Reservation[]>(KV_KEYS.reservations);
  if (!reservations) {
    await kvPut(KV_KEYS.reservations, []);
  }
}

export async function getCatalog(): Promise<Catalog> {
  await ensureSeeded();
  return (await kvGet<Catalog>(KV_KEYS.catalog))!;
}

export async function saveCatalog(catalog: Catalog): Promise<void> {
  await kvPut(KV_KEYS.catalog, catalog);
}

export async function getUsers(): Promise<User[]> {
  await ensureSeeded();
  return (await kvGet<User[]>(KV_KEYS.users))!;
}

export async function getReservations(): Promise<Reservation[]> {
  await ensureSeeded();
  const list = (await kvGet<Reservation[]>(KV_KEYS.reservations)) ?? [];
  return list.map((r) => ({
    ...r,
    bookingChannel: r.bookingChannel ?? "public",
  }));
}

export async function saveReservations(list: Reservation[]): Promise<void> {
  await kvPut(KV_KEYS.reservations, list);
}

export async function upsertReservation(reservation: Reservation): Promise<Reservation> {
  const list = await getReservations();
  const normalized = {
    ...reservation,
    bookingChannel: reservation.bookingChannel ?? "public",
  };
  const index = list.findIndex((r) => r.pnr === normalized.pnr);
  if (index >= 0) {
    list[index] = normalized;
  } else {
    list.unshift(normalized);
  }
  await saveReservations(list);
  return normalized;
}

export async function deleteReservationByPnr(pnr: string): Promise<boolean> {
  const list = await getReservations();
  const next = list.filter((r) => r.pnr !== pnr);
  if (next.length === list.length) return false;
  await saveReservations(next);
  return true;
}

export async function getReservationByPnr(pnr: string): Promise<Reservation | null> {
  const clean = pnr.replace(/\D/g, "");
  const list = await getReservations();
  return list.find((r) => r.pnr === clean) ?? null;
}
