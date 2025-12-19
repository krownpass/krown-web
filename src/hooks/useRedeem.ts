
import api from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
export const useInitiateRedeem = () =>
    useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post("/redeems", data);
            return res.data;
        },
    });

export const useUserRedeems = (cafeId?: string, type?: string) =>
    useQuery({
        queryKey: ["user-redeems", cafeId, type],
        queryFn: async () => {
            const res = await api.get(`/redeems/user`, { params: { cafeId, type } });
            return res.data.data;
        },
    });
//  useCafeRedeems (Dashboard — auto fetch)
export const useCafeRedeems = (cafeId: string, userMobile?: string, type?: string) =>
    useQuery({
        queryKey: ["cafe-redeems", cafeId, userMobile, type],
        queryFn: async () => {
            if (!cafeId) throw new Error("Cafe ID missing");
            const res = await api.get("/redeems/cafe", { params: { cafeId, userMobile, type } });
            return res.data.data || [];
        },
        enabled: !!cafeId,
        refetchOnWindowFocus: false,
    });

//  useCafeRedeems (Confirm Redeem — manual fetch)
export const useCafeRedeemsManual = (cafeId: string, userMobile?: string, type?: string) =>
    useQuery({
        queryKey: ["cafe-redeems", cafeId, userMobile, type],
        queryFn: async () => {
            if (!cafeId) throw new Error("Cafe ID missing");
            const res = await api.get("/redeems/cafe", { params: { cafeId, userMobile, type } });
            return res.data.data || [];
        },
        enabled: false,
        refetchOnWindowFocus: false,
    });

export const useConfirmRedeem = () =>
    useMutation({
        mutationFn: async (data: { redeemId: string; redeemCode: string; user_id: string }) => {
            const res = await api.post("/redeems/confirm", data);
            return res.data;
        },
    });
