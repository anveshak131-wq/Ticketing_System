import { NextRequest, NextResponse } from "next/server";
import { getFareZones, saveFareZones } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const network = searchParams.get("network");

    let zones = await getFareZones();

    if (network) {
      zones = zones.filter((z) => z.network === network);
    }

    return NextResponse.json(zones);
  } catch (error) {
    console.error("Error fetching fare zones:", error);
    return NextResponse.json({ error: "Failed to fetch fare zones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const zones = await getFareZones();

    const newZone = {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    zones.push(newZone);
    await saveFareZones(zones);

    return NextResponse.json(newZone, { status: 201 });
  } catch (error) {
    console.error("Error creating fare zone:", error);
    return NextResponse.json({ error: "Failed to create fare zone" }, { status: 500 });
  }
}
