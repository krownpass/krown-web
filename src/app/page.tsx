"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IMAGES } from "../../public/assets";
import { getToken } from "@/lib/auth";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UnifiedRedirectPage() {
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

                if (user?.user_role === "cafe_admin") {
                    router.replace("/dashboard");
                } else if (user?.user_role === "cafe_staff") {
                    router.replace("/dashboard/cafe/redeem");
                } else {
                    router.replace("/not-authorized");
                }

            } catch (err) {
                toast.error("Session expired. Please login again.");
                router.replace("/login");
            }
        };

        handleRedirect();
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center text-gray-500">
            <Image src={IMAGES.krown} width={100} height={100} alt="Krown" />
            <h1 className="font-bebas text-5xl mt-3">Krown</h1>

            <p className="mt-2 text-lg font-mono">Redirecting…</p>

            <Loader2 className="animate-spin mt-4" />
        </div>
    );
}
