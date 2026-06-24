import { NextRequest, NextResponse } from "next/server";
import { getServerData } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lineId = searchParams.get("lineId");
    
    const data = await getServerData();
    let stations = data.lineStations || [];
    
    if (lineId) {
      stations = stations.filter((s: any) => s.lineId === parseInt(lineId));
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
    const data = await getServerData();
    
    const newStation = {
      id: Date.now(),
      ...body,
    };
    
    if (!data.lineStations) {
      data.lineStations = [];
    }
    data.lineStations.push(newStation);
    
    return NextResponse.json(newStation, { status: 201 });
  } catch (error) {
    console.error("Error adding station to line:", error);
    return NextResponse.json({ error: "Failed to add station to line" }, { status: 500 });
  }
}