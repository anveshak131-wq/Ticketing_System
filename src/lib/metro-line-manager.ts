import type { MetroLine, LineStation, FareZone, ZoneMatrix, Station } from "@/types";

export interface MetroLineFormData {
  name: string;
  color: string;
  network: "metro" | "local";
  startStation: string;
  endStation: string;
  totalDistance: number;
  totalStations: number;
  fareType: "distance" | "zone" | "flat" | "station";
  baseFare: number;
  farePerKm: number;
}

export interface LineStationFormData {
  lineId: number;
  stationCode: string;
  stopOrder: number;
  distanceFromStart: number;
  direction: "up" | "down" | "both";
}

export interface FareZoneFormData {
  name: string;
  network: "metro" | "local";
  baseFare: number;
}

export interface ZoneMatrixFormData {
  fromZone: number;
  toZone: number;
  fare: number;
}

export class MetroLineManager {
  // Metro Line CRUD operations
  static async createLine(data: MetroLineFormData): Promise<MetroLine> {
    const response = await fetch("/api/metro/lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create metro line");
    return response.json();
  }

  static async getLines(network?: "metro" | "local"): Promise<MetroLine[]> {
    const url = network ? `/api/metro/lines?network=${network}` : "/api/metro/lines";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch metro lines");
    return response.json();
  }

  static async getLine(id: number): Promise<MetroLine> {
    const response = await fetch(`/api/metro/lines/${id}`);
    if (!response.ok) throw new Error("Failed to fetch metro line");
    return response.json();
  }

  static async updateLine(id: number, data: Partial<MetroLineFormData>): Promise<MetroLine> {
    const response = await fetch(`/api/metro/lines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update metro line");
    return response.json();
  }

  static async deleteLine(id: number): Promise<void> {
    const response = await fetch(`/api/metro/lines/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete metro line");
  }

  // Line Station operations
  static async addStationToLine(data: LineStationFormData): Promise<LineStation> {
    const response = await fetch("/api/metro/line-stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to add station to line");
    return response.json();
  }

  static async getLineStations(lineId: number): Promise<LineStation[]> {
    const response = await fetch(`/api/metro/lines/${lineId}/stations`);
    if (!response.ok) throw new Error("Failed to fetch line stations");
    return response.json();
  }

  static async updateLineStation(id: number, data: Partial<LineStationFormData>): Promise<LineStation> {
    const response = await fetch(`/api/metro/line-stations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update line station");
    return response.json();
  }

  static async removeStationFromLine(id: number): Promise<void> {
    const response = await fetch(`/api/metro/line-stations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove station from line");
  }

  // Fare Zone operations
  static async createFareZone(data: FareZoneFormData): Promise<FareZone> {
    const response = await fetch("/api/metro/fare-zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create fare zone");
    return response.json();
  }

  static async getFareZones(network?: "metro" | "local"): Promise<FareZone[]> {
    const url = network ? `/api/metro/fare-zones?network=${network}` : "/api/metro/fare-zones";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch fare zones");
    return response.json();
  }

  static async updateFareZone(id: number, data: Partial<FareZoneFormData>): Promise<FareZone> {
    const response = await fetch(`/api/metro/fare-zones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update fare zone");
    return response.json();
  }

  static async deleteFareZone(id: number): Promise<void> {
    const response = await fetch(`/api/metro/fare-zones/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete fare zone");
  }

  // Zone Matrix operations
  static async createZoneMatrixEntry(data: ZoneMatrixFormData): Promise<ZoneMatrix> {
    const response = await fetch("/api/metro/zone-matrix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create zone matrix entry");
    return response.json();
  }

  static async getZoneMatrix(): Promise<ZoneMatrix[]> {
    const response = await fetch("/api/metro/zone-matrix");
    if (!response.ok) throw new Error("Failed to fetch zone matrix");
    return response.json();
  }

  static async updateZoneMatrixEntry(id: number, data: Partial<ZoneMatrixFormData>): Promise<ZoneMatrix> {
    const response = await fetch(`/api/metro/zone-matrix/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update zone matrix entry");
    return response.json();
  }

  static async deleteZoneMatrixEntry(id: number): Promise<void> {
    const response = await fetch(`/api/metro/zone-matrix/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete zone matrix entry");
  }

  // Fare calculation utilities
  static calculateDistanceBasedFare(
    distanceKm: number,
    baseFare: number,
    farePerKm: number
  ): number {
    return baseFare + (distanceKm * farePerKm);
  }

  static calculateZoneBasedFare(
    fromZone: number,
    toZone: number,
    zoneMatrix: ZoneMatrix[],
    defaultFare: number
  ): number {
    const entry = zoneMatrix.find(
      z => z.fromZone === fromZone && z.toZone === toZone
    );
    return entry?.fare || defaultFare;
  }

  static getStationDistance(
    fromStation: string,
    toStation: string,
    lineStations: LineStation[]
  ): number {
    const from = lineStations.find(s => s.stationCode === fromStation);
    const to = lineStations.find(s => s.stationCode === toStation);
    
    if (!from || !to) return 0;
    return Math.abs(to.distanceFromStart - from.distanceFromStart);
  }
}