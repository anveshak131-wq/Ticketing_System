"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCatalog } from "@/hooks/use-catalog";
import type { TrainSearchParams, TrainSearchResult } from "@/types";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface AdvancedSearchProps {
  onSearch?: (results: TrainSearchResult[], params: TrainSearchParams) => void;
}

export function AdvancedSearchForm({ onSearch }: AdvancedSearchProps) {
  const { stations, trains } = useCatalog();
  const [params, setParams] = useState<TrainSearchParams>({
    fromStation: "",
    toStation: "",
    travelDate: new Date().toISOString().split("T")[0],
    travelClass: "3A",
    passengerCount: 1,
    priceFrom: 0,
    priceTo: 10000,
    dateFlexibility: 0,
    trainFlexibility: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    if (!params.fromStation || !params.toStation || !params.travelDate) {
      alert("Please fill in all required fields");
      return;
    }

    // Filter trains based on search params
    const results = trains
      .filter(
        (train) =>
          train.source === params.fromStation &&
          train.destination === params.toStation &&
          train.classes.includes(params.travelClass || "3A")
      )
      .map((train) => {
        const baseFare = train.baseFares[params.travelClass || "3A"] || 0;
        const availableSeats = 50; // Mock value - would calculate from seat inventory
        return {
          ...train,
          availableSeats: { [params.travelClass || "3A"]: availableSeats },
          fare: { [params.travelClass || "3A"]: baseFare },
          dynamicPrice: { [params.travelClass || "3A"]: baseFare },
          occupancyRate: 45,
          waitlistCount: 0,
        } as TrainSearchResult;
      })
      .filter((train) => {
        const price = train.dynamicPrice[params.travelClass || "3A"] || 0;
        return (
          price >= (params.priceFrom || 0) &&
          price <= (params.priceTo || 10000)
        );
      });

    onSearch?.(results, params);
  };

  const handleClear = () => {
    setParams({
      fromStation: "",
      toStation: "",
      travelDate: new Date().toISOString().split("T")[0],
      travelClass: "3A",
      passengerCount: 1,
      priceFrom: 0,
      priceTo: 10000,
      dateFlexibility: 0,
      trainFlexibility: false,
    });
  };

  return (
    <div className="space-y-4">
      {/* Basic Search */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-semibold">Search Trains</h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* From Station */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">From</label>
            <select
              value={params.fromStation}
              onChange={(e) =>
                setParams({ ...params, fromStation: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
            >
              <option value="">Select from</option>
              {stations.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* To Station */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">To</label>
            <select
              value={params.toStation}
              onChange={(e) =>
                setParams({ ...params, toStation: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
            >
              <option value="">Select to</option>
              {stations.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Travel Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Date</label>
            <Input
              type="date"
              value={params.travelDate}
              onChange={(e) =>
                setParams({ ...params, travelDate: e.target.value })
              }
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Class */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Class</label>
            <select
              value={params.travelClass}
              onChange={(e) =>
                setParams({
                  ...params,
                  travelClass: e.target.value as any,
                })
              }
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
            >
              <option value="SL">Sleeper (SL)</option>
              <option value="3A">AC 3 Tier (3A)</option>
              <option value="2A">AC 2 Tier (2A)</option>
              <option value="1A">AC First (1A)</option>
              <option value="CC">Chair Car (CC)</option>
              <option value="2S">Second Sitting (2S)</option>
            </select>
          </div>

          {/* Passengers */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Passengers</label>
            <Input
              type="number"
              min={1}
              max={6}
              value={params.passengerCount}
              onChange={(e) =>
                setParams({
                  ...params,
                  passengerCount: parseInt(e.target.value, 10),
                })
              }
            />
          </div>
        </div>

        {/* Search Button & Advanced Toggle */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Hide" : "Show"} Filters
          </Button>
          <Button size="sm" variant="outline" onClick={handleClear}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h4 className="mb-4 font-semibold">Advanced Filters</h4>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Price Range */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Price Range (₹)
              </label>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="From"
                  value={params.priceFrom}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      priceFrom: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={params.priceTo}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      priceTo: parseInt(e.target.value, 10) || 10000,
                    })
                  }
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                ₹{params.priceFrom} - ₹{params.priceTo}
              </p>
            </div>

            {/* Date Flexibility */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Date Flexibility (±days)
              </label>
              <Input
                type="number"
                min={0}
                max={7}
                value={params.dateFlexibility}
                onChange={(e) =>
                  setParams({
                    ...params,
                    dateFlexibility: parseInt(e.target.value, 10),
                  })
                }
              />
              <p className="mt-2 text-xs text-muted">
                Search ±{params.dateFlexibility} days from selected date
              </p>
            </div>

            {/* Train Flexibility */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Train Flexibility
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-border p-3 hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={params.trainFlexibility}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      trainFlexibility: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Allow alternative trains</span>
              </label>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="mb-2 block text-sm font-medium">Quick Sets</label>
              <div className="space-y-1">
                <button
                  onClick={() =>
                    setParams({
                      ...params,
                      priceFrom: 0,
                      priceTo: 1000,
                    })
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Budget (&lt;₹1000)
                </button>
                <button
                  onClick={() =>
                    setParams({
                      ...params,
                      priceFrom: 1000,
                      priceTo: 3000,
                    })
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Mid (₹1-3K)
                </button>
                <button
                  onClick={() =>
                    setParams({
                      ...params,
                      priceFrom: 3000,
                      priceTo: 10000,
                    })
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Premium (&gt;₹3000)
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
