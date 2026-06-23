"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getStationLabel } from "@/lib/train-search";
import { formatCurrency } from "@/lib/utils";
import type { TrainSearchResult, TravelClass } from "@/types";
import { BERTH_LABELS, CLASS_LABELS } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Armchair, Clock, Train } from "lucide-react";

interface TrainListProps {
  trains: TrainSearchResult[];
  selectedClass: TravelClass;
  onSelect: (train: TrainSearchResult) => void;
  from: string;
  to: string;
}

export function TrainList({ trains, selectedClass, onSelect, from, to }: TrainListProps) {
  if (trains.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-dashed border-border p-12 text-center"
      >
        <Train className="mx-auto h-10 w-10 text-muted" />
        <p className="mt-4 font-medium">No trains found</p>
        <p className="mt-1 text-sm text-muted">
          Try different stations or another date
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {trains.length} train{trains.length !== 1 ? "s" : ""} from{" "}
        {getStationLabel(from)} to {getStationLabel(to)}
      </p>
      <AnimatePresence>
        {trains.map((train, i) => {
          const seats = train.availableSeats[selectedClass] ?? 0;
          const baseFare = train.fare[selectedClass] ?? 0;
          const fare = train.dynamicPrice[selectedClass] ?? baseFare;
          const occupancy = train.occupancyRateByClass[selectedClass] ?? 0;
          const berthAvailability = train.availableBerths[selectedClass] ?? {};
          const showDynamicFare = fare !== baseFare;
          const hasClass = train.classes.includes(selectedClass);

          return (
            <motion.div
              key={train.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{train.name}</h3>
                    <Badge variant="accent">{train.number}</Badge>
                    <Badge>{train.type}</Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-xl font-bold">{train.departureTime}</p>
                      <p className="text-xs text-muted">{getStationLabel(from)}</p>
                    </div>
                    <div className="flex flex-col items-center text-muted">
                      <Clock className="h-4 w-4" />
                      <p className="text-xs">{train.duration}</p>
                      <div className="mt-1 h-px w-16 bg-border" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{train.arrivalTime}</p>
                      <p className="text-xs text-muted">{getStationLabel(to)}</p>
                    </div>
                  </div>

                  {hasClass && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(berthAvailability).map(([berthType, count]) => (
                        <Badge key={berthType} variant="default" className="gap-1">
                          <Armchair className="h-3 w-3" />
                          {BERTH_LABELS[berthType as keyof typeof BERTH_LABELS]}: {count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-start gap-2 lg:items-end">
                  {hasClass ? (
                    <>
                      <div className="lg:text-right">
                        <p className="text-xs text-muted">Fare per passenger</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(fare)}
                        </p>
                        <p className="text-xs text-muted">
                          {CLASS_LABELS[selectedClass]}
                          {showDynamicFare
                            ? ` · base ${formatCurrency(baseFare)}`
                            : ""}
                        </p>
                        <p className="text-xs text-muted">{occupancy}% occupied</p>
                      </div>
                      <Badge variant={seats > 10 ? "success" : seats > 0 ? "warning" : "danger"}>
                        {seats > 0
                          ? `${seats} seats available`
                          : train.waitlistCount > 0
                            ? `Waitlist ${train.waitlistCount}`
                            : "Waitlist"}
                      </Badge>
                      <Button
                        size="sm"
                        disabled={seats === 0}
                        onClick={() => onSelect(train)}
                      >
                        Select
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="danger">Class not available</Badge>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
