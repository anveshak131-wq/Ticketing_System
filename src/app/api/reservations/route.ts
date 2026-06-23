import {
  deleteReservationByPnr,
  getReservationByPnr,
  getReservations,
  upsertReservation,
} from "@/lib/server/data";
import type { Reservation } from "@/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pnr = searchParams.get("pnr");

  if (pnr) {
    const reservation = await getReservationByPnr(pnr);
    if (!reservation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(reservation);
  }

  const list = await getReservations();
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const reservation = (await request.json()) as Reservation;
  const saved = await upsertReservation(reservation);
  return NextResponse.json(saved);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const pnr = searchParams.get("pnr");
  if (!pnr) {
    return NextResponse.json({ error: "PNR required" }, { status: 400 });
  }
  const ok = await deleteReservationByPnr(pnr.replace(/\D/g, ""));
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
