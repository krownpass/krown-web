
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { toast } from "sonner";

export type CafeUser = {
    user_id: string;
    user_name: string;
    user_mobile_no: string;
    user_role: "cafe_admin" | "cafe_staff";
    cafe_name: string;
    cafe_id: string;
};

export function useCafeUser(requiredRoles?: ("cafe_admin" | "cafe_staff")[]) {
    const [user, setUser] = useState<CafeUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = getToken();

        // ❌ If no token → redirect to login
        if (!token) {
            router.replace("/login");
            setLoading(false);
            return;
        }

        // ✅ Always verify with the ME endpoint
        api
            .get("/cafes/admin/me")
            .then((res) => {
                const u = res.data?.data;
                if (!u) throw new Error("Invalid user data");

                // ✅ Check if user has permission for this page
                if (requiredRoles && !requiredRoles.includes(u.user_role)) {
                    toast.error("Access denied");
                    clearToken();
                    router.replace("/not-authorized");
                    return;
                }

                setUser(u);
            })
            .catch((err) => {
                // Handle auth or network errors
                toast.dismiss();
                clearToken();
                router.replace("/login");
            })
            .finally(() => setLoading(false));
    }, [router, requiredRoles]);

    return { user, loading };
}
