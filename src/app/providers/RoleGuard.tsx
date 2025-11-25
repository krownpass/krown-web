// components/RoleGuard.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCafeUser } from "@/hooks/useCafeUser";

export default function RoleGuard({
    allowed,
    children,
}: {
    allowed: ("cafe_admin" | "cafe_staff")[];
    children: ReactNode;
}) {
    const { user, loading } = useCafeUser(["cafe_admin", "cafe_staff"]);
    const router = useRouter();

    // 🚨 Auto-redirect unauthorized users
    useEffect(() => {
        if (!loading && user) {
            if (!allowed.includes(user.user_role as any)) {
                if (user.user_role === "cafe_staff") {
                    router.replace("/dashboard/cafe/redeem");
                } else {
                    router.replace("/login");
                }
            }
        }
    }, [user, loading, allowed, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-gray-500" />
            </div>
        );
    }

    // if user is invalid or not in allowed list (redirect pending)
    if (!user || !allowed.includes(user.user_role as any)) return null;

    return <>{children}</>;
}
