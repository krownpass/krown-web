"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Clock, Users, Phone, Edit3 } from "lucide-react";

import api from "@/lib/api";
import { useCafeUser } from "@/hooks/useCafeUser";
import { toast } from "sonner";

import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";



// Format ISO timestamp into nice UI values
const formatDateTime = (iso: string) => {
    if (!iso) return "";
    return format(new Date(iso), "dd MMM yyyy • hh:mm a");
};
type BookingStatus = "pending" | "initiated" | "accepted" | "rejected" | "cancelled";

interface CafeBooking {
    booking_id: string;
    booking_date: string; // ISO date
    booking_start_time: string; // "HH:MM:SS"
    num_of_guests: number;
    special_request: string | null;
    booking_status: BookingStatus;

    transaction_id?: string | null;    // optional
    advance_paid: boolean;
    razorpay_payment_id?: string | null;
    transaction_amount?: number | null;
    transaction_status?: string | null;
    user_name: string;
    user_mobile_no: string;
    created_at: string;
}

interface CafeSlotRow {
    slot_id: number;
    cafe_id: string;
    category: string;
    slot_time: string; // "HH:MM:SS"
    is_available: boolean;
}

// HH:mm:ss → "hh:mm a"
const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const d = new Date();
    d.setHours(Number(h ?? 0), Number(m ?? 0), 0, 0);
    return format(d, "hh:mm a");
};

// order: pending → accepted → rejected/cancelled
const STATUS_ORDER: Record<BookingStatus, number> = {
    pending: 0,
    initiated: 0, // treat as pending
    accepted: 1,
    rejected: 2,
    cancelled: 2,
};

const statusStyles: Record<
    BookingStatus,
    { label: string; badgeClass: string; pillClass: string }
> = {
    pending: {
        label: "Pending",
        badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
        pillClass: "bg-amber-50 text-amber-700",
    },
    initiated: {
        label: "Pending",
        badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
        pillClass: "bg-amber-50 text-amber-700",
    },
    accepted: {
        label: "Accepted",
        badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
        pillClass: "bg-emerald-50 text-emerald-700",
    },
    rejected: {
        label: "Rejected",
        badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
        pillClass: "bg-rose-50 text-rose-700",
    },
    cancelled: {
        label: "Cancelled",
        badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
        pillClass: "bg-slate-50 text-slate-700",
    },
};

