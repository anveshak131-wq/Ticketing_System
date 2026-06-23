import { getCatalog, saveCatalog } from "@/lib/server/data";
import type { Station, Train } from "@/types";
import type { Catalog } from "@/lib/server/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const catalog = await getCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("[API] Error fetching catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as
      | { type: "station"; data: Station }
      | { type: "train"; data: Train }
      | Catalog;

    const catalog = await getCatalog();

    if ("stations" in body && "trains" in body) {
      await saveCatalog(body);
      return NextResponse.json(body);
    }

    if (body.type === "station") {
      const index = catalog.stations.findIndex((s) => s.code === body.data.code);
      if (index >= 0) catalog.stations[index] = body.data;
      else catalog.stations.push(body.data);
      catalog.stations.sort((a, b) => a.code.localeCompare(b.code));
      await saveCatalog(catalog);
      return NextResponse.json(catalog);
    }

    if (body.type === "train") {
      const index = catalog.trains.findIndex((t) => t.number === body.data.number);
      if (index >= 0) catalog.trains[index] = body.data;
      else catalog.trains.push(body.data);
      catalog.trains.sort((a, b) => a.number.localeCompare(b.number));
      await saveCatalog(catalog);
      return NextResponse.json(catalog);
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (error) {
    console.error("[API] Error updating catalog:", error);
    return NextResponse.json(
      { error: "Failed to update catalog" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stationCode = searchParams.get("station");
    const trainNumber = searchParams.get("train");
    const stopIndex = searchParams.get("stopIndex");
    const catalog = await getCatalog();

    if (stationCode) {
      const used = catalog.trains.some(
        (t) =>
          t.source === stationCode ||
          t.destination === stationCode ||
          t.schedule.some((s) => s.stationCode === stationCode)
      );
      if (used) {
        return NextResponse.json(
          { error: "Station is used by a train route" },
          { status: 409 }
        );
      }
      catalog.stations = catalog.stations.filter((s) => s.code !== stationCode);
      await saveCatalog(catalog);
      return NextResponse.json(catalog);
    }

    if (trainNumber && stopIndex !== null) {
      const trainIdx = catalog.trains.findIndex((t) => t.number === trainNumber);
      if (trainIdx < 0) {
        return NextResponse.json(
          { error: "Train not found" },
          { status: 404 }
        );
      }
      const stopIdx = parseInt(stopIndex, 10);
      if (isNaN(stopIdx) || stopIdx < 0 || stopIdx >= catalog.trains[trainIdx].schedule.length) {
        return NextResponse.json(
          { error: "Invalid stop index" },
          { status: 400 }
        );
      }
      if (catalog.trains[trainIdx].schedule.length <= 2) {
        return NextResponse.json(
          { error: "Train must have at least 2 stops (source and destination)" },
          { status: 409 }
        );
      }
      catalog.trains[trainIdx].schedule.splice(stopIdx, 1);
      await saveCatalog(catalog);
      return NextResponse.json(catalog);
    }

    if (trainNumber) {
      catalog.trains = catalog.trains.filter((t) => t.number !== trainNumber);
      await saveCatalog(catalog);
      return NextResponse.json(catalog);
    }

    return NextResponse.json(
      { error: "Missing station, train, or stop params" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] Error deleting from catalog:", error);
    return NextResponse.json(
      { error: "Failed to delete from catalog" },
      { status: 500 }
    );
  }
}
