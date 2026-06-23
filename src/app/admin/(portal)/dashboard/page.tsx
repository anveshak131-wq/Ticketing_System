"use client";

import { Card } from "@/components/ui/Card";
import { useCatalog } from "@/hooks/use-catalog";
import { useReservations } from "@/hooks/use-reservations";
import { MapPin, Ticket, Train, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const { stations, trains } = useCatalog();
  const reservations = useReservations();
  const confirmed = reservations.filter((r) => r.status === "confirmed").length;
  const agentBookings = reservations.filter((r) => r.bookingChannel === "agent").length;

  const stats = [
    { label: "Stations", value: stations.length, icon: MapPin },
    { label: "Trains", value: trains.length, icon: Train },
    { label: "Reservations", value: reservations.length, icon: Ticket },
    { label: "Agent Bookings", value: agentBookings, icon: Users },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-1 text-muted">
        Manage Indian Railway demo data — {confirmed} active reservations
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">Quick actions</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li>· Add or edit stations under Stations</li>
          <li>· Update train names, numbers, schedules under Trains</li>
          <li>· View, edit, or delete any reservation under Reservations</li>
        </ul>
      </div>
    </div>
  );
}
