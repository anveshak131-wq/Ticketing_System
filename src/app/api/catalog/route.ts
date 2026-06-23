import { getCatalog, saveCatalog } from "@/lib/server/data";
import type { Station, Train } from "@/types";
import type { Catalog } from "@/lib/server/data";
import { NextResponse } from "next/server";

export async function GET() {
  const catalog = await getCatalog();
  return NextResponse.json(catalog);
}

export async function PUT(request: Request) {
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
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationCode = searchParams.get("station");
  const trainNumber = searchParams.get("train");
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

  if (trainNumber) {
    catalog.trains = catalog.trains.filter((t) => t.number !== trainNumber);
    await saveCatalog(catalog);
    return NextResponse.json(catalog);
  }

  return NextResponse.json({ error: "Missing station or train param" }, { status: 400 });
}
