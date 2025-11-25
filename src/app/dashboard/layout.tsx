
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCafeUser } from "@/hooks/useCafeUser";
import { Loader2 } from "lucide-react";
import { CafeUserSidebarMinimal } from "./components/layout/sidebars/CafeUserSidebarMinimal";
import { CafeUserHeader } from "./components/layout/CafeUserHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const { user, loading } = useCafeUser(["cafe_admin", "cafe_staff"]);
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Loading dashboard...
            </div>
        );
    }

    if (!user) {
        router.replace("/login");
        return null;
    }

    return (
        <div className="flex h-screen">
            <CafeUserSidebarMinimal collapsed={collapsed} setCollapsed={setCollapsed} />

            <div className="flex flex-col flex-1 overflow-y-auto">
                <CafeUserHeader
                    title={user.user_role === "cafe_admin" ? "Admin Dashboard" : "Staff Dashboard"}
                    onToggleSidebar={() => setCollapsed((p) => !p)}
                />

                <main className="flex-1 p-6 bg-white">{children}</main>
            </div>
        </div>
    );
}
