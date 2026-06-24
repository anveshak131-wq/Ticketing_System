import { NextRequest, NextResponse } from "next/server";
import { getZoneMatrix, saveZoneMatrix } from "@/lib/server/data";

export async function GET() {
  try {
    const matrix = await getZoneMatrix();
    return NextResponse.json(matrix);
  } catch (error) {
    console.error("Error fetching zone matrix:", error);
    return NextResponse.json({ error: "Failed to fetch zone matrix" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const matrix = await getZoneMatrix();

    const newEntry = {
      id: Date.now(),
      ...body,
    };

    matrix.push(newEntry);
    await saveZoneMatrix(matrix);

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating zone matrix entry:", error);
    return NextResponse.json({ error: "Failed to create zone matrix entry" }, { status: 500 });
  }
}
