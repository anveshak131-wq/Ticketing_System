import { NextRequest, NextResponse } from "next/server";
import { getZoneMatrix, saveZoneMatrix } from "@/lib/server/data";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const matrix = await getZoneMatrix();

    const entryIndex = matrix.findIndex((z) => z.id === parseInt(id));
    if (entryIndex === -1) {
      return NextResponse.json({ error: "Zone matrix entry not found" }, { status: 404 });
    }

    matrix[entryIndex] = {
      ...matrix[entryIndex],
      ...body,
    };

    await saveZoneMatrix(matrix);
    return NextResponse.json(matrix[entryIndex]);
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
    const matrix = await getZoneMatrix();
    const entryIndex = matrix.findIndex((z) => z.id === parseInt(id));

    if (entryIndex === -1) {
      return NextResponse.json({ error: "Zone matrix entry not found" }, { status: 404 });
    }

    matrix.splice(entryIndex, 1);
    await saveZoneMatrix(matrix);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting zone matrix entry:", error);
    return NextResponse.json({ error: "Failed to delete zone matrix entry" }, { status: 500 });
  }
}
