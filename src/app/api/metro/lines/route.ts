import { NextRequest, NextResponse } from "next/server";
import { getServerData } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const network = searchParams.get("network");
    
    const data = await getServerData();
    let lines = data.metroLines || [];
    
    if (network) {
      lines = lines.filter((line: any) => line.network === network);
    }
    
    return NextResponse.json(lines);
  } catch (error) {
    console.error("Error fetching metro lines:", error);
    return NextResponse.json({ error: "Failed to fetch metro lines" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await getServerData();
    
    const newLine = {
      id: Date.now(),
      ...body,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (!data.metroLines) {
      data.metroLines = [];
    }
    data.metroLines.push(newLine);
    
    return NextResponse.json(newLine, { status: 201 });
  } catch (error) {
    console.error("Error creating metro line:", error);
    return NextResponse.json({ error: "Failed to create metro line" }, { status: 500 });
  }
}