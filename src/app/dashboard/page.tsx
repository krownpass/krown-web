"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    CartesianGrid,
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar as RechartsBar,
} from "recharts";

import {
    Users,
    IndianRupee,
    BarChart as BarChartIcon,
    TrendingUp,
    RefreshCcw,
    ChevronRight,
    Search,
} from "lucide-react";

import { useCafeUser } from "@/hooks/useCafeUser";
import { ExtendedRange, useCafeKrownAnalytics } from "@/hooks/useCafeAnalytics";
import FootfallCard from "./components/ui/FootFallCard";

// Helper formatting
const formatLocalDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-CA");

const numberFormat = (v: number) => new Intl.NumberFormat("en-IN").format(v);

const currencyFormat = (v: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(v);

export default function CafeDashboardPage() {
    const { user, loading: userLoading } = useCafeUser(["cafe_admin", "cafe_staff"]);
    const [range, setRange] = useState<ExtendedRange>("30d");

    const { data, isLoading, isFetching, refetch } =
        useCafeKrownAnalytics(user?.cafe_id, range);

    // Modals
    const [showNewModal, setShowNewModal] = useState(false);
    const [newSearch, setNewSearch] = useState("");

    const [showDrinksModal, setShowDrinksModal] = useState(false);
    const [drinkSearch, setDrinkSearch] = useState("");

    const summary = data?.summary;
    const newUsersPreview = data?.newUsersPreview ?? [];
    const allNewUsers = data?.allNewUsers ?? [];

    // Drink redemptions: backend sends { totalRedeemed, top5 }
    const drinkRedemptions = data?.drinkRedemptions?.top5 ?? [];

    // NEW USER SEARCH
    const filteredNewUsers = useMemo(() => {
        return allNewUsers.filter((u: any) =>
            `${u.user_name} ${u.user_email} ${u.user_mobile_no}`
                .toLowerCase()
                .includes(newSearch.toLowerCase())
        );
    }, [newSearch, allNewUsers]);

    // DRINK SEARCH
    const filteredDrinks = useMemo(() => {
        return drinkRedemptions.filter((d: any) =>
            d.item_name.toLowerCase().includes(drinkSearch.toLowerCase())
        );
    }, [drinkSearch, drinkRedemptions]);

    if (userLoading) return <div className="p-10">Loading user…</div>;
    if (!user) return null;

    // FOOTFALL NORMALIZED
    const footfallDaily =
        data?.footfallDaily?.map((f) => ({
            ...f,
            date: formatLocalDate(f.date),
        })) ?? [];

    const revenueByDay =
        data?.revenueByDay?.map((r) => ({
            ...r,
            date: formatLocalDate(r.date),
        })) ?? [];

    const peakHours = data?.peakHours ?? [];
    const nr = data?.newVsReturning;

    // FIX: busiest hour (no TS error now)
    const busiest =
        peakHours.length > 0
            ? peakHours.reduce(
                (max, cur) => (cur.count > max.count ? cur : max),
                peakHours[0]
            )
            : null;

    // NEW vs RETURNING % calculation
    const totalNR = (nr?.newCustomers ?? 0) + (nr?.returningCustomers ?? 0);
    const newPct = totalNR ? (nr!.newCustomers / totalNR) * 100 : 0;
    const retPct = totalNR ? (nr!.returningCustomers / totalNR) * 100 : 0;

    // LOADING SKELETON
    const loadingCards = (
        <>
            <Skeleton className="h-[110px] rounded-2xl" />
            <Skeleton className="h-[110px] rounded-2xl" />
            <Skeleton className="h-[110px] rounded-2xl" />
            <Skeleton className="h-[110px] rounded-2xl" />
        </>
    );

    return (
        <TooltipProvider>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 pb-10"
            >
                {/* HEADER */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        {user.cafe_name} — Krown Analytics
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Footfall, Revenue, Redemptions & Customer insights
                    </p>
                </div>

                {/* FILTERS */}
                <div className="flex items-center gap-2 pt-2">
                    {(["7d", "30d", "90d", "6m", "1y"] as ExtendedRange[]).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`rounded-full px-3 py-1 text-xs border transition-all
                            ${range === r
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : "bg-background hover:bg-accent"
                                }`}
                        >
                            {r}
                        </button>
                    ))}

                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-xs border rounded-full hover:bg-accent transition"
                    >
                        <RefreshCcw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {isLoading || !summary ? (
                        loadingCards
                    ) : (
                        <>
                            {/* Customers */}
                            <Card className="rounded-2xl border p-5 shadow-sm bg-gradient-to-br from-slate-950 to-slate-900 text-white flex flex-col justify-between">
                                <div>
                                    <p className="text-[11px] uppercase text-slate-400 tracking-wide">
                                        Krown Customers
                                    </p>
                                    <p className="text-3xl font-semibold mt-2 leading-tight">
                                        {numberFormat(summary.totalCustomersServed)}
                                    </p>
                                </div>
                                <Users className="w-5 h-5 text-sky-300" />
                            </Card>

                            {/* Revenue */}
                            <Card className="rounded-2xl border p-5 shadow-sm">
                                <p className="text-[11px] uppercase text-muted-foreground tracking-wide">
                                    Revenue
                                </p>
                                <p className="text-3xl font-semibold mt-2 leading-tight">
                                    {currencyFormat(summary.totalRevenue)}
                                </p>
                                <IndianRupee className="w-5 h-5 text-emerald-600 mt-3" />
                            </Card>

                            {/* Avg Bill */}
                            <Card className="rounded-2xl border p-5 shadow-sm">
                                <p className="text-[11px] uppercase text-muted-foreground tracking-wide">
                                    Avg Bill Value
                                </p>
                                <p className="text-3xl font-semibold mt-2 leading-tight">
                                    {currencyFormat(summary.averageBillValue)}
                                </p>
                                <BarChartIcon className="w-5 h-5 text-indigo-600 mt-3" />
                            </Card>

                            {/* Upsell */}
                            <Card className="rounded-2xl border p-5 shadow-sm bg-gradient-to-br from-orange-50 to-rose-50">
                                <p className="text-[11px] uppercase text-amber-600 tracking-wide">
                                    Upsell Revenue
                                </p>
                                <p className="text-3xl font-semibold text-amber-800 mt-2 leading-tight">
                                    {currencyFormat(summary.upsellRevenue)}
                                </p>
                                <TrendingUp className="w-5 h-5 text-amber-700 mt-3" />
                            </Card>
                        </>
                    )}
                </div>

                <Separator />

                {/* REVENUE + NEW RETURNING */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue chart */}
                    <Card className="lg:col-span-2 p-5 rounded-2xl border shadow-sm">
                        <p className="text-[11px] uppercase text-muted-foreground">
                            Daywise Revenue
                        </p>

                        <div className="h-[260px] mt-4">
                            {isLoading ? (
                                <Skeleton className="h-full w-full rounded-xl" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueByDay}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" fontSize={10} tickLine={false} />
                                        <YAxis fontSize={10} tickLine={false} />
                                        <RechartsTooltip formatter={(v) => currencyFormat(v as number)} />
                                        <Line
                                            dataKey="totalRevenue"
                                            type="monotone"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    {/* New vs Returning */}
                    <Card className="p-5 rounded-2xl border shadow-sm relative">
                        <p className="text-[11px] uppercase text-muted-foreground">
                            New vs Returning
                        </p>

                        {!isLoading && (
                            <button
                                onClick={() => setShowNewModal(true)}
                                className="absolute top-5 right-5 text-xs flex items-center gap-1 text-blue-600 hover:underline"
                            >
                                View Customers <ChevronRight className="w-3 h-3" />
                            </button>
                        )}

                        {isLoading ? (
                            <Skeleton className="h-[80px] rounded-xl mt-4" />
                        ) : (
                            <>
                                <div className="flex justify-between text-sm mt-4">
                                    <p>
                                        <strong>New:</strong> {nr?.newCustomers} (
                                        {newPct.toFixed(1)}%)
                                    </p>
                                    <p>
                                        <strong>Returning:</strong> {nr?.returningCustomers} (
                                        {retPct.toFixed(1)}%)
                                    </p>
                                </div>

                                {/* SHOW NAMES (NEW + RETURNING UP TO 5) */}
                                <div className="mt-4 space-y-2">

                                    {/* SAFE COMBINED LIST */}
                                    {[
                                        ...((nr?.newCustomersList ?? []).map((u: any) => ({ ...u, type: "new" }))),
                                        ...((nr?.returningCustomersList ?? []).map((u: any) => ({ ...u, type: "returning" })))
                                    ]
                                        .slice(0, 5)
                                        .map((u: any) => (
                                            <div
                                                key={u.user_id}
                                                className="text-xs bg-slate-100 p-2 rounded-lg flex justify-between"
                                            >
                                                <span>
                                                    {u.user_name}{" "}
                                                    <span
                                                        className={
                                                            u.type === "new"
                                                                ? "text-green-600 font-semibold"
                                                                : "text-yellow-600 font-semibold"
                                                        }
                                                    >
                                                        ({u.type === "new" ? "New" : "Returning"})
                                                    </span>
                                                </span>

                                                <span className="text-muted-foreground">{u.user_mobile_no}</span>
                                            </div>
                                        ))}
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                                        style={{ width: `${newPct}%` }}
                                    />
                                </div>
                            </>
                        )}
                    </Card>
                </div>

                {/* NEW USER MODAL */}
                <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>New Customers</DialogTitle>
                        </DialogHeader>

                        <div className="flex items-center gap-2 mt-3">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, phone…"
                                value={newSearch}
                                onChange={(e) => setNewSearch(e.target.value)}
                            />
                        </div>

                        <div className="mt-4 max-h-[400px] overflow-y-auto space-y-3">
                            {filteredNewUsers.map((u: any) => (
                                <div
                                    key={u.user_id}
                                    className="p-3 border rounded-xl shadow-sm hover:bg-accent transition"
                                >
                                    <p className="font-semibold">{u.user_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {u.user_email || "No email"}
                                    </p>
                                    <p className="text-sm">{u.user_mobile_no}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Gender: {u.gender || "Not Provided"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* FOOTFALL CARD */}
                <FootfallCard
                    loading={isLoading}
                    daily={data?.footfallGroups.daily ?? []}
                    weekly={data?.footfallGroups.weekly ?? []}
                    monthly={data?.footfallGroups.monthly ?? []}
                />

                {/* PEAK HOURS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="p-5 rounded-2xl border shadow-sm lg:col-span-2">
                        <div className="flex justify-between items-center">
                            <p className="text-[11px] uppercase text-muted-foreground">
                                Peak Hours
                            </p>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-full">
                                        {busiest ? `Busiest: ${busiest.hour}:00` : "No data"}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Hour with the highest bookings
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="h-[200px] mt-4">
                            {isLoading ? (
                                <Skeleton className="h-full rounded-xl" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={peakHours}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="hour" fontSize={10} tickLine={false} />
                                        <YAxis fontSize={10} tickLine={false} />
                                        <RechartsTooltip />
                                        <RechartsBar dataKey="count" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    {/* FREE DRINKS */}
                    <Card className="p-5 rounded-2xl border shadow-sm relative">
                        <p className="text-[11px] uppercase text-muted-foreground">
                            Free Drink Redemptions
                        </p>

                        {!isLoading && (
                            <button
                                onClick={() => setShowDrinksModal(true)}
                                className="absolute top-5 right-5 text-xs flex items-center gap-1 text-blue-600 hover:underline"
                            >
                                View All <ChevronRight className="w-3 h-3" />
                            </button>
                        )}

                        {isLoading ? (
                            <Skeleton className="h-[80px] rounded-xl mt-4" />
                        ) : (
                            <>
                                <p className="text-2xl font-semibold mt-3">
                                    {numberFormat(summary?.totalFreeDrinksRedeemed ?? 0)}
                                </p>

                                <div className="mt-4 space-y-2">
                                    {drinkRedemptions.slice(0, 5).map((d: any) => (
                                        <div
                                            key={d.item_id}
                                            className="flex justify-between text-sm bg-slate-100 p-2 rounded-lg"
                                        >
                                            <span>{d.item_name}</span>
                                            <span className="text-muted-foreground">
                                                {d.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Card>
                </div>

                {/* DRINKS MODAL */}
                <Dialog open={showDrinksModal} onOpenChange={setShowDrinksModal}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Redeemed Drinks</DialogTitle>
                        </DialogHeader>

                        <div className="flex items-center gap-2 mt-3">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search drinks…"
                                value={drinkSearch}
                                onChange={(e) => setDrinkSearch(e.target.value)}
                            />
                        </div>

                        <div className="mt-4 max-h-[400px] overflow-y-auto space-y-3">
                            {filteredDrinks.map((d: any) => (
                                <div
                                    key={d.item_id}
                                    className="p-3 border rounded-xl shadow-sm bg-accent"
                                >
                                    <p className="font-semibold">{d.item_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Redeemed: {d.count}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </TooltipProvider>
    );
}
