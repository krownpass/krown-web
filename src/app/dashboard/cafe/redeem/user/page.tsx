
"use client";

import { RedeemTable } from "@/app/dashboard/components/ui/RedeemTable";
import { useUserRedeems } from "@/hooks/useRedeem";

export default function UserRedeemsPage() {
    const { data, isLoading } = useUserRedeems();

    return (
        <div className="min-h-screen bg-white p-8">
            <h1 className="text-2xl font-bold text-black mb-6">User Redeems</h1>
            {isLoading ? <p>Loading...</p> : <RedeemTable data={data || []} />}
        </div>
    );
}
