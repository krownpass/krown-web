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

    const rolesKey = requiredRoles?.join(",") ?? "";

    useEffect(() => {

        const token = getToken();
        console.log("[useCafeUser] Token from storage:", token ? `${token.substring(0, 30)}...` : "NULL");

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


                if (rolesKey && !rolesKey.split(",").includes(u.user_role)) {
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
                if (status === 401) {
                    clearToken();
                    router.replace("/login");
                    return;
                }
                toast.error("Server unavailable. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [router, rolesKey]);

    return { user, loading };
}