export default function CafeBookingsPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useCafeUser(["cafe_admin", "cafe_staff"]);
    const cafeId = user?.cafe_id;
    const queryClient = useQueryClient();

    const [view, setView] = useState<"recent" | "past">("recent");
    const [search, setSearch] = useState("");

    // BOOKINGS
    const {
        data: bookingsData,
        isLoading: bookingsLoading,
    } = useQuery({
        queryKey: ["cafe-bookings", cafeId, view, search],
        enabled: !!cafeId,
        queryFn: async () => {
            const res = await api.get(`/bookings/cafe/${cafeId}`, {
                params: { view, search: search || undefined },
            });
            return res.data.data as CafeBooking[];
        },
    });

    // SLOTS
    const {
        data: slotsData,
        isLoading: slotsLoading,
    } = useQuery({
        queryKey: ["cafe-slots-manage", cafeId],
        enabled: !!cafeId,
        queryFn: async () => {
            const res = await api.get(`/bookings/cafe-slots/manage/${cafeId}`);
            return res.data.data as CafeSlotRow[];
        },
    });

    const slotsByCategory = useMemo(() => {
        const map: Record<string, CafeSlotRow[]> = {};
        (slotsData || []).forEach((slot) => {
            if (!map[slot.category]) map[slot.category] = [];
            map[slot.category].push(slot);
        });

        Object.values(map).forEach((list) =>
            list.sort((a, b) => a.slot_time.localeCompare(b.slot_time)),
        );

        return map;
    }, [slotsData]);

    // MUTATIONS
    const updateStatusMutation = useMutation({
        mutationFn: async (payload: { id: string; status: BookingStatus }) => {
            return api.patch(`/bookings/${payload.id}/status`, {
                status: payload.status,
            });
        },
        onSuccess: () => {
            toast.success("Booking status updated");
            queryClient.invalidateQueries({ queryKey: ["cafe-bookings"] });
        },
        onError: () => {
            toast.error("Failed to update booking");
        },
    });

    const toggleSlotMutation = useMutation({
        mutationFn: async (payload: {
            category: string;
            hour: number;
            is_available: boolean;
        }) => {
            return api.patch(`/bookings/cafe-slots/availability`, {
                cafe_id: cafeId,
                category: payload.category,
                hour: payload.hour,
                is_available: payload.is_available,
            });
        },
        onSuccess: () => {
            toast.success("Slot availability updated");
            queryClient.invalidateQueries({ queryKey: ["cafe-slots-manage"] });
        },
        onError: () => {
            toast.error("Failed to update slot");
        },
    });

    const handleStatusChange = (id: string, status: BookingStatus) => {
        updateStatusMutation.mutate({ id, status });
    };

    const handleSlotToggle = (slot: CafeSlotRow, next: boolean) => {
        const [hourStr] = slot.slot_time.split(":");
        const hour = Number(hourStr);
        toggleSlotMutation.mutate({
            category: slot.category,
            hour,
            is_available: next,
        });
    };

    const sortedBookings = useMemo(() => {
        const list = bookingsData || [];
        return [...list].sort((a, b) => {
            const ao = STATUS_ORDER[a.booking_status] ?? 99;
            const bo = STATUS_ORDER[b.booking_status] ?? 99;
            if (ao !== bo) return ao - bo;
            // newer first by date + time
            const aDt = new Date(`${a.booking_date}T${a.booking_start_time}`);
            const bDt = new Date(`${b.booking_date}T${b.booking_start_time}`);
            return bDt.getTime() - aDt.getTime();
        });
    }, [bookingsData]);

    if (userLoading) {
        return (
            <p className="mt-10 text-center text-sm text-muted-foreground">
                Loading café info…
            </p>
        );
    }

    if (!cafeId) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 md:p-10 space-y-8"
        >
            {/* HEADER */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Booking & Slot Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Review incoming bookings and control which time slots are open.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/dashboard/cafe/update")}
                        className="gap-2"
                    >
                        <Edit3 className="h-4 w-4" />
                        Update slots & café details
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
                {/* BOOKINGS COLUMN */}
                <Card className="shadow-sm border-border/70 bg-gradient-to-b from-white to-slate-50">
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-slate-500" />
                                Bookings
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Accept, reject, or review bookings from your guests.
                            </p>
                        </div>

                        <Input
                            placeholder="Search by name or phone…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full max-w-xs"
                        />
                    </CardHeader>

                    <CardContent>
                        <Tabs value={view} onValueChange={(v) => setView(v as "recent" | "past")}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="recent">Recent</TabsTrigger>
                                <TabsTrigger value="past">Past</TabsTrigger>
                            </TabsList>

                            <TabsContent value="recent" className="mt-0">
                                <BookingsList
                                    bookings={sortedBookings}
                                    loading={bookingsLoading}
                                    isPast={false}
                                    onUpdate={handleStatusChange}
                                />
                            </TabsContent>

                            <TabsContent value="past" className="mt-0">
                                <BookingsList
                                    bookings={sortedBookings}
                                    loading={bookingsLoading}
                                    isPast
                                    onUpdate={handleStatusChange}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* SLOTS COLUMN */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2">
                            <span>Time Slots</span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                Toggle availability for each time
                            </span>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                        {slotsLoading && (
                            <p className="text-sm text-muted-foreground">Loading slots…</p>
                        )}

                        {!slotsLoading && Object.keys(slotsByCategory).length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No slots configured yet. Use “Update slots & café details” to add them.
                            </p>
                        )}

                        <AnimatePresence>
                            {Object.entries(slotsByCategory).map(([category, list]) => (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="rounded-xl border bg-slate-50/60 p-3 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">{category}</h3>
                                        <span className="text-xs text-muted-foreground">
                                            {list.length} slot{list.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {list.map((slot) => (
                                            <div
                                                key={slot.slot_id}
                                                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm border border-slate-100"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-medium">
                                                        {formatTime(slot.slot_time)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground">
                                                        {slot.is_available ? "Available" : "Blocked"}
                                                    </Label>
                                                    <Switch
                                                        checked={slot.is_available}
                                                        onCheckedChange={(next) => handleSlotToggle(slot, next)}
                                                        disabled={toggleSlotMutation.isLoading}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

function BookingsList({
    bookings,
    loading,
    isPast,
    onUpdate,
}: {
    bookings: CafeBooking[];
    loading: boolean;
    isPast: boolean;
    onUpdate: (id: string, status: BookingStatus) => void;
}) {
    if (loading) {
        return (
            <p className="text-sm text-muted-foreground">Loading bookings…</p>
        );
    }

    if (!bookings.length) {
        return (
            <p className="text-sm text-muted-foreground">
                No bookings found for this view.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <AnimatePresence>
                {bookings.map((b) => {
                    const style = statusStyles[b.booking_status] ?? statusStyles.pending;

                    return (
                        <motion.div
                            key={b.booking_id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className={`rounded-2xl border bg-white px-4 py-3 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${b.booking_status === "pending" || b.booking_status === "initiated"
                                ? "border-amber-200"
                                : b.booking_status === "accepted"
                                    ? "border-emerald-200"
                                    : b.booking_status === "rejected"
                                        ? "border-rose-200"
                                        : "border-slate-200"
                                }`}
                        >
                            {/* LEFT: guest + date/time */}
                            <div className="flex flex-1 flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold">{b.user_name}</span>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        {b.user_mobile_no}
                                    </span>
                                </div>

                                <p className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(b.booking_date), "dd MMM yyyy")} •{" "}
                                        {formatTime(b.booking_start_time)}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {b.num_of_guests} guests
                                    </span>
                                </p>

                                {b.special_request && (
                                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                                        “{b.special_request}”
                                    </p>
                                )}

                                {b.advance_paid && (
                                    <div className="flex items-center gap-3 mt-1">
                                        <Badge className="bg-emerald-200 text-emerald-800 border border-emerald-300">
                                            Paid Booking
                                        </Badge>

                                        <span className="text-xs font-medium text-emerald-700">
                                            ₹{b.transaction_amount}
                                        </span>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs text-black hover:bg-blue-50"
                                            onClick={() => router.push(`/dashboard/cafe/payment-report/${b.transaction_id}`)}
                                        >
                                            View Payment Report
                                        </Button>
                                    </div>
                                )}
                                <Badge
                                    className={`mt-2 w-fit px-2.5 py-0.5 text-[11px] font-medium ${style.badgeClass}`}
                                    variant="secondary"
                                >
                                    {style.label}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[11px] text-muted-foreground">
                                    {formatDateTime(b.created_at)}
                                </span>
                                {!isPast &&
                                    (b.booking_status === "pending" ||
                                        b.booking_status === "initiated") && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="h-8 rounded-full bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700"
                                                onClick={() => onUpdate(b.booking_id, "accepted")}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-full border-rose-400 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                                onClick={() => onUpdate(b.booking_id, "rejected")}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
