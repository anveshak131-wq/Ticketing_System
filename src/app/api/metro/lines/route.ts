import { NextRequest, NextResponse } from "next/server";
import { getMetroLines, saveMetroLines } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const network = searchParams.get("network");

    let lines = await getMetroLines();

    if (network) {
      lines = lines.filter((line) => line.network === network);
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
    const lines = await getMetroLines();

    const newLine = {
      id: Date.now(),
      ...body,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    lines.push(newLine);
    await saveMetroLines(lines);

    return NextResponse.json(newLine, { status: 201 });
  } catch (error) {
    console.error("Error creating metro line:", error);
    return NextResponse.json({ error: "Failed to create metro line" }, { status: 500 });
  }
}
