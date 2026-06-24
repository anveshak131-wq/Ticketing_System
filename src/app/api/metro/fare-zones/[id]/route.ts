import { NextRequest, NextResponse } from "next/server";
import { getFareZones, saveFareZones } from "@/lib/server/data";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const zones = await getFareZones();

    const zoneIndex = zones.findIndex((z) => z.id === parseInt(id));
    if (zoneIndex === -1) {
      return NextResponse.json({ error: "Fare zone not found" }, { status: 404 });
    }

    zones[zoneIndex] = {
      ...zones[zoneIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await saveFareZones(zones);
    return NextResponse.json(zones[zoneIndex]);
  } catch (error) {
    console.error("Error updating fare zone:", error);
    return NextResponse.json({ error: "Failed to update fare zone" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const zones = await getFareZones();
    const zoneIndex = zones.findIndex((z) => z.id === parseInt(id));

    if (zoneIndex === -1) {
      return NextResponse.json({ error: "Fare zone not found" }, { status: 404 });
    }

    zones.splice(zoneIndex, 1);
    await saveFareZones(zones);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fare zone:", error);
    return NextResponse.json({ error: "Failed to delete fare zone" }, { status: 500 });
  }
}
