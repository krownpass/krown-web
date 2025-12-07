
"use client";

import {
    Card
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";
import { Flame } from "lucide-react";
import { useState } from "react";

type FootfallPoint = {
    date: string;
    count: number;
};

type FootfallWeeklyPoint = {
    weekStart: string;
    count: number;
};

type FootfallMonthlyPoint = {
    monthStart: string;
    count: number;
};

type Props = {
    loading: boolean;
    daily: FootfallPoint[];
    weekly: FootfallWeeklyPoint[];
    monthly: FootfallMonthlyPoint[];
};

export default function FootfallCard({
    loading,
    daily,
    weekly,
    monthly,
}: Props) {
    const [mode, setMode] = useState<"daily" | "weekly" | "monthly">("daily");

    const data =
        mode === "daily"
            ? daily
            : mode === "weekly"
                ? weekly.map((w) => ({
                    date: w.weekStart,
                    count: w.count,
                }))
                : monthly.map((m) => ({
                    date: m.monthStart,
                    count: m.count,
                }));

    const totalVisits = data.reduce((a, c) => a + c.count, 0);

    return (
        <Card className="rounded-2xl border p-4 shadow-sm">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Footfall via Krown
                    </p>
                    <p className="text-[10px] text-muted-foreground -mt-1">
                        Daily | Weekly | Monthly insights
                    </p>
                </div>
                <div className="rounded-full bg-orange-50 p-2">
                    <Flame className="h-4 w-4 text-orange-600" />
                </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-2 mb-4">
                {(["daily", "weekly", "monthly"] as const).map((opt) => (
                    <button
                        key={opt}
                        onClick={() => setMode(opt)}
                        className={`px-3 py-1 text-xs rounded-full border transition ${mode === opt
                                ? "bg-primary text-white border-primary"
                                : "text-muted-foreground hover:bg-accent"
                            }`}
                    >
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                ))}
            </div>

            {/* Total visits */}
            <div className="mb-3">
                <p className="text-[10px] text-muted-foreground">Total visits</p>
                <p className="text-xl font-semibold">{totalVisits}</p>
            </div>

            {/* Chart */}
            <div className="h-[200px]">
                {loading ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                ) : data.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No visits recorded.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar
                                dataKey="count"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}
