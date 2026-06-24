"use client";

import { PassengerForm } from "@/components/book/PassengerForm";
import { PageTransition } from "@/components/motion/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buttonStyles } from "@/components/ui/button-styles";
import {
  canModifyReservation,
  getModificationDeadline,
} from "@/lib/booking-rules";
import {
  cancelReservation,
  fetchReservationByPNR,
  saveReservation,
} from "@/lib/booking-store";
import { formatPNR, isValidPNR } from "@/lib/pnr";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Passenger, Reservation } from "@/types";
import { BERTH_PREFERENCE_LABELS, BOOKING_TYPE_LABELS, CLASS_LABELS } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  Download,
  MapPin,
  Search,
  Ticket,
  Train,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function ReservationsContent() {
  const searchParams = useSearchParams();
  const queryPnr = searchParams.get("pnr") ?? "";
  const [pnrInput, setPnrInput] = useState(queryPnr);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editPassengers, setEditPassengers] = useState<Passenger[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const lookupPNR = useCallback(async (raw: string) => {
    setError("");
    setEditing(false);
    setShowCancelConfirm(false);

    const clean = raw.replace(/\D/g, "");
    if (!isValidPNR(clean)) {
      setError("Please enter a valid 10-digit PNR number");
      setReservation(null);
      return;
    }

    const found = await fetchReservationByPNR(clean);
    if (!found) {
      setError("No reservation found for this PNR");
      setReservation(null);
      return;
    }

    setReservation(found);
    setEditPassengers(found.passengers);
  }, []);

  useEffect(() => {
    if (!queryPnr) return;
    const lookupTimer = window.setTimeout(() => {
      lookupPNR(queryPnr);
    }, 0);
    return () => window.clearTimeout(lookupTimer);
  }, [lookupPNR, queryPnr]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await lookupPNR(pnrInput);
  };

  const handleSaveEdit = async () => {
    if (!reservation) return;
    const updated: Reservation = {
      ...reservation,
      passengers: editPassengers,
      status: "modified",
      updatedAt: new Date().toISOString(),
    };
    const saved = await saveReservation(updated);
    setReservation(saved);
    setEditing(false);
  };

  const handleCancel = async () => {
    if (!reservation) return;
    const cancelled = await cancelReservation(reservation.pnr);
    if (cancelled) {
      setReservation(cancelled);
      setShowCancelConfirm(false);
      setEditing(false);
    }
  };

  const modifiable = reservation
    ? canModifyReservation(reservation.travelDate)
    : false;

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">My Reservation</h1>
          <p className="mt-2 text-muted">
            Enter your 10-digit PNR to view, edit, or cancel
          </p>
        </div>

        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <Input
              label="PNR Number"
              placeholder="e.g. 1234567890"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
              className="flex-1"
            />
            <div className="flex items-end">
              <Button type="submit" className="w-full sm:w-auto">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </motion.form>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {reservation && (
            <motion.div
              key={reservation.pnr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-6"
            >
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted">PNR</p>
                    <p className="text-2xl font-black tracking-wider text-primary">
                      {formatPNR(reservation.pnr)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        reservation.status === "confirmed"
                          ? "success"
                          : reservation.status === "cancelled"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </Badge>
                    <Badge variant="accent">
                      {BOOKING_TYPE_LABELS[reservation.bookingType ?? "intercity"]}
                    </Badge>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Train className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted">Train</p>
                      <p className="font-semibold">
                        {reservation.trainName}
                      </p>
                      <p className="text-sm text-muted">#{reservation.trainNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted">Travel Date</p>
                      <p className="font-semibold">
                        {formatDate(reservation.travelDate)}
                        {reservation.departureTime
                          ? ` · ${reservation.departureTime}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted">Route</p>
                      <p className="font-semibold">
                        {reservation.fromName} → {reservation.toName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Ticket className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted">Class</p>
                      <p className="font-semibold">
                        {CLASS_LABELS[reservation.travelClass]}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total Fare</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(reservation.totalFare)}
                    </p>
                    {reservation.groupSize ? (
                      <p className="text-xs text-muted">
                        {reservation.groupSize} passenger
                        {reservation.groupSize !== 1 ? "s" : ""} ·{" "}
                        {formatCurrency(
                          Math.round(reservation.totalFare / reservation.groupSize)
                        )}{" "}
                        each
                      </p>
                    ) : null}
                  </div>
                </div>

                {!editing ? (
                  <div className="mt-6">
                    <p className="mb-2 text-sm font-medium">
                      {reservation.bookingType === "metro" || reservation.bookingType === "local"
                        ? "Tickets"
                        : "Passengers"}
                    </p>
                    {reservation.bookingType === "metro" || reservation.bookingType === "local" ? (
                      <p className="rounded-lg bg-foreground/5 px-3 py-2 text-sm">
                        {reservation.passengers.length} ticket
                        {reservation.passengers.length !== 1 ? "s" : ""}
                        {reservation.seats?.length
                          ? ` · Seats ${reservation.seats.join(", ")}`
                          : ""}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {reservation.passengers.map((p, i) => (
                          <li
                            key={p.id}
                            className="rounded-lg bg-foreground/5 px-3 py-2 text-sm"
                          >
                            {i + 1}. {p.name} · {p.age} yrs · {p.gender}
                            {reservation.seats?.[i] && ` · Seat ${reservation.seats[i]}`}
                            {" · "}
                            {BERTH_PREFERENCE_LABELS[p.berthPreference]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="mt-6">
                    <PassengerForm
                      passengers={editPassengers}
                      onChange={setEditPassengers}
                      onNext={handleSaveEdit}
                      onBack={() => {
                        setEditing(false);
                        setEditPassengers(reservation.passengers);
                      }}
                    />
                  </div>
                )}

                {!modifiable && reservation.status !== "cancelled" && (
                  <div className="mt-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p>
                      Edit and cancel are only allowed until{" "}
                      <strong>{getModificationDeadline(reservation.travelDate)}</strong>{" "}
                      (2 days before departure).
                    </p>
                  </div>
                )}

                {!editing && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={`/api/reservations/${reservation.pnr}/ticket.pdf`}
                      download={`railconnect-ticket-${reservation.pnr}.pdf`}
                      className={buttonStyles({ variant: "secondary" })}
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>

                    {reservation.status !== "cancelled" && (
                      <>
                        {reservation.bookingType !== "metro" &&
                          reservation.bookingType !== "local" && (
                          <Button
                            variant="outline"
                            disabled={!modifiable}
                            onClick={() => setEditing(true)}
                          >
                            Edit Passengers
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          disabled={!modifiable}
                          onClick={() => setShowCancelConfirm(true)}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel Reservation
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {showCancelConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4"
                  >
                    <p className="text-sm font-medium">
                      Are you sure you want to cancel this reservation?
                    </p>
                    <div className="mt-3 flex gap-3">
                      <Button variant="danger" size="sm" onClick={handleCancel}>
                        Yes, Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        Keep Booking
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Loading...</div>}>
      <ReservationsContent />
    </Suspense>
  );
}
