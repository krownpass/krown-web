"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { toast } from "sonner";

type CafeAdmin = {
  user_id: string;
  user_name: string;
  user_mobile_no: string;
  user_role: string;
  cafe_name:string;
  cafe_id:string;
};

export function useCafeAdmin() {
  const [cafeadmin, setCafeAdmin] = useState<CafeAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    // 🔒 No token? Go to login.
    if (!token) {
      setCafeAdmin(null);
      setLoading(false);
      router.replace("/cafe-admin/login");
      return;
    }

    api
      .get("/cafes/admin/me")
      .then((res) => {
        const user = res.data?.data ?? null;

        // Must be cafe_admin to proceed
        if (!user || user.user_role !== "cafe_admin") {
          toast.dismiss();
          clearToken();
          router.replace("/not-authorized");
          return;
        }

        setCafeAdmin(user);
      })
      .catch((err) => {
        toast.dismiss();

        // 403 - Forbidden (User exists but no permission)
        if (err?.response?.status === 403) {
          clearToken();
          router.replace("/not-authorized");
          return;
        }

        // 401 or network error -> Go login
        clearToken();
        router.replace("/cafe-admin/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  return { cafeadmin, loading };
}
