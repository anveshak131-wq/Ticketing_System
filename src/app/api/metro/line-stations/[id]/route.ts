import { NextRequest, NextResponse } from "next/server";
import { getServerData } from "@/lib/server/data";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = await getServerData();
    
    const stationIndex = data.lineStations?.findIndex((s: any) => s.id === parseInt(params.id));
    if (stationIndex === -1 || stationIndex === undefined) {
      return NextResponse.json({ error: "Line station not found" }, { status: 404 });
    }
    
    data.lineStations[stationIndex] = {
      ...data.lineStations[stationIndex],
      ...body,
    };
    
    return NextResponse.json(data.lineStations[stationIndex]);
  } catch (error) {
    console.error("Error updating line station:", error);
    return NextResponse.json({ error: "Failed to update line station" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getServerData();
    const stationIndex = data.lineStations?.findIndex((s: any) => s.id === parseInt(params.id));
    
    if (stationIndex === -1 || stationIndex === undefined) {
      return NextResponse.json({ error: "Line station not found" }, { status: 404 });
    }
    
    data.lineStations.splice(stationIndex, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing station from line:", error);
    return NextResponse.json({ error: "Failed to remove station from line" }, { status: 500 });
  }
}