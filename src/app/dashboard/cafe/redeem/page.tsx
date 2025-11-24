"use client";

import { useState, useMemo } from "react";
import { useCafeRedeems } from "@/hooks/useRedeem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useCafeUser } from "@/hooks/useCafeUser";
import { RedeemTable } from "../../components/ui/RedeemTable";
import { Search, RotateCcw, Loader2 } from "lucide-react";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";

export default function RedeemPage() {
    const { user, loading } = useCafeUser(["cafe_staff", "cafe_admin"]);
    const cafeId = user?.cafe_id ?? null;

    const {
        data: allRedeems = [],
        isLoading,
        refetch,        // <-- ADD REFRESH
        isFetching,     // <-- DISABLE BUTTON WHEN REFRESHING
    } = useCafeRedeems(cafeId || "");

    const [searchText, setSearchText] = useState("");

    const initiated = allRedeems.filter((r: any) => !r.is_redeemed);
    const confirmed = allRedeems.filter((r: any) => r.is_redeemed);

    const filteredInitiated = useMemo(() => {
        if (!searchText.trim()) return initiated;
        const q = searchText.toLowerCase();
        return initiated.filter((r: any) =>
            r.user_mobile_no?.toLowerCase().includes(q) ||
            r.user_name?.toLowerCase().includes(q) ||
            r.item_name?.toLowerCase().includes(q) ||
            r.redeem_code?.toLowerCase().includes(q) ||
            r.initiater_role?.toLowerCase().includes(q)
        );
    }, [initiated, searchText]);

    const filteredConfirmed = useMemo(() => {
        if (!searchText.trim()) return confirmed;
        const q = searchText.toLowerCase();
        return confirmed.filter((r: any) =>
            r.user_mobile_no?.toLowerCase().includes(q) ||
            r.user_name?.toLowerCase().includes(q) ||
            r.item_name?.toLowerCase().includes(q) ||
            r.redeem_code?.toLowerCase().includes(q) ||
            r.initiater_role?.toLowerCase().includes(q)
        );
    }, [confirmed, searchText]);

    const basePath = "/dashboard/cafe";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading your account...</p>
            </div>
        );
    }

    if (!cafeId) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500">
                Cafe ID not found.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white px-6 py-10">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-black">Redeems Dashboard</h1>
                    <p className="text-gray-500 text-sm">
                        Viewing redeems for{" "}
                        <span className="font-medium text-black">{user?.cafe_name}</span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 items-center">

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, mobile, item, or code..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="pl-8 w-[250px]"
                        />
                    </div>

                    {/* 🔄 REFRESH BUTTON */}
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2"
                    >
                        {isFetching ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <RotateCcw className="h-4 w-4" />
                                Refresh
                            </>
                        )}
                    </Button>

                    {/* Action Buttons */}
                    <Link href={`${basePath}/redeem/initiate`}>
                        <Button>Initiate Redeem</Button>
                    </Link>
                    <Link href={`${basePath}/redeem/confirm`}>
                        <Button variant="outline">Confirm Redeem</Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="initiated" className="w-full">

                <TabsList className="grid grid-cols-2 w-full md:w-1/3 mx-auto mb-8">
                    <TabsTrigger value="initiated">Initiated</TabsTrigger>
                    <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                </TabsList>

                <TabsContent value="initiated">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-red-500/80">Created Redeems</h2>
                        <span className="text-sm text-gray-500">
                            Total: {filteredInitiated.length}
                        </span>
                    </div>

                    {isLoading ? (
                        <p className="text-gray-500 text-center">Loading redeems...</p>
                    ) : filteredInitiated.length > 0 ? (
                        <div className="bg-white shadow rounded-xl p-4 border">
                            <RedeemTable data={filteredInitiated} />
                        </div>
                    ) : (
                        <div className="py-10 text-center text-gray-400 italic">
                            No created redeems found.
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="confirmed">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-green-700">Confirmed Redeems</h2>
                        <span className="text-sm text-gray-500">
                            Total: {filteredConfirmed.length}
                        </span>
                    </div>

                    {isLoading ? (
                        <p className="text-gray-500 text-center">Loading redeems...</p>
                    ) : filteredConfirmed.length > 0 ? (
                        <div className="bg-white shadow rounded-xl p-4 border">
                            <RedeemTable data={filteredConfirmed} />
                        </div>
                    ) : (
                        <div className="py-10 text-center text-gray-400 italic">
                            No confirmed redeems found.
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
