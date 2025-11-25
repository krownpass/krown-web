
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DashboardRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        const handleRedirect = async () => {
            try {
                const token = getToken();
                if (!token) {
                    router.replace("/login");
                    return;
                }

                const res = await api.get("/cafes/admin/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const user = res.data?.data;

                if (user?.user_role === "cafe_admin") router.replace("/dashboard/cafe/update");
                else if (user?.user_role === "cafe_staff") router.replace("/dashboard/cafe/redeem");
                else router.replace("/not-authorized");
            } catch {
                toast.error("Session expired. Please login again.");
                router.replace("/login");
            }
        };

        handleRedirect();
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Redirecting...
        </div>
    );
}
