"use client";

import { PassengerForm } from "@/components/book/PassengerForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useReservations } from "@/hooks/use-reservations";
import { deleteReservation, saveReservation } from "@/lib/booking-store";
import { formatPNR } from "@/lib/pnr";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CLASS_LABELS, BOOKING_TYPE_LABELS, type Reservation } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export function ReservationManager() {
  const reservations = useReservations();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [deletePnr, setDeletePnr] = useState<string | null>(null);

  const filtered = reservations.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.pnr.includes(q) ||
      r.trainName.toLowerCase().includes(q) ||
      r.trainNumber.includes(q) ||
      (r.bookedBy?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleSaveEdit = async () => {
    if (!editing) return;
    await saveReservation({ ...editing, updatedAt: new Date().toISOString() });
    setEditing(null);
  };

  const handleDelete = async (pnr: string) => {
    await deleteReservation(pnr);
    setDeletePnr(null);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by PNR, train, or agent..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-card/80">
            <tr>
              <th className="px-4 py-3 font-medium">PNR</th>
              <th className="px-4 py-3 font-medium">Train</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Fare</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  No reservations found
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.pnr} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold text-primary">
                    {formatPNR(r.pnr)}
                  </td>
                  <td className="px-4 py-3">
                    <p>{r.trainName}</p>
                    <p className="text-xs text-muted">#{r.trainNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(r.travelDate)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.bookingType === "intercity" ? "default" : "accent"}>
                      {BOOKING_TYPE_LABELS[r.bookingType ?? "intercity"]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.bookingChannel === "agent" ? "warning" : "default"}>
                      {r.bookingChannel}
                    </Badge>
                    {r.bookedBy && (
                      <p className="mt-0.5 text-xs text-muted">{r.bookedBy}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        r.status === "confirmed"
                          ? "success"
                          : r.status === "cancelled"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(r.totalFare)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing({ ...r, passengers: r.passengers.map((p) => ({ ...p })) })}
                        className="rounded-lg p-2 text-primary hover:bg-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePnr(r.pnr)}
                        className="rounded-lg p-2 text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold">Edit Reservation {formatPNR(editing.pnr)}</h3>
              <p className="mt-1 text-sm text-muted">
                {editing.trainName} · {CLASS_LABELS[editing.travelClass]} · {formatDate(editing.travelDate)}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        status: e.target.value as Reservation["status"],
                      })
                    }
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="modified">Modified</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <Input
                  label="Travel Date"
                  type="date"
                  value={editing.travelDate}
                  onChange={(e) => setEditing({ ...editing, travelDate: e.target.value })}
                />
              </div>
              <div className="mt-6">
                <PassengerForm
                  passengers={editing.passengers}
                  onChange={(passengers) => setEditing({ ...editing, passengers })}
                  onNext={handleSaveEdit}
                  onBack={() => setEditing(null)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletePnr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold">Delete reservation?</h3>
              <p className="mt-2 text-sm text-muted">
                PNR {formatPNR(deletePnr)} will be permanently removed.
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="danger" size="sm" onClick={() => handleDelete(deletePnr)}>
                  Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeletePnr(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
