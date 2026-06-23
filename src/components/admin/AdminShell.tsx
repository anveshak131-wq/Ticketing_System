"use client";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  Shield,
  Ticket,
  Train,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/stations", label: "Stations", icon: MapPin },
  { href: "/admin/trains", label: "Trains", icon: Train },
  { href: "/admin/reservations", label: "Reservations", icon: Ticket },
];

interface AdminShellProps {
  userName: string;
  children: React.ReactNode;
}

export function AdminShell({ userName, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="border-b border-border lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Admin Panel</p>
              <p className="text-xs text-muted">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:mt-4 lg:w-full lg:justify-between">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-4 lg:flex-col lg:px-3">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1">
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
