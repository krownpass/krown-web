"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Clock, Users, Phone, Edit3, Bell, History } from "lucide-react";

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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/* =========================
   TYPES
   ========================= */

type BookingStatus =
    | "pending"
    | "initiated"
    | "accepted"
    | "rejected"
    | "cancelled";

interface CafeBooking {
    booking_id: string;
    booking_date: string;
    booking_start_time: string;
    num_of_guests: number;
    special_request: string | null;
    booking_status: BookingStatus;
    transaction_id?: string | null;
    advance_paid: boolean;
    transaction_amount?: number | null;
    user_name: string;
    user_mobile_no: string;
    user_id: string;
    cafe_id: string;
    cafe_name?: string;
    created_at: string;
    notification_sent?: boolean; // << from backend
}

interface CafeSlotRow {
    slot_id: number;
    cafe_id: string;
    category: string;
    slot_time: string;
    is_available: boolean;
}

interface NotificationRow {
    notification_id: string;
    title: string;
    body: string;
    data: any;
    created_at: string;
}

/* =========================
   HELPERS
   ========================= */

const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const d = new Date();
    d.setHours(Number(h ?? 0), Number(m ?? 0), 0, 0);
    return format(d, "hh:mm a");
};

const formatDateTime = (iso: string) => {
    if (!iso) return "";
    return format(new Date(iso), "dd MMM yyyy • hh:mm a");
};

const STATUS_ORDER: Record<BookingStatus, number> = {
    pending: 0,
    initiated: 0,
    accepted: 1,
    rejected: 2,
    cancelled: 2,
};

const statusStyles = {
    pending: {
        label: "Pending",
        badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
    },
    initiated: {
        label: "Pending",
        badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
    },
    accepted: {
        label: "Accepted",
        badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    },
    rejected: {
        label: "Rejected",
        badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
    },
    cancelled: {
        label: "Cancelled",
        badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    },
};

/* =========================
   MAIN PAGE
   ========================= */

