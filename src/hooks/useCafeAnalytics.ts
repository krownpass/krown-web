"use client";

import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type ExtendedRange =
    | "7d"
    | "30d"
    | "90d"
    | "6m"
    | "1y"
    | "2y"
    | "3y"
    | "custom";

export type FootfallPoint = {
    date: string;
    count: number;
};

export type FootfallWeeklyPoint = {
    weekStart: string;
    count: number;
};

export type FootfallMonthlyPoint = {
    monthStart: string;
    count: number;
};
export type PeakHourPoint = {
    hour: number;
    count: number;
};

export type RevenueByDayPoint = {
    date: string;
    totalRevenue: number;
    dineoutRevenue: number;
    membershipRevenue: number;
};

export type SummaryMetrics = {
    totalCustomersServed: number;
    averageSpendPerCustomer: number;
    averageGroupSize: number;
    totalFreeDrinksRedeemed: number;
    mostRedeemedItemId: number | null;
    upsellRevenue: number;
    totalRevenue: number;
    averageBillValue: number;
};

export type NewReturningCustomers = {
    newCustomers: number;
    returningCustomers: number;
};

export interface KrownCafeAnalyticsResponse {
    summary: SummaryMetrics;

    footfallDaily: FootfallPoint[];
    footfallGroups: {
        daily: FootfallPoint[];
        weekly: FootfallWeeklyPoint[];
        monthly: FootfallMonthlyPoint[];
    };

    newVsReturning: {
        newCustomers: number;
        returningCustomers: number;
        newCustomersList: any[];
        returningCustomersList: any[];
    };

    peakHours: PeakHourPoint[];
    revenueByDay: RevenueByDayPoint[];

    newUsersPreview: any[];
    allNewUsers: any[];

    drinkRedemptions: {
        totalRedeemed: number;
        top5: {
            item_id: number;
            item_name: string;
            count: number;
        }[];
    } | null;
}
export type AnalyticsRange = "7d" | "10d" | "1m" | "3m" | "6m" | "1y";

export interface CafeAnalyticsSummary {
    total_amount: number;
    paid_bookings: number;
    normal_bookings: number;
}

export interface CafeAnalyticsChartPoint {
    date: string;
    total_amount: number;
    paid_amount: number;
    normal_amount: number;
    paid_count: number;
    normal_count: number;
}

export interface CafeAnalyticsRow {
    booking_id: string;
    booking_date: string;
    booking_start_time: string;
    booking_status: string;
    advance_paid: boolean;
    transaction_amount: number | null;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    transaction_id: string | null;
    user_name: string;
    user_mobile_no: string;
    payment_mode: string | null;
    transaction_status: string | null;
    transaction_created_at: string | null;
}

export interface CafeAnalyticsResponse {
    summary: CafeAnalyticsSummary;
    chart: CafeAnalyticsChartPoint[];
    rows: CafeAnalyticsRow[];
}

export const useCafeAnalytics = (
    cafeId?: string,
    range: AnalyticsRange = "7d",
    search?: string
) =>
    useQuery<CafeAnalyticsResponse>({
        queryKey: ["cafe-analytics", cafeId, range, search],
        queryFn: async () => {
            if (!cafeId) throw new Error("Cafe ID missing");
            const res = await api.get(`/bookings/cafe-analytics/${cafeId}`, {
                params: { range, search: search || undefined },
            });
            return res.data.data as CafeAnalyticsResponse;
        },
        enabled: !!cafeId,
        refetchOnWindowFocus: false,
    });


// Types (match your backend Krown café analytics response)
// ----------------------------------------------------------
// ----------------------------------------------------------
// Hook
// ----------------------------------------------------------

export function useCafeKrownAnalytics(

    cafeId?: string,
    range: ExtendedRange = "30d",
    from?: string | null,
    to?: string | null
) {
    return useQuery<KrownCafeAnalyticsResponse>({
        queryKey: ["cafe-krown-analytics", cafeId, range, from, to],

        queryFn: async () => {
            if (!cafeId) throw new Error("Cafe ID missing");

            const params: any = { range };
            if (from) params.from = from;
            if (to) params.to = to;

            const res = await api.get(`/krown/cafe/${cafeId}/analytics`, {
                params,
            });

            if (!res.data.success) {
                throw new Error(res.data.message || "Failed to load café analytics");
            }

            return res.data.data as KrownCafeAnalyticsResponse;
        },

        enabled: !!cafeId,
        refetchOnWindowFocus: false,
        staleTime: 60 * 1000,
    });
}
