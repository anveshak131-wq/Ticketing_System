"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { BerthPreference, Passenger } from "@/types";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

interface PassengerFormProps {
  passengers: Passenger[];
  onChange: (passengers: Passenger[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function createPassenger(): Passenger {
  return {
    id: crypto.randomUUID(),
    name: "",
    age: 25,
    gender: "male",
    berthPreference: "none",
  };
}

export function PassengerForm({
  passengers,
  onChange,
  onNext,
  onBack,
}: PassengerFormProps) {
  const updatePassenger = (id: string, field: keyof Passenger, value: string | number) => {
    onChange(
      passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addPassenger = () => {
    if (passengers.length >= 6) return;
    onChange([...passengers, createPassenger()]);
  };

  const removePassenger = (id: string) => {
    if (passengers.length <= 1) return;
    onChange(passengers.filter((p) => p.id !== id));
  };

  const isValid = passengers.every(
    (p) => p.name.trim().length >= 2 && p.age >= 1 && p.age <= 120
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {passengers.map((passenger, index) => (
        <motion.div
          key={passenger.id}
          layout
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Passenger {index + 1}</h3>
            {passengers.length > 1 && (
              <button
                type="button"
                onClick={() => removePassenger(passenger.id)}
                className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
                aria-label="Remove passenger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="As on ID proof"
              value={passenger.name}
              onChange={(e) => updatePassenger(passenger.id, "name", e.target.value)}
            />
            <Input
              label="Age"
              type="number"
              min={1}
              max={120}
              value={passenger.age}
              onChange={(e) =>
                updatePassenger(passenger.id, "age", parseInt(e.target.value) || 0)
              }
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Gender</label>
              <select
                value={passenger.gender}
                onChange={(e) =>
                  updatePassenger(
                    passenger.id,
                    "gender",
                    e.target.value as Passenger["gender"]
                  )
                }
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Berth Preference</label>
              <select
                value={passenger.berthPreference}
                onChange={(e) =>
                  updatePassenger(
                    passenger.id,
                    "berthPreference",
                    e.target.value as BerthPreference
                  )
                }
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="none">No Preference</option>
                <option value="LB">Lower Berth</option>
                <option value="MB">Middle Berth</option>
                <option value="UB">Upper Berth</option>
                <option value="SL">Side Lower</option>
                <option value="SU">Side Upper</option>
              </select>
            </div>
          </div>
        </motion.div>
      ))}

      {passengers.length < 6 && (
        <Button variant="outline" onClick={addPassenger} className="w-full">
          <Plus className="h-4 w-4" />
          Add Passenger
        </Button>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Review Booking
        </Button>
      </div>
    </motion.div>
  );
}
