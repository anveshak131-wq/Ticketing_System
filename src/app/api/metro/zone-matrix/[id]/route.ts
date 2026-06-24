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
    
    const entryIndex = data.zoneMatrix?.findIndex((z: any) => z.id === parseInt(id));
    if (entryIndex === -1 || entryIndex === undefined) {
      return NextResponse.json({ error: "Zone matrix entry not found" }, { status: 404 });
    }
    
    data.zoneMatrix[entryIndex] = {
      ...data.zoneMatrix[entryIndex],
      ...body,
    };
    
    return NextResponse.json(data.zoneMatrix[entryIndex]);
  } catch (error) {
    console.error("Error updating zone matrix entry:", error);
    return NextResponse.json({ error: "Failed to update zone matrix entry" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getServerData();
    const entryIndex = data.zoneMatrix?.findIndex((z: any) => z.id === parseInt(id));
    
    if (entryIndex === -1 || entryIndex === undefined) {
      return NextResponse.json({ error: "Zone matrix entry not found" }, { status: 404 });
    }
    
    data.zoneMatrix.splice(entryIndex, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting zone matrix entry:", error);
    return NextResponse.json({ error: "Failed to delete zone matrix entry" }, { status: 500 });
  }
}