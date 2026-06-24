import type { MetroLine, LineStation, FareZone, ZoneMatrix, FareType } from "@/types";
import {
  URBAN_FARE_PER_STATION,
  calculateUrbanStationFare,
  countLineStations,
} from "@/lib/urban-fare";

export interface MetroFareCalculationParams {
  fromStation: string;
  toStation: string;
  lineId: number;
  lineStations: LineStation[];
  metroLine: MetroLine;
  fareZones?: FareZone[];
  zoneMatrix?: ZoneMatrix[];
}

export interface MetroFareResult {
  fare: number;
  distanceKm: number;
  fareType: FareType;
  stationsTraveled?: number;
  fromZone?: number;
  toZone?: number;
  breakdown: {
    baseFare: number;
    distanceFare?: number;
    zoneFare?: number;
    stationFare?: number;
  };
}

export class MetroFareCalculator {
  /**
   * Calculate fare for metro/local travel: ₹10 per station segment traveled.
   */
  static calculateFare(params: MetroFareCalculationParams): MetroFareResult {
    const { fromStation, toStation, lineStations, metroLine } = params;

    if (metroLine.network === "metro" || metroLine.network === "local") {
      return this.calculateStationBasedFare(
        fromStation,
        toStation,
        lineStations,
        metroLine
      );
    }

    const distance = this.calculateDistance(fromStation, toStation, lineStations);

    switch (metroLine.fareType) {
      case "distance":
        return this.calculateDistanceBasedFare(distance, metroLine);
      case "zone":
        if (!params.fareZones || !params.zoneMatrix) {
          throw new Error("Fare zones and zone matrix required for zone-based fare calculation");
        }
        return this.calculateZoneBasedFare(
          fromStation,
          toStation,
          lineStations,
          params.fareZones,
          params.zoneMatrix,
          metroLine
        );
      case "flat":
        return this.calculateFlatFare(metroLine);
      default:
        throw new Error(`Unknown fare type: ${metroLine.fareType}`);
    }
  }

  private static calculateStationBasedFare(
    fromStation: string,
    toStation: string,
    lineStations: LineStation[],
    metroLine: MetroLine
  ): MetroFareResult {
    const stationsTraveled = countLineStations(lineStations, fromStation, toStation);
    const rate = metroLine.baseFare > 0 ? metroLine.baseFare : URBAN_FARE_PER_STATION;
    const fare = calculateUrbanStationFare(stationsTraveled, rate);
    const distance = this.calculateDistance(fromStation, toStation, lineStations);

    return {
      fare,
      distanceKm: distance,
      fareType: "station",
      stationsTraveled,
      breakdown: {
        baseFare: rate,
        stationFare: fare,
      },
    };
  }

  private static calculateDistance(fromStation: string, toStation: string, lineStations: LineStation[]): number {
    const from = lineStations.find((s) => s.stationCode === fromStation);
    const to = lineStations.find((s) => s.stationCode === toStation);

    if (!from || !to) {
      throw new Error("One or both stations not found on line");
    }

    return Math.abs(to.distanceFromStart - from.distanceFromStart);
  }

  private static calculateDistanceBasedFare(distance: number, metroLine: MetroLine): MetroFareResult {
    const distanceFare = distance * metroLine.farePerKm;
    const totalFare = metroLine.baseFare + distanceFare;

    return {
      fare: totalFare,
      distanceKm: distance,
      fareType: "distance",
      breakdown: {
        baseFare: metroLine.baseFare,
        distanceFare,
      },
    };
  }

  private static calculateZoneBasedFare(
    fromStation: string,
    toStation: string,
    lineStations: LineStation[],
    fareZones: FareZone[],
    zoneMatrix: ZoneMatrix[],
    metroLine: MetroLine
  ): MetroFareResult {
    const fromStationData = lineStations.find((s) => s.stationCode === fromStation);
    const toStationData = lineStations.find((s) => s.stationCode === toStation);

    if (!fromStationData || !toStationData) {
      throw new Error("One or both stations not found on line");
    }

    const fromZone = this.getZoneForStation(
      fromStationData.distanceFromStart,
      metroLine.totalDistance,
      fareZones
    );
    const toZone = this.getZoneForStation(
      toStationData.distanceFromStart,
      metroLine.totalDistance,
      fareZones
    );

    const matrixEntry = zoneMatrix.find(
      (z) => z.fromZone === fromZone && z.toZone === toZone
    );

    const zoneFare = matrixEntry?.fare || metroLine.baseFare;

    return {
      fare: zoneFare,
      distanceKm: Math.abs(toStationData.distanceFromStart - fromStationData.distanceFromStart),
      fareType: "zone",
      fromZone,
      toZone,
      breakdown: {
        baseFare: metroLine.baseFare,
        zoneFare,
      },
    };
  }

  private static getZoneForStation(distance: number, totalDistance: number, fareZones: FareZone[]): number {
    if (fareZones.length === 0) return 1;

    const zoneSize = totalDistance / fareZones.length;
    const zoneIndex = Math.min(Math.floor(distance / zoneSize), fareZones.length - 1);

    return fareZones[zoneIndex]?.id || 1;
  }

  private static calculateFlatFare(metroLine: MetroLine): MetroFareResult {
    return {
      fare: metroLine.baseFare,
      distanceKm: 0,
      fareType: "flat",
      breakdown: {
        baseFare: metroLine.baseFare,
      },
    };
  }

  static getLineStationsInOrder(lineStations: LineStation[]): LineStation[] {
    return lineStations
      .filter((s) => s.direction === "both" || s.direction === "up")
      .sort((a, b) => a.stopOrder - b.stopOrder);
  }

  static areStationsOnSameLine(
    fromStation: string,
    toStation: string,
    lineStations: LineStation[]
  ): boolean {
    const from = lineStations.find((s) => s.stationCode === fromStation);
    const to = lineStations.find((s) => s.stationCode === toStation);

    return !!(from && to);
  }

  static getAvailableLines(
    fromStation: string,
    toStation: string,
    allLineStations: LineStation[],
    allLines: MetroLine[]
  ): MetroLine[] {
    const availableLineIds = new Set<number>();

    allLineStations.forEach((ls) => {
      if (ls.stationCode === fromStation) {
        availableLineIds.add(ls.lineId);
      }
    });

    return allLines.filter((line) => {
      if (!availableLineIds.has(line.id)) return false;

      const lineStations = allLineStations.filter((ls) => ls.lineId === line.id);
      return this.areStationsOnSameLine(fromStation, toStation, lineStations);
    });
  }
}
