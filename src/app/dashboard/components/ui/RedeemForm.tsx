"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Coffee } from "lucide-react";
import api from "@/lib/api";
import { useInitiateRedeem } from "@/hooks/useRedeem";

interface RedeemFormProps {
    cafeId: string;
}

export default function RedeemForm({ cafeId }: RedeemFormProps) {
    const router = useRouter();
    const [userMobile, setUserMobile] = useState("");
    const [itemId, setItemId] = useState("");
    const [items, setItems] = useState<any[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const { mutateAsync, isPending } = useInitiateRedeem();

    // ---------- Fetch café items ----------
    useEffect(() => {
        async function fetchItems() {
            if (!cafeId) return;
            setIsLoadingItems(true);
            try {
                const res = await api.get(`/cafes/cafe/${cafeId}`);
                const data = res.data?.data?.items || res.data?.data || [];
                setItems(data);
            } catch (err) {
                toast.error("Failed to load café items");
            } finally {
                setIsLoadingItems(false);
            }
        }
        fetchItems();
    }, [cafeId]);

    // ---------- Submit ----------
    const handleSubmit = async () => {
        if (!userMobile.trim()) return toast.error("Enter user mobile number");
        if (!itemId) return toast.error("Select an item to redeem");

        try {
            await mutateAsync({ cafeId, userMobile, itemId });
            toast.success(" Redeem initiated! Ask user for redeem code");
            setUserMobile("");
            setItemId("");
            setTimeout(() => router.push("/dashboard/cafe/redeem/confirm"), 1200);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Redeem initiation failed");
        }
    };

    // ---------- Loading ----------
    if (isLoadingItems) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[250px] text-gray-600">
                <Loader2 className="animate-spin h-6 w-6 mb-2" />
                <p>Fetching café items...</p>
            </div>
        );
    }

    // ---------- UI ----------
    return (
        <div className="flex items-center justify-center mt-6">
            <Card className="w-full max-w-lg border border-gray-200 shadow-md rounded-2xl bg-gradient-to-b from-white to-gray-50">
                <CardHeader className="text-center space-y-1">
                    <div className="flex justify-center">
                        <Coffee className="h-8 w-8 text-amber-700" />
                    </div>
                    <CardTitle className="text-2xl font-semibold text-gray-900">Initiate Redeem</CardTitle>
                    <CardDescription className="text-gray-500">
                        Select an item and enter customer’s mobile number
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 px-6 pb-6">
                    {/* User Mobile */}
                    <div>
                        <label className="text-sm text-gray-700 font-medium">Customer Mobile</label>
                        <Input
                            placeholder="+91XXXXXXXXXX"
                            value={userMobile}
                            onChange={(e) => setUserMobile(e.target.value)}
                            className="mt-2"
                        />
                    </div>

                    {/* Café Items Dropdown */}
                    <div>
                        <label className="text-sm text-gray-700 font-medium">Select Item</label>
                        <Select value={itemId} onValueChange={setItemId}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choose an item to redeem" />
                            </SelectTrigger>
                            <SelectContent>
                                {items.length ? (
                                    items.map((item: any) => (
                                        <SelectItem key={item.item_id} value={item.item_id}>
                                            {item.item_name} — ₹{item.price}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-400 p-2">No items available</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="w-full mt-4 text-base font-semibold bg-black hover:bg-gray-900 transition-all"
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin w-4 h-4" />
                                Initiating...
                            </div>
                        ) : (
                            "Initiate Redeem"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
