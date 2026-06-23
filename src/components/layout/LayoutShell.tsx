"use client";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { usePathname } from "next/navigation";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPortal =
    pathname.startsWith("/agent") || pathname.startsWith("/admin");

  if (isPortal) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
