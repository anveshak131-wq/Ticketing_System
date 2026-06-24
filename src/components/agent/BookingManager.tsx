"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, XCircle } from "lucide-react";

// Mock data for now, until we have the hook for agent's bookings
const mockBookings = [
  {
    pnr: "AGNT789",
    trainNumber: "12345",
    trainName: "Express",
    from: "NDLS",
    to: "BCT",
    date: "2023-10-28",
    passengerName: "John Doe",
    status: "CONFIRMED",
  },
  {
    pnr: "AGNT790",
    trainNumber: "54321",
    trainName: "Superfast",
    from: "CSMT",
    to: "HWH",
    date: "2023-10-29",
    passengerName: "Jane Smith",
    status: "CANCELLED",
  },
];

export function BookingManager() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookings = mockBookings.filter(
    (booking) =>
      booking.pnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.passengerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">My Bookings</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by PNR or Passenger Name..."
          className="w-full pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <div key={booking.pnr} className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-primary">{booking.pnr}</span>
                  <Badge variant={booking.status === "CONFIRMED" ? "success" : "danger"}>
                    {booking.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">{booking.passengerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.trainName} ({booking.trainNumber})
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    {booking.from} → {booking.to} on {booking.date}
                  </p>
                </div>
              </div>
              {booking.status === "CONFIRMED" && (
                <div className="flex items-center p-4 border-t">
                  <Button size="sm" variant="outline">
                    Download Ticket
                  </Button>
                  <Button size="sm" variant="danger" className="ml-auto">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No bookings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
