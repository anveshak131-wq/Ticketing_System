import { NextRequest, NextResponse } from "next/server";
import { getServerData } from "@/lib/server/data";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await getServerData();
    
    const zoneIndex = data.fareZones?.findIndex((z: any) => z.id === parseInt(id));
    if (zoneIndex === -1 || zoneIndex === undefined) {
      return NextResponse.json({ error: "Fare zone not found" }, { status: 404 });
    }
    
    data.fareZones[zoneIndex] = {
      ...data.fareZones[zoneIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(data.fareZones[zoneIndex]);
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
    const data = await getServerData();
    const zoneIndex = data.fareZones?.findIndex((z: any) => z.id === parseInt(id));
    
    if (zoneIndex === -1 || zoneIndex === undefined) {
      return NextResponse.json({ error: "Fare zone not found" }, { status: 404 });
    }
    
    data.fareZones.splice(zoneIndex, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fare zone:", error);
    return NextResponse.json({ error: "Failed to delete fare zone" }, { status: 500 });
  }
}