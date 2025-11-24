"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCafeUser } from "@/hooks/useCafeUser";
import { useCafeRedeemsManual, useConfirmRedeem } from "@/hooks/useRedeem";
import {
    Loader2,
    Search,
    CheckCircle2,
    User,
    Phone,
    Coffee,
    AlertTriangle,
} from "lucide-react";


// ✅ Normalize but ALWAYS return "+91XXXXXXXXXX"
const normalizeMobile = (mobile: string) => {
    let m = mobile.replace(/\s|-/g, "");

    if (m.startsWith("+91")) m = m.slice(3);
    else if (m.startsWith("91")) m = m.slice(2);

    // Now m must be 10 digits
    if (m.length === 10 && /^\d{10}$/.test(m)) {
        return `+91${m}`;
    }

    return null; // invalid mobile
};

export default function ConfirmRedeemPage() {
    const [userMobile, setUserMobile] = useState("");
    const [redeemCode, setRedeemCode] = useState("");
    const [open, setOpen] = useState(false);
    const [selectedRedeem, setSelectedRedeem] = useState<any>(null);

    const router = useRouter();
    const { user, loading } = useCafeUser(["cafe_staff", "cafe_admin"]);
    const cafeId = user?.cafe_id;

    const { data: redeems, isFetching, refetch } = useCafeRedeemsManual(
        cafeId || "",
        userMobile,  // ← This will now always be +91xxxxxxxxxx
        "initiated"
    );

    const { mutateAsync, isPending } = useConfirmRedeem();

    const handleFetch = async () => {
        if (!userMobile.trim()) return toast.error("Enter user mobile number");

        const normalized = normalizeMobile(userMobile);

        if (!normalized) return toast.error("Enter a valid mobile number");

        // Store final "+91xxxxxxxxxx" in state
        setUserMobile(normalized);

        if (!cafeId) return toast.error("Cafe ID not found");

        const result = await refetch();

        if (result.data && result.data.length > 0) {
            setSelectedRedeem(result.data[0]);
            setOpen(true);
        } else {
            toast.info("No initiated redeems found for this user");
        }
    };

    const handleConfirm = async (redeemId: string) => {
        if (!redeemCode.trim()) return toast.error("Enter redeem code");

        try {
            const res = await mutateAsync({ redeemId, redeemCode });
            toast.success(res.message || "Redeem confirmed successfully!");
            setRedeemCode("");
            setOpen(false);
            setTimeout(() => router.push("/dashboard/cafe/redeem"), 1000);
            await refetch();
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ||
                "Redeem confirmation failed. Please check the code."
            );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Loading account...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">
                        Confirm Redeems
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Enter a user’s mobile number to view and confirm initiated redeems
                    </p>
                </div>
            </div>

            {/* Search card */}
            <Card className="max-w-lg mx-auto border border-gray-200 shadow-sm rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-600" /> Search User Redeems
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder="Enter mobile (+91xxxxxxxxxx or xxxxxxxxxx)"
                        value={userMobile}
                        onChange={(e) => setUserMobile(e.target.value)}
                    />
                    <Button
                        className="w-full font-medium"
                        onClick={handleFetch}
                        disabled={isFetching}
                    >
                        {isFetching ? (
                            <>
                                <Loader2 className="animate-spin mr-2 h-4 w-4" /> Fetching...
                            </>
                        ) : (
                            "Fetch Redeems"
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Confirm Redeem</DialogTitle>
                        <DialogDescription>
                            Review user details and confirm the redeem below.
                        </DialogDescription>
                    </DialogHeader>

                    {redeems && redeems.length > 0 ? (
                        <div className="space-y-3 mt-3 max-h-[250px] overflow-y-auto pr-1">
                            {redeems.map((r: any) => (
                                <Card
                                    key={r.redeem_id}
                                    onClick={() => setSelectedRedeem(r)}
                                    className={`border cursor-pointer ${selectedRedeem?.redeem_id === r.redeem_id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200"
                                        }`}
                                >
                                    <CardContent className="py-3">
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-600" />
                                            {r.user_name || "Unknown User"}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Phone className="h-3 w-3 text-gray-500" />
                                            {r.user_mobile_no}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Coffee className="h-3 w-3 text-gray-500" />
                                            {r.item_name || "Unknown Item"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-2 rounded-md mt-4">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            No initiated redeems for this user.
                        </div>
                    )}

                    {selectedRedeem && (
                        <div className="mt-5 space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                                Redeem Code
                            </label>
                            <Input
                                placeholder="Enter redeem code"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value)}
                            />
                        </div>
                    )}

                    <DialogFooter className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleConfirm(selectedRedeem?.redeem_id)}
                            disabled={isPending || !selectedRedeem}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" /> Confirming...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Redeem
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
