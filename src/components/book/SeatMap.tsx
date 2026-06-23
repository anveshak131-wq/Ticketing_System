"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BERTH_LABELS } from "@/types";
import { generateSeatMapData } from "@/lib/seat-management";
import type { SeatInventory, BerthType } from "@/types";
import { motion } from "framer-motion";
import { useState } from "react";

interface SeatMapProps {
  inventory: SeatInventory[];
  onSelectSeats?: (seats: string[]) => void;
  selectable?: boolean;
  selectedSeats?: Set<string>;
}

export function SeatMap({
  inventory,
  onSelectSeats,
  selectable = true,
  selectedSeats = new Set(),
}: SeatMapProps) {
  const [localSelected, setLocalSelected] = useState<Set<string>>(selectedSeats);
  const seatData = generateSeatMapData(inventory);

  const toggleSeat = (berthType: BerthType, seatNumber: number) => {
    if (!selectable) return;

    const seatId = `${berthType}-${seatNumber}`;
    const newSelected = new Set(localSelected);

    if (newSelected.has(seatId)) {
      newSelected.delete(seatId);
    } else {
      newSelected.add(seatId);
    }

    setLocalSelected(newSelected);
    onSelectSeats?.(Array.from(newSelected));
  };

  const getAvailability = (berthType: BerthType): "available" | "booked" | "blocked" => {
    // This is simplified - in reality, you'd track individual seats
    const data = seatData.find((d) => d.berthType === berthType);
    if (!data) return "available";
    if (data.available === 0) return "booked";
    if (data.blocked > 0) return "blocked";
    return "available";
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-success"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted"></div>
          <span className="text-sm">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-warning"></div>
          <span className="text-sm">Blocked</span>
        </div>
        {selectable && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-primary"></div>
            <span className="text-sm">Selected</span>
          </div>
        )}
      </div>

      {/* Seat Grid by Berth Type */}
      <div className="space-y-6">
        {seatData.map((berth) => {
          const availability = getAvailability(berth.berthType);
          const isBlocked = availability === "blocked";

          return (
            <motion.div
              key={berth.berthType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold">{BERTH_LABELS[berth.berthType]}</h4>
                <div className="flex gap-3 text-sm">
                  <span className="text-success">
                    ✓ {berth.available} available
                  </span>
                  <span className="text-muted">
                    ✕ {berth.booked} booked
                  </span>
                  {berth.blocked > 0 && (
                    <span className="text-warning">
                      🚫 {berth.blocked} blocked
                    </span>
                  )}
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-1 text-xs text-muted">
                  <span>Occupancy</span>
                  <span>{berth.occupancyPercent}%</span>
                </div>
                <div className="w-full bg-foreground/10 rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${berth.occupancyPercent}%` }}
                  />
                </div>
              </div>

              {/* Seat Grid */}
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-10">
                {Array.from({ length: berth.total }).map((_, i) => {
                  const seatId = `${berth.berthType}-${i + 1}`;
                  const isSelected = localSelected.has(seatId);
                  const isAvailable = berth.available > berth.booked;

                  return (
                    <motion.button
                      key={seatId}
                      type="button"
                      whileHover={isAvailable && selectable ? { scale: 1.1 } : {}}
                      whileTap={isAvailable && selectable ? { scale: 0.95 } : {}}
                      onClick={() =>
                        toggleSeat(berth.berthType, i + 1)
                      }
                      disabled={!isAvailable || !selectable}
                      className={`relative aspect-square rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                        isSelected
                          ? "bg-primary text-primary-foreground ring-2 ring-primary"
                          : isAvailable
                            ? "bg-success/20 text-success hover:bg-success/30"
                            : isBlocked
                              ? "bg-warning/20 text-warning cursor-not-allowed"
                              : "bg-muted text-muted cursor-not-allowed"
                      }`}
                      title={`${BERTH_LABELS[berth.berthType]} ${i + 1}`}
                    >
                      {i + 1}
                    </motion.button>
                  );
                })}
              </div>

              {isBlocked && (
                <p className="mt-2 text-xs text-warning">
                  Some seats are blocked for maintenance.
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation */}
      {selectable && localSelected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary bg-primary/5 p-4"
        >
          <p className="text-sm font-medium mb-3">
            Selected {localSelected.size} seat{localSelected.size !== 1 ? "s" : ""}:
          </p>
          <p className="text-sm text-muted mb-3">
            {Array.from(localSelected).join(", ")}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onSelectSeats?.(Array.from(localSelected));
              }}
            >
              Confirm Selection
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLocalSelected(new Set());
                onSelectSeats?.([]);
              }}
            >
              Clear Selection
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
