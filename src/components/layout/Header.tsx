"use client";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Train } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/book", label: "Book Train" },
  { href: "/metro", label: "Metro / Local" },
  { href: "/reservations", label: "My PNR" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass border-b border-border"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/about" className="group flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 8 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          >
            <Train className="h-5 w-5" />
          </motion.div>
          <div>
            <p className="text-sm font-bold leading-tight text-foreground">RailConnect</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">Indian Railway Demo</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active ? "text-primary" : "text-muted hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/book"
            className="hidden rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20 transition hover:opacity-90 sm:inline-flex"
          >
            Book Now
          </Link>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium",
              pathname === link.href
                ? "bg-primary/10 text-primary"
                : "text-muted"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </motion.header>
  );
}
