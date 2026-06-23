"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/use-auth";
import { useReservations } from "@/hooks/use-reservations";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatPNR } from "@/lib/pnr";
import { motion } from "framer-motion";
import { ArrowRight, Ticket, Users } from "lucide-react";
import Link from "next/link";

export default function AgentDashboardPage() {
  const session = useAuth();
  const allReservations = useReservations();
  const myBookings = allReservations.filter((r) => r.bookedById === session?.userId);
  const confirmed = myBookings.filter((r) => r.status === "confirmed").length;

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome, {session?.name}</h1>
      <p className="mt-1 text-muted">Manage passenger bookings from the counter</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Total Bookings</p>
          <p className="mt-1 text-3xl font-bold">{myBookings.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Confirmed</p>
          <p className="mt-1 text-3xl font-bold text-success">{confirmed}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Agent Code</p>
          <p className="mt-1 text-3xl font-bold text-accent">{session?.agentCode ?? "—"}</p>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/agent/book">
          <Button variant="secondary">
            <Ticket className="h-4 w-4" />
            New Booking
          </Button>
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Recent Bookings</h2>
        {myBookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No bookings yet. Start with a new ticket.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {myBookings.slice(0, 8).map((r, i) => (
              <motion.div
                key={r.pnr}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{formatPNR(r.pnr)}</span>
                    <Badge variant={r.status === "confirmed" ? "success" : "danger"}>
                      {r.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm">
                    {r.trainName} · {formatDate(r.travelDate)}
                  </p>
                  <p className="text-xs text-muted">
                    {r.passengers.length} passenger{r.passengers.length !== 1 ? "s" : ""} ·{" "}
                    {formatCurrency(r.totalFare)}
                  </p>
                </div>
                <Link href={`/reservations?pnr=${r.pnr}`}>
                  <Button variant="outline" size="sm">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4 text-sm text-muted">
        <Users className="mt-0.5 h-4 w-4 shrink-0" />
        Passengers can look up tickets using PNR on the public My PNR page.
      </div>
    </div>
  );
}
