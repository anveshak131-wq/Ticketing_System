import { generateTicketPdf } from "@/lib/ticket-pdf";
import { getReservationByPnr } from "@/lib/server/data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pnr: string }> }
) {
  const { pnr } = await params;
  const cleanPnr = pnr.replace(/\D/g, "");

  if (cleanPnr.length !== 10) {
    return NextResponse.json({ error: "Valid PNR required" }, { status: 400 });
  }

  const reservation = await getReservationByPnr(cleanPnr);
  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = generateTicketPdf(reservation);
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="railconnect-ticket-${cleanPnr}.pdf"`,
      "Content-Length": String(pdf.byteLength),
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
