import { NextRequest, NextResponse } from "next/server";
import { getMetroLines, saveMetroLines } from "@/lib/server/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lines = await getMetroLines();
    const line = lines.find((l) => l.id === parseInt(id));

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
    const lines = await getMetroLines();

    const lineIndex = lines.findIndex((l) => l.id === parseInt(id));
    if (lineIndex === -1) {
      return NextResponse.json({ error: "Metro line not found" }, { status: 404 });
    }

    lines[lineIndex] = {
      ...lines[lineIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await saveMetroLines(lines);
    return NextResponse.json(lines[lineIndex]);
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
    const lines = await getMetroLines();
    const lineIndex = lines.findIndex((l) => l.id === parseInt(id));

    if (lineIndex === -1) {
      return NextResponse.json({ error: "Metro line not found" }, { status: 404 });
    }

    lines.splice(lineIndex, 1);
    await saveMetroLines(lines);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting metro line:", error);
    return NextResponse.json({ error: "Failed to delete metro line" }, { status: 500 });
  }
}
