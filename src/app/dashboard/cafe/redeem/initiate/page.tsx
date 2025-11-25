"use client"

import RedeemForm from "@/app/dashboard/components/ui/RedeemForm";
import { useCafeUser } from "@/hooks/useCafeUser";

export default function InitiateRedeemPage() {
    const { user, loading } = useCafeUser(["cafe_admin", "cafe_staff"]);
    if (loading) return <p>Loading...</p>;

    return (
        <div className="min-h-screen bg-white p-8">
            <h1 className="text-2xl font-bold text-black mb-6">Initiate Redeem</h1>
            <RedeemForm cafeId={user?.cafe_id || ""} />
        </div>
    );
}