export default function CafeBookingsPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useCafeUser([
        "cafe_admin",
        "cafe_staff",
    ]);
    const cafeId = user?.cafe_id;
    const queryClient = useQueryClient();

    const [view, setView] = useState<"recent" | "past">("recent");
    const [search, setSearch] = useState("");

    // BOOKINGS
    const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
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
    const { data: slotsData, isLoading: slotsLoading } = useQuery({
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
        mutationFn: async (payload: { id: string; status: BookingStatus }) =>
            api.patch(`/bookings/${payload.id}/status`, {
                status: payload.status,
            }),

        onSuccess: () => {
            toast.success("Booking status updated");
            queryClient.invalidateQueries({ queryKey: ["cafe-bookings"] });
        },
        onError: () => toast.error("Failed to update booking"),
    });

    const handleStatusChange = (id: string, status: BookingStatus) =>
        updateStatusMutation.mutate({ id, status });

    const toggleSlotMutation = useMutation({
        mutationFn: async (payload: {
            category: string;
            hour: number;
            is_available: boolean;
        }) =>
            api.patch(`/bookings/cafe-slots/availability`, {
                cafe_id: cafeId,
                category: payload.category,
                hour: payload.hour,
                is_available: payload.is_available,
            }),

        onSuccess: () => {
            toast.success("Slot availability updated");
            queryClient.invalidateQueries({
                queryKey: ["cafe-slots-manage"],
            });
        },
        onError: () => toast.error("Failed to update slot"),
    });

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
            const ao = STATUS_ORDER[a.booking_status];
            const bo = STATUS_ORDER[b.booking_status];
            if (ao !== bo) return ao - bo;

            const aDt = new Date(`${a.booking_date}T${a.booking_start_time}`);
            const bDt = new Date(`${b.booking_date}T${b.booking_start_time}`);
            return bDt.getTime() - aDt.getTime();
        });
    }, [bookingsData]);

    if (userLoading)
        return (
            <p className="mt-10 text-center text-sm text-muted-foreground">
                Loading café info…
            </p>
        );

    if (!cafeId) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 md:p-10 space-y-8"
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Booking & Slot Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Review incoming bookings and manage time slot
                        availability.
                    </p>
                </div>

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

            <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
                {/* BOOKINGS */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-slate-500" />
                                Bookings
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Accept, reject, notify, or review customer
                                bookings.
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
                        <Tabs
                            value={view}
                            onValueChange={(v) =>
                                setView(v as "recent" | "past")
                            }
                        >
                            <TabsList className="mb-4">
                                <TabsTrigger value="recent">
                                    Recent
                                </TabsTrigger>
                                <TabsTrigger value="past">Past</TabsTrigger>
                            </TabsList>

                            <TabsContent value="recent">
                                <BookingsList
                                    bookings={sortedBookings}
                                    loading={bookingsLoading}
                                    isPast={false}
                                    onUpdate={handleStatusChange}
                                    router={router}
                                />
                            </TabsContent>

                            <TabsContent value="past">
                                <BookingsList
                                    bookings={sortedBookings}
                                    loading={bookingsLoading}
                                    isPast
                                    onUpdate={handleStatusChange}
                                    router={router}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* SLOTS */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2">
                            <span>Time Slots</span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                Toggle availability
                            </span>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                        {slotsLoading && (
                            <p className="text-sm text-muted-foreground">
                                Loading slots…
                            </p>
                        )}

                        {!slotsLoading &&
                            Object.keys(slotsByCategory).length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No slots configured. Use update button to
                                    add slots.
                                </p>
                            )}

                        <AnimatePresence>
                            {Object.entries(slotsByCategory).map(
                                ([category, list]) => (
                                    <motion.div
                                        key={category}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="rounded-xl border bg-slate-50/60 p-3 space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold">
                                                {category}
                                            </h3>
                                            <span className="text-xs text-muted-foreground">
                                                {list.length} slot
                                                {list.length !== 1
                                                    ? "s"
                                                    : ""}
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
                                                            {formatTime(
                                                                slot.slot_time,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs text-muted-foreground">
                                                            {slot.is_available
                                                                ? "Available"
                                                                : "Blocked"}
                                                        </Label>
                                                        <Switch
                                                            checked={
                                                                slot.is_available
                                                            }
                                                            onCheckedChange={(
                                                                next,
                                                            ) =>
                                                                handleSlotToggle(
                                                                    slot,
                                                                    next,
                                                                )
                                                            }
                                                            disabled={
                                                                toggleSlotMutation.isPending
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ),
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

/* =============================================
   BOOKINGS LIST COMPONENT — UPGRADED NOTIFICATIONS
   ============================================= */

function BookingsList({
    bookings,
    loading,
    isPast,
    onUpdate,
    router,
}: {
    bookings: CafeBooking[];
    loading: boolean;
    isPast: boolean;
    onUpdate: (id: string, status: BookingStatus) => void;
    router: ReturnType<typeof useRouter>;
}) {
    const queryClient = useQueryClient();

    // Notification modal state
    const [notifyTarget, setNotifyTarget] = useState<{
        booking: CafeBooking;
        preset?: "accepted" | "rejected" | "generic";
    } | null>(null);
    const [message, setMessage] = useState("");

    // Confirm dialog for Accept/Reject
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        booking: CafeBooking;
        status: BookingStatus;
    } | null>(null);

    // History modal
    const [historyBooking, setHistoryBooking] = useState<CafeBooking | null>(
        null,
    );

    const {
        data: historyData,
        isLoading: historyLoading,
    } = useQuery({
        queryKey: ["booking-notifications", historyBooking?.booking_id],
        enabled: !!historyBooking,
        queryFn: async () => {
            if (!historyBooking) return [];
            const res = await api.get("/notifications", {
                params: {
                    // You can filter by booking_id in data JSON on backend:
                    // WHERE data->>'booking_id' = $1
                    booking_id: historyBooking.booking_id,
                    user_id: historyBooking.user_id,
                },
            });
            return res.data.data as NotificationRow[];
        },
    });

    /* ========= Notification Templates & Defaults ========= */

    const templates = {
        accepted: [
            "Your booking has been accepted. We look forward to seeing you!",
            "Your reservation is confirmed! See you soon at our café.",
        ],
        rejected: [
            "Your booking has been rejected. Please contact us for more details.",
            "We’re unable to confirm your booking at this time. Please reach out to the café.",
        ],
        generic: [
            "Your booking is being processed. We will update you shortly.",
            "Thank you for booking with us! We will keep you updated.",
        ],
    };

    const buildDefaultMessage = (
        booking: CafeBooking,
        preset?: "accepted" | "rejected" | "generic",
    ) => {
        const base =
            booking.cafe_name || "the café";

        switch (preset) {
            case "accepted":
                return `Great news! Your booking at ${base} has been accepted. We look forward to hosting you.`;
            case "rejected":
                return `We’re sorry, but your booking at ${base} could not be confirmed. Please contact us for assistance.`;
            case "generic":
            default:
                return `Your booking at ${base} is being processed. We’ll update you soon.`;
        }
    };

    const openNotifyModal = (
        booking: CafeBooking,
        preset: "accepted" | "rejected" | "generic" = "generic",
    ) => {
        setNotifyTarget({ booking, preset });
        setMessage(buildDefaultMessage(booking, preset));
    };

    /* ========= Send Notification ========= */

    const sendNotification = useMutation({
        mutationFn: async () => {
            if (!notifyTarget) return;
            const { booking } = notifyTarget;

            return api.post("/push/send", {
                user_id: booking.user_id,
                title: "Booking Update",
                body: message,
                data: {
                    booking_id: booking.booking_id,
                    cafe_id: booking.cafe_id,
                },
            });
        },
        onSuccess: () => {
            toast.success("Notification sent");
            setNotifyTarget(null);
            setMessage("");

            // Refresh bookings so notification_sent is true
            queryClient.invalidateQueries({
                queryKey: ["cafe-bookings"],
            });
        },
        onError: () => toast.error("Failed to send notification"),
    });

    /* ========= Accept / Reject Flow with CONFIRM ========= */

    const confirmStatusChange = (booking: CafeBooking, status: BookingStatus) => {
        setPendingStatusChange({ booking, status });
    };

    const handleStatusConfirm = (sendAlso: boolean) => {
        if (!pendingStatusChange) return;
        const { booking, status } = pendingStatusChange;

        // 1. Update booking status
        onUpdate(booking.booking_id, status);

        // 2. Optionally open notification modal with preset
        if (sendAlso && !booking.notification_sent) {
            const preset =
                status === "accepted"
                    ? "accepted"
                    : status === "rejected"
                        ? "rejected"
                        : "generic";
            openNotifyModal(booking, preset);
        }

        setPendingStatusChange(null);
    };

    if (loading)
        return (
            <p className="text-sm text-muted-foreground">
                Loading bookings…
            </p>
        );

    if (!bookings.length)
        return (
            <p className="text-sm text-muted-foreground">
                No bookings found.
            </p>
        );

    return (
        <>
            {/* =============== NOTIFICATION MODAL =============== */}
            <Dialog
                open={!!notifyTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setNotifyTarget(null);
                        setMessage("");
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Send Notification</DialogTitle>
                        {notifyTarget?.booking && (
                            <DialogDescription>
                                To:{" "}
                                <span className="font-medium">
                                    {notifyTarget.booking.user_name}
                                </span>
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {/* Templates */}
                    <div className="mb-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                            Quick templates
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {(notifyTarget?.preset === "accepted"
                                ? templates.accepted
                                : notifyTarget?.preset === "rejected"
                                    ? templates.rejected
                                    : templates.generic
                            ).map((tpl, idx) => (
                                <Button
                                    key={idx}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-[11px] rounded-full"
                                    onClick={() => setMessage(tpl)}
                                >
                                    Use: “
                                    {tpl.length > 28
                                        ? tpl.slice(0, 25) + "..."
                                        : tpl}
                                    ”
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Message box */}
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[120px]"
                        placeholder="Type a custom message…"
                    />

                    <Button
                        className="w-full mt-3"
                        disabled={sendNotification.isPending || !message.trim()}
                        onClick={() => sendNotification.mutate()}
                    >
                        {sendNotification.isPending
                            ? "Sending…"
                            : "Send Notification"}
                    </Button>
                </DialogContent>
            </Dialog>

            {/* =============== STATUS CONFIRMATION MODAL =============== */}
            <Dialog
                open={!!pendingStatusChange}
                onOpenChange={(open) => {
                    if (!open) setPendingStatusChange(null);
                }}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Confirm status change</DialogTitle>
                        {pendingStatusChange && (
                            <DialogDescription>
                                Change booking for{" "}
                                <span className="font-medium">
                                    {pendingStatusChange.booking.user_name}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold">
                                    {pendingStatusChange.status.toUpperCase()}
                                </span>
                                ?
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-2 text-xs text-muted-foreground">
                        <p>
                            You can choose to update the status only, or update
                            and notify the customer.
                        </p>
                        <p className="text-[11px]">
                            Since you chose{" "}
                            <span className="font-semibold">
                                BLOCK_RESEND
                            </span>
                            , notification can be sent only once per booking.
                        </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusConfirm(false)}
                        >
                            Update only
                        </Button>

                        {/* Only show "Update & Notify" if notification not sent yet */}
                        {pendingStatusChange &&
                            !pendingStatusChange.booking.notification_sent && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleStatusConfirm(true)}
                                >
                                    Update & notify
                                </Button>
                            )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* =============== HISTORY MODAL =============== */}
            <Dialog
                open={!!historyBooking}
                onOpenChange={(open) => {
                    if (!open) setHistoryBooking(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Notification history</DialogTitle>
                        {historyBooking && (
                            <DialogDescription>
                                Booking for{" "}
                                <span className="font-medium">
                                    {historyBooking.user_name}
                                </span>
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {historyLoading ? (
                        <p className="text-sm text-muted-foreground">
                            Loading notifications…
                        </p>
                    ) : !historyData || historyData.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No notifications found for this booking.
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                            {historyData.map((n) => (
                                <div
                                    key={n.notification_id}
                                    className="rounded-lg border bg-slate-50 px-3 py-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold">
                                            {n.title}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDateTime(n.created_at)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-700">
                                        {n.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* =============== BOOKINGS LIST =============== */}
            <div className="space-y-3">
                <AnimatePresence>
                    {bookings.map((b) => {
                        const style =
                            statusStyles[b.booking_status] ||
                            statusStyles.pending;

                        const notificationDisabled = !!b.notification_sent; // BLOCK_RESEND

                        return (
                            <motion.div
                                key={b.booking_id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="rounded-2xl border bg-white px-4 py-3 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                            >
                                {/* LEFT */}
                                <div className="flex flex-1 flex-col gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold">
                                            {b.user_name}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3" />
                                            {b.user_mobile_no}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(
                                                new Date(b.booking_date),
                                                "dd MMM yyyy",
                                            )}{" "}
                                            •{" "}
                                            {formatTime(
                                                b.booking_start_time,
                                            )}
                                        </span>

                                        <span className="inline-flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {b.num_of_guests} guests
                                        </span>
                                    </p>

                                    {b.special_request && (
                                        <p className="mt-1 text-xs text-slate-600">
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
                                                onClick={() =>
                                                    router.push(
                                                        `/dashboard/cafe/payment-report/${b.transaction_id}`,
                                                    )
                                                }
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

                                    {b.notification_sent && (
                                        <span className="mt-1 text-[11px] text-emerald-700 inline-flex items-center gap-1">
                                            <Bell className="h-3 w-3" />
                                            Notification sent
                                        </span>
                                    )}
                                </div>

                                {/* RIGHT */}
                                <div className="flex flex-col items-end gap-2 md:items-end">
                                    <span className="text-[11px] text-muted-foreground">
                                        {formatDateTime(b.created_at)}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {/* View history */}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() =>
                                                setHistoryBooking(b)
                                            }
                                        >
                                            <History className="h-4 w-4" />
                                        </Button>

                                        {/* Notify */}
                                        {/* Notify button (disabled if already sent) */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={`h-8 flex items-center gap-1 text-xs rounded-full ${b.notification_sent ? "opacity-50 cursor-not-allowed" : ""
                                                }`}
                                            disabled={b.notification_sent}
                                            onClick={() => {
                                                if (b.notification_sent) return;
                                                openNotifyModal(b, "generic");
                                            }}
                                        >
                                            <Bell className="h-3 w-3" />
                                            {b.notification_sent ? "Notified" : "Notify"}
                                        </Button>

                                        {/* Extra helper text if disabled */}
                                        {b.notification_sent && (
                                            <span className="text-[10px] text-emerald-600 font-medium mt-1">
                                                Already notified
                                            </span>
                                        )}

                                        {/* Accept / Reject */}
                                        {!isPast &&
                                            (b.booking_status ===
                                                "pending" ||
                                                b.booking_status ===
                                                "initiated") && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="h-8 rounded-full bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700"
                                                        onClick={() =>
                                                            confirmStatusChange(
                                                                b,
                                                                "accepted",
                                                            )
                                                        }
                                                    >
                                                        Accept
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 rounded-full border-rose-400 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                                        onClick={() =>
                                                            confirmStatusChange(
                                                                b,
                                                                "rejected",
                                                            )
                                                        }
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </>
    );
}
