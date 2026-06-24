import { NextRequest, NextResponse } from "next/server";
import { getLineStations, saveLineStations } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lineId = searchParams.get("lineId");

    let stations = await getLineStations();

    if (lineId) {
      stations = stations.filter((s) => s.lineId === parseInt(lineId));
    }

    return NextResponse.json(stations);
  } catch (error) {
    console.error("Error fetching line stations:", error);
    return NextResponse.json({ error: "Failed to fetch line stations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const stations = await getLineStations();

    const newStation = {
      id: Date.now(),
      ...body,
    };

    stations.push(newStation);
    await saveLineStations(stations);

    return NextResponse.json(newStation, { status: 201 });
  } catch (error) {
    console.error("Error adding station to line:", error);
    return NextResponse.json({ error: "Failed to add station to line" }, { status: 500 });
  }
}
