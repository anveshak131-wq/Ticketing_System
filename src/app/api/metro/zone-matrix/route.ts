import { NextRequest, NextResponse } from "next/server";
import { getServerData } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const data = await getServerData();
    const matrix = data.zoneMatrix || [];
    
    return NextResponse.json(matrix);
  } catch (error) {
    console.error("Error fetching zone matrix:", error);
    return NextResponse.json({ error: "Failed to fetch zone matrix" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await getServerData();
    
    const newEntry = {
      id: Date.now(),
      ...body,
    };
    
    if (!data.zoneMatrix) {
      data.zoneMatrix = [];
    }
    data.zoneMatrix.push(newEntry);
    
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating zone matrix entry:", error);
    return NextResponse.json({ error: "Failed to create zone matrix entry" }, { status: 500 });
  }
}