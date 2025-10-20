"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { CafeAdminHeader } from "../components/layout/CafeAdminHeader";
import { CafeAdminContent } from "../components/layout/CafeAdminContent";
import { useCafeAdmin } from "@/hooks/useCafeAdmin";
import { CafeAdminSidebar } from "../components/layout/sidebars";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { cafeadmin, loading } = useCafeAdmin(); // ✅ Enforces role

  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  if (loading) return <p>Loading...</p>;
  if (!cafeadmin) return null; // Redirect in hook

  return (
    <div className="flex h-dvh w-full bg-background text-foreground">
      <CafeAdminSidebar  />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b bg-background/70 backdrop-blur">
          <div className="flex items-center justify-between px-4">
            <CafeAdminHeader
              title={`${cafeadmin?.cafe_name} Dashboard`}
              onToggleSidebar={() => setSidebarOpen((v) => !v)}
            />
          </div>
        </div>
        <CafeAdminContent>{children}</CafeAdminContent>
      </div>
    </div>
  );
}
