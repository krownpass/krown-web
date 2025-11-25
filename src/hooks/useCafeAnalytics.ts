"use client";

import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type AnalyticsRange = "7d" | "10d" | "1m" | "3m" | "6m" | "1y";

export interface CafeAnalyticsSummary {
    total_amount: number;
    paid_bookings: number;
    normal_bookings: number;
}

export interface CafeAnalyticsChartPoint {
    date: string;          // ISO
    total_amount: number;  // total revenue for the day
    paid_amount: number;   // paid revenue for the day
    normal_amount: number; // normal revenue (if any)
    paid_count: number;    // # of paid bookings that day
    normal_count: number;  // # of normal bookings that day
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
            console.log(res.data.data);
            return res.data.data as CafeAnalyticsResponse;
        },
        enabled: !!cafeId,
        refetchOnWindowFocus: false,
    });
