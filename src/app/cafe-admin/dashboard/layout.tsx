"use client";

import { useState } from "react";
import { CafeAdminSidebarMinimal } from "../components/layout/sidebars/CafeAdminSidebarMinimal";
import { CafeAdminHeader } from "../components/layout/CafeAdminHeader";

export default function CafeAdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <CafeAdminSidebarMinimal collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <CafeAdminHeader
          title="Dashboard"
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
