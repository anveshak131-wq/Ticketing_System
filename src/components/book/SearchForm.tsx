"use client";

import { useCatalog } from "@/hooks/use-catalog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { TravelClass } from "@/types";
import { CLASS_LABELS, NETWORK_LABELS, type StationNetwork } from "@/types";
import { motion } from "framer-motion";
import { ArrowLeftRight, Calendar, Search } from "lucide-react";
import { useMemo } from "react";
import { getStationNetwork } from "@/lib/station-utils";

interface SearchFormProps {
  from: string;
  to: string;
  date: string;
  travelClass: TravelClass;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onClassChange: (v: TravelClass) => void;
  onSearch: () => void;
  loading?: boolean;
  stationNetwork?: StationNetwork;
  searchLabel?: string;
  city?: string;
  cities?: string[];
  onCityChange?: (city: string) => void;
  travelTime?: string;
  onTravelTimeChange?: (time: string) => void;
  serviceSummary?: string;
}

export function SearchForm({
  from,
  to,
  date,
  travelClass,
  onFromChange,
  onToChange,
  onDateChange,
  onClassChange,
  onSearch,
  loading,
  stationNetwork,
  searchLabel = "Search Trains",
  city,
  cities,
  onCityChange,
  travelTime,
  onTravelTimeChange,
  serviceSummary,
}: SearchFormProps) {
  const { stations } = useCatalog();
  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const filteredStations = useMemo(() => {
    let list = stations;
    if (stationNetwork) {
      list = list.filter((s) => {
        const net = getStationNetwork(s);
        if (stationNetwork === "metro" || stationNetwork === "local") {
          return net.includes(stationNetwork);
        }
        return net === stationNetwork;
      });
    }
    if (city) {
      list = list.filter((s) => s.city === city);
    }
    return list;
  }, [stations, stationNetwork, city]);

  const swapStations = () => {
    onFromChange(to);
    onToChange(from);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      {stationNetwork && stationNetwork !== "intercity" && cities && cities.length > 0 && onCityChange ? (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium">City</label>
          <select
            value={city ?? ""}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-muted">
            {NETWORK_LABELS[stationNetwork]} stations in {city || "selected city"}
          </p>
        </div>
      ) : stationNetwork ? (
        <p className="mb-4 text-sm text-muted">
          {NETWORK_LABELS[stationNetwork]} stations configured by admin
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">From Station</label>
          <select
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select station</option>
            {filteredStations.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label className="mb-1.5 block text-sm font-medium">To Station</label>
          <select
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select station</option>
            {filteredStations.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={swapStations}
            className="absolute -left-4 top-[calc(50%+12px)] hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-foreground/5 sm:flex"
            aria-label="Swap stations"
          >
            <ArrowLeftRight className="h-4 w-4 text-primary" />
          </button>
        </div>

        <Input
          label="Journey Date"
          type="date"
          min={minDate}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />

        {!stationNetwork || stationNetwork === "intercity" ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Class</label>
            <select
              value={travelClass}
              onChange={(e) => onClassChange(e.target.value as TravelClass)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {(Object.keys(CLASS_LABELS) as TravelClass[]).map((cls) => (
                <option key={cls} value={cls}>
                  {CLASS_LABELS[cls]}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <Input
              label="Preferred Time"
              type="time"
              value={travelTime ?? "09:00"}
              onChange={(e) => onTravelTimeChange?.(e.target.value)}
            />
            <div className="flex items-end">
              <p className="text-sm text-muted">
                {serviceSummary ??
                  "Frequent services through the day — showing next departures from your chosen time"}
              </p>
            </div>
          </>
        )}
      </div>

      <Button
        className="mt-6 w-full sm:w-auto"
        onClick={onSearch}
        disabled={loading || !from || !to || !date || from === to || (stationNetwork && stationNetwork !== "intercity" && !travelTime)}
      >
        {loading ? (
          <span className="shimmer inline-block rounded px-8 py-0.5">Searching trains...</span>
        ) : (
          <>
            <Search className="h-4 w-4" />
            {searchLabel}
          </>
        )}
      </Button>
    </motion.div>
  );
}
