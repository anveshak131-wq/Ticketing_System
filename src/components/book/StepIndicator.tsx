"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const steps = ["Search", "Select Train", "Passengers", "Confirm"];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      {steps.map((label, index) => {
        const done = index < currentStep;
        const active = index === currentStep;

        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  backgroundColor: done || active ? "var(--primary)" : "var(--border)",
                }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold",
                  done || active ? "text-primary-foreground" : "text-muted"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </motion.div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  active ? "text-primary" : "text-muted"
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-2 h-0.5 flex-1 rounded-full bg-border">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: done ? "100%" : active ? "50%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
