import { NextRequest, NextResponse } from "next/server";
import { getServerData } from "@/lib/server/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getServerData();
    const line = data.metroLines?.find((l: any) => l.id === parseInt(id));
    
    if (!line) {
      return NextResponse.json({ error: "Metro line not found" }, { status: 404 });
    }
    
    return NextResponse.json(line);
  } catch (error) {
    console.error("Error fetching metro line:", error);
    return NextResponse.json({ error: "Failed to fetch metro line" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await getServerData();
    
    const lineIndex = data.metroLines?.findIndex((l: any) => l.id === parseInt(id));
    if (lineIndex === -1 || lineIndex === undefined) {
      return NextResponse.json({ error: "Metro line not found" }, { status: 404 });
    }
    
    data.metroLines[lineIndex] = {
      ...data.metroLines[lineIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(data.metroLines[lineIndex]);
  } catch (error) {
    console.error("Error updating metro line:", error);
    return NextResponse.json({ error: "Failed to update metro line" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getServerData();
    const lineIndex = data.metroLines?.findIndex((l: any) => l.id === parseInt(id));
    
    if (lineIndex === -1 || lineIndex === undefined) {
      return NextResponse.json({ error: "Metro line not found" }, { status: 404 });
    }
    
    data.metroLines.splice(lineIndex, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting metro line:", error);
    return NextResponse.json({ error: "Failed to delete metro line" }, { status: 500 });
  }
}