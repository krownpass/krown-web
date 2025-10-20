"use client";

import { Card } from "@/components/ui/card";
import { useCafeAdmin } from "@/hooks/useCafeAdmin";
import api from "@/lib/api"; // Axios instance
import { useEffect, useState } from "react";

export default function Page() {
    const { cafeadmin, loading } = useCafeAdmin();


    const [stats, setStats] = useState({
        total_cafes: 0,
        active_users: 0,
        total_referrals: 0,
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await api.get("/admin/dashboard/stats", {
                });

                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats:", err);
            }
        }

        fetchStats();
    }, []);
  if (loading) return <p>Loading...</p>;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Cafés</div>
                <div className="mt-2 text-3xl font-semibold">
                    {stats.total_cafes}
                </div>
            </Card>

            <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="mt-2 text-3xl font-semibold">
                    {stats.active_users}
                </div>
            </Card>

            <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Referrals</div>
                <div className="mt-2 text-3xl font-semibold">
                    {stats.total_referrals}
                </div>
            </Card>

            <Card className="p-4 md:col-span-2 min-h-[260px]">
                Recent Activity feed…
            </Card>

            <Card className="p-4 min-h-[260px]">
                Map / Heatmap placeholder…
            </Card>
        </div>
    );
}
