
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

        if (!token) {
            router.replace("/login");
            setLoading(false);
            return;
        }

        api
            .get("/cafes/admin/me")
            .then((res) => {
                const u = res.data?.data;
                if (!u) throw new Error("Invalid user data");

                if (requiredRoles && !requiredRoles.includes(u.user_role)) {
                    toast.error("Access denied");
                    clearToken();
                    router.replace("/not-authorized");
                    return;
                }

                setUser(u);
            })
            .catch((err) => {
                toast.dismiss();

                const status = err?.response?.status;

                // Clear token ONLY if token is actually invalid
                if (status === 401) {
                    clearToken();
                    router.replace("/login");
                    return;
                }

                // For server/network issues, DON'T logout user
                toast.error("Server unavailable. Please try again.");
            })
            .finally(() => setLoading(false));
    }, [router, requiredRoles]);

    return { user, loading };
}
