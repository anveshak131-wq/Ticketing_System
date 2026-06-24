import { SEED_STATIONS, SEED_TRAINS, SEED_USERS, SEED_METRO_LINES, SEED_LINE_STATIONS } from "@/data/seed-data";
import { KV_KEYS, kvGet, kvPut } from "@/lib/server/kv";
import { getStationNetwork, getTrainCategory } from "@/lib/station-utils";
import type { Reservation, Station, Train, User, SeatInventory, WaitlistEntry, PricingRule, MetroLine, LineStation, FareZone, ZoneMatrix } from "@/types";

export interface Catalog {
  stations: Station[];
  trains: Train[];
}

function normalizeCatalog(catalog: Catalog): Catalog {
  return {
    stations: catalog.stations.map((s) => ({
      ...s,
      network: getStationNetwork(s),
    })),
    trains: catalog.trains.map((t) => {
      const { baseFares: _fare, ...train } = t;
      return {
        ...train,
        category: getTrainCategory(t),
      };
    }),
  };
}

function mergeUrbanSeed(catalog: Catalog): Catalog {
  const next = { ...catalog, stations: [...catalog.stations], trains: [...catalog.trains] };

  for (const station of SEED_STATIONS) {
    if (getStationNetwork(station) === "intercity") continue;
    const existing = next.stations.find((s) => s.code === station.code);
    if (!existing) {
      next.stations.push(station);
    }
  }

  for (const train of SEED_TRAINS) {
    if (getTrainCategory(train) === "intercity") continue;
    const existingIdx = next.trains.findIndex((t) => t.number === train.number);
    if (existingIdx === -1) {
      next.trains.push(train);
      continue;
    }

    next.trains[existingIdx] = {
      ...next.trains[existingIdx],
      schedule: train.schedule,
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      duration: train.duration,
      firstService: train.firstService,
      lastService: train.lastService,
      sundayFirstService: train.sundayFirstService,
      peakFrequencyMinutes: train.peakFrequencyMinutes,
      offPeakFrequencyMinutes: train.offPeakFrequencyMinutes,
    };
  }

  next.stations.sort((a, b) => a.code.localeCompare(b.code));
  next.trains.sort((a, b) => a.number.localeCompare(b.number));
  return next;
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
  let catalog = normalizeCatalog((await kvGet<Catalog>(KV_KEYS.catalog))!);

  const needsUrbanSeed =
    !catalog.stations.some((s) => s.network === "metro") ||
    catalog.trains.some(
      (train) =>
        getTrainCategory(train) !== "intercity" &&
        train.firstService === undefined
    );
  if (needsUrbanSeed) {
    catalog = mergeUrbanSeed(catalog);
    await saveCatalog(catalog);
  }

  return catalog;
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
    bookingType: r.bookingType ?? "intercity",
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
    bookingType: reservation.bookingType ?? "intercity",
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

// Seat Inventory Functions
export async function getSeatInventory(trainNumber: string, travelDate: string): Promise<SeatInventory[]> {
  const key = `${KV_KEYS.seatInventory}:${trainNumber}:${travelDate}`;
  return (await kvGet<SeatInventory[]>(key)) ?? [];
}

export async function saveSeatInventory(inventory: SeatInventory[]): Promise<void> {
  if (inventory.length === 0) return;
  const key = `${KV_KEYS.seatInventory}:${inventory[0].trainNumber}:${inventory[0].travelDate}`;
  await kvPut(key, inventory);
}

export async function getAllSeatInventories(): Promise<Map<string, SeatInventory[]>> {
  // This is a simplified version - in production, you'd need to list all keys
  // For now, returning empty map
  return new Map();
}

// Waitlist Functions
export async function getWaitlist(): Promise<WaitlistEntry[]> {
  return (await kvGet<WaitlistEntry[]>(KV_KEYS.waitlist)) ?? [];
}

export async function saveWaitlist(entries: WaitlistEntry[]): Promise<void> {
  await kvPut(KV_KEYS.waitlist, entries);
}

export async function addToWaitlist(entry: WaitlistEntry): Promise<void> {
  const list = await getWaitlist();
  list.push(entry);
  await saveWaitlist(list);
}

export async function removeFromWaitlist(waitlistId: string): Promise<boolean> {
  const list = await getWaitlist();
  const filtered = list.filter((w) => w.id !== waitlistId);
  if (filtered.length === list.length) return false;
  await saveWaitlist(filtered);
  return true;
}

// Pricing Rules Functions
export async function getPricingRules(): Promise<PricingRule[]> {
  return (await kvGet<PricingRule[]>(KV_KEYS.pricingRules)) ?? [];
}

export async function savePricingRules(rules: PricingRule[]): Promise<void> {
  await kvPut(KV_KEYS.pricingRules, rules);
}

export async function createPricingRule(rule: PricingRule): Promise<void> {
  const rules = await getPricingRules();
  rules.push(rule);
  await savePricingRules(rules);
}

export async function updatePricingRule(ruleId: string, updates: Partial<PricingRule>): Promise<boolean> {
  const rules = await getPricingRules();
  const index = rules.findIndex((r) => r.id === ruleId);
  if (index < 0) return false;
  rules[index] = { ...rules[index], ...updates };
  await savePricingRules(rules);
  return true;
}

export async function deletePricingRule(ruleId: string): Promise<boolean> {
  const rules = await getPricingRules();
  const filtered = rules.filter((r) => r.id !== ruleId);
  if (filtered.length === rules.length) return false;
  await savePricingRules(filtered);
  return true;
}

async function ensureMetroSeeded(): Promise<void> {
  const lines = await kvGet<MetroLine[]>(KV_KEYS.metroLines);
  if (!lines || lines.length === 0) {
    await kvPut(KV_KEYS.metroLines, SEED_METRO_LINES);
    await kvPut(KV_KEYS.lineStations, SEED_LINE_STATIONS);
  }
}

// Metro Line Functions
export async function getMetroLines(): Promise<MetroLine[]> {
  await ensureMetroSeeded();
  return (await kvGet<MetroLine[]>(KV_KEYS.metroLines)) ?? [];
}

export async function saveMetroLines(lines: MetroLine[]): Promise<void> {
  await kvPut(KV_KEYS.metroLines, lines);
}

export async function getLineStations(): Promise<LineStation[]> {
  await ensureMetroSeeded();
  return (await kvGet<LineStation[]>(KV_KEYS.lineStations)) ?? [];
}

export async function saveLineStations(stations: LineStation[]): Promise<void> {
  await kvPut(KV_KEYS.lineStations, stations);
}

export async function getFareZones(): Promise<FareZone[]> {
  return (await kvGet<FareZone[]>(KV_KEYS.fareZones)) ?? [];
}

export async function saveFareZones(zones: FareZone[]): Promise<void> {
  await kvPut(KV_KEYS.fareZones, zones);
}

export async function getZoneMatrix(): Promise<ZoneMatrix[]> {
  return (await kvGet<ZoneMatrix[]>(KV_KEYS.zoneMatrix)) ?? [];
}

export async function saveZoneMatrix(matrix: ZoneMatrix[]): Promise<void> {
  await kvPut(KV_KEYS.zoneMatrix, matrix);
}

export async function getServerData() {
  return {
    metroLines: await getMetroLines(),
    lineStations: await getLineStations(),
    fareZones: await getFareZones(),
    zoneMatrix: await getZoneMatrix(),
  };
}
