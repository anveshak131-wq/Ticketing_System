"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCatalog } from "@/hooks/use-catalog";
import { deleteTrainStop } from "@/lib/catalog-store";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function StopsManager() {
  const { stations, trains } = useCatalog();
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const train = trains.find((t) => t.number === selectedTrain);

  const getStationName = (code: string) => {
    return stations.find((s) => s.code === code)?.name || code;
  };

  const handleDeleteStop = async (stopIndex: number) => {
    if (!selectedTrain) return;
    if (confirm("Are you sure you want to delete this stop?")) {
      setLoading(true);
      setError("");
      try {
        await deleteTrainStop(selectedTrain, stopIndex);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete stop");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Select Train</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {trains.map((t) => (
            <button
              key={t.number}
              onClick={() => {
                setSelectedTrain(t.number);
                setError("");
              }}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selectedTrain === t.number
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <div className="font-semibold">{t.number}</div>
              <div className="text-sm text-muted">{t.name}</div>
              <div className="text-xs text-muted mt-1">{t.schedule.length} stops</div>
            </button>
          ))}
        </div>
      </div>

      {train && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          <div>
            <Badge variant="accent">{train.number}</Badge>
            <h3 className="font-semibold mt-2">{train.name}</h3>
            <p className="text-sm text-muted">
              {getStationName(train.source)} → {getStationName(train.destination)}
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3">Stops ({train.schedule.length})</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {train.schedule.map((stop, index) => {
                const stationName = getStationName(stop.stationCode);
                const isSource = index === 0;
                const isDestination = index === train.schedule.length - 1;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        <span>{index + 1}. </span>
                        <span>{stop.stationCode}</span>
                        <span className="ml-2 text-sm text-muted">({stationName})</span>
                      </div>
                      <div className="text-sm text-muted mt-1 space-x-3">
                        {stop.arrival && <span>Arrival: {stop.arrival}</span>}
                        {stop.departure && <span>Departure: {stop.departure}</span>}
                        {stop.distance > 0 && <span>Distance: {stop.distance}km</span>}
                      </div>
                      {(isSource || isDestination) && (
                        <div className="mt-1">
                          {isSource && <Badge variant="outline">Source</Badge>}
                          {isDestination && (
                            <Badge variant="outline" className="ml-1">
                              Destination
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => void handleDeleteStop(index)}
                      disabled={loading || isSource || isDestination}
                      className="rounded-lg p-2 text-danger hover:bg-danger/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={
                        isSource || isDestination
                          ? "Cannot delete source or destination stops"
                          : "Delete stop"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</div>
          )}
        </motion.div>
      )}

      {!train && selectedTrain && (
        <div className="rounded-lg border border-border bg-card p-4 text-center text-muted">
          Train not found
        </div>
      )}
    </div>
  );
}
