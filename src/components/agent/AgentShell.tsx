"use client";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LayoutDashboard, LogOut, Ticket, Train } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const nav = [
  { href: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agent/book", label: "Book Ticket", icon: Ticket },
];

interface AgentShellProps {
  userName: string;
  agentCode?: string;
  children: React.ReactNode;
}

export function AgentShell({ userName, agentCode, children }: AgentShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/agent/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Train className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Agent Portal</p>
              <p className="text-xs text-muted">
                {userName}
                {agentCode ? ` · ${agentCode}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
      >
        {children}
      </motion.main>
    </div>
  );
}
