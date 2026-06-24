import { NextRequest, NextResponse } from "next/server";
import { getLineStations, saveLineStations } from "@/lib/server/data";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const stations = await getLineStations();

    const stationIndex = stations.findIndex((s) => s.id === parseInt(id));
    if (stationIndex === -1) {
      return NextResponse.json({ error: "Line station not found" }, { status: 404 });
    }

    stations[stationIndex] = {
      ...stations[stationIndex],
      ...body,
    };

    await saveLineStations(stations);
    return NextResponse.json(stations[stationIndex]);
  } catch (error) {
    console.error("Error updating line station:", error);
    return NextResponse.json({ error: "Failed to update line station" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stations = await getLineStations();
    const stationIndex = stations.findIndex((s) => s.id === parseInt(id));

    if (stationIndex === -1) {
      return NextResponse.json({ error: "Line station not found" }, { status: 404 });
    }

    stations.splice(stationIndex, 1);
    await saveLineStations(stations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing station from line:", error);
    return NextResponse.json({ error: "Failed to remove station from line" }, { status: 500 });
  }
}
