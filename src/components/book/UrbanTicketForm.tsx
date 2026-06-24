"use client";

import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

interface UrbanTicketFormProps {
  ticketCount: number;
  onCountChange: (count: number) => void;
  onNext: () => void;
  onBack: () => void;
  farePerTicket?: number;
  maxTickets?: number;
}

export function UrbanTicketForm({
  ticketCount,
  onCountChange,
  onNext,
  onBack,
  farePerTicket,
  maxTickets = 6,
}: UrbanTicketFormProps) {
  const totalFare = farePerTicket ? farePerTicket * ticketCount : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="text-lg font-semibold">Number of Tickets</h2>
      <p className="mt-1 text-sm text-muted">
        Metro and local tickets do not require passenger names
      </p>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-foreground/5 p-4">
        <span className="text-sm font-medium">Tickets</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onCountChange(Math.max(1, ticketCount - 1))}
            disabled={ticketCount <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-foreground/5 disabled:opacity-40"
            aria-label="Decrease tickets"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2rem] text-center text-xl font-bold">{ticketCount}</span>
          <button
            type="button"
            onClick={() => onCountChange(Math.min(maxTickets, ticketCount + 1))}
            disabled={ticketCount >= maxTickets}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-foreground/5 disabled:opacity-40"
            aria-label="Increase tickets"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {farePerTicket ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3 text-sm">
          <span className="text-muted">
            {formatCurrency(farePerTicket)} × {ticketCount} ticket
            {ticketCount !== 1 ? "s" : ""}
          </span>
          <span className="font-bold text-primary">{formatCurrency(totalFare)}</span>
        </div>
      ) : null}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Review Ticket</Button>
      </div>
    </motion.div>
  );
}
