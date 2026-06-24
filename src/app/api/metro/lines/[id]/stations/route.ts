import { NextRequest, NextResponse } from "next/server";
import { getLineStations } from "@/lib/server/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lineId = parseInt(id);
    const stations = await getLineStations();
    const filtered = stations.filter((s) => s.lineId === lineId);

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching line stations:", error);
    return NextResponse.json({ error: "Failed to fetch line stations" }, { status: 500 });
  }
}
