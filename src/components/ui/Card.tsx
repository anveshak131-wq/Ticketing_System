"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm",
        hover && "cursor-pointer transition-shadow hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
