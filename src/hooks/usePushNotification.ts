"use client";

import { useEffect, useRef } from "react";
import api from "@/lib/api";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const arr = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
    return arr.buffer;
}

interface UsePushNotificationOptions {
    enabled?: boolean;
}

export function usePushNotification({ enabled = false }: UsePushNotificationOptions = {}) {
    const subscribedRef = useRef(false);

    useEffect(() => {
        if (!enabled || subscribedRef.current) return;
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

        const subscribe = async () => {
            try {
                const { data } = await api.get("/push/web/vapid-key");
                if (!data?.publicKey) return;

                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                });
                await navigator.serviceWorker.ready;

                const existing = await registration.pushManager.getSubscription();
                if (existing) {
                    subscribedRef.current = true;
                    return;
                }

                const permission = await Notification.requestPermission();
                if (permission !== "granted") return;

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(data.publicKey),
                });

                await api.post("/push/web/subscribe", {
                    subscription: subscription.toJSON(),
                    entity_type: "cafe",
                });

                subscribedRef.current = true;
            } catch (err) {
                console.warn("[PushNotification] Subscribe failed:", err);
            }
        };

        subscribe();
    }, [enabled]);
}
