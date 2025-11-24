// Full updated working file with minute-level time slots
// (React + Next.js + React Hook Form + React Query)

// NOTE: This is a direct drop-in replacement for your UserUpdatePage.
// Supports minute precision time slots (e.g., 10:30, 11:45, 12:10 PM)

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, Trash2 } from "lucide-react";

import {
    UpdateCafeInput,
    UpdateCafeSchema,
    Day,
    SlotCategory,
    SlotTime,
} from "@/lib/validators/schema";

import { useCafeUser } from "@/hooks/useCafeUser";
import { bebasNeue } from "@/lib/font";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";

/* --------------------------------------- */
/* UTILITIES */
/* --------------------------------------- */

function to24Hour(hour12: number, period: "AM" | "PM") {
    if (hour12 === 12) return period === "AM" ? 0 : 12;
    return period === "AM" ? hour12 : hour12 + 12;
}
function formatTime(t: SlotTime) {
    if (!t || typeof t.hour !== "number") return "--:--";
    const minute = typeof t.minute === "number" ? t.minute : 0;
    const hr12 = t.hour % 12 === 0 ? 12 : t.hour % 12;
    const period = t.hour >= 12 ? "PM" : "AM";
    return `${hr12}:${minute.toString().padStart(2, "0")} ${period}`;
}
const DEFAULT_NAMES = ["Breakfast", "Lunch", "Evening", "Night"];

function nextCategoryName(existing: string[]) {
    for (const name of DEFAULT_NAMES) if (!existing.includes(name)) return name;
    return `Slot ${existing.length + 1}`;
}

/* --------------------------------------- */
/* COMPONENT */
/* --------------------------------------- */

export default function UserUpdatePage() {
    const { user, loading } = useCafeUser(["cafe_admin"]);
    const queryClient = useQueryClient();

    const form = useForm<UpdateCafeInput>({
        resolver: zodResolver(UpdateCafeSchema),
        defaultValues: {
            cafe_name: "",
            cafe_location: "",
            cafe_description: "",
            cafe_mobile_no: "",
            cafe_upi_id: "",
            opening_time: "",
            closing_time: "",
            cafe_latitude: undefined,
            cafe_longitude: undefined,
            working_days: [],
            is_available: true,
            categories: [],
        },
    });

    const getCategories = (): SlotCategory[] => form.getValues("categories") ?? [];

    /* ---------------- FETCH DATA ---------------- */

    const { data, isLoading } = useQuery({
        queryKey: ["cafe", user?.cafe_id],
        enabled: !!user?.cafe_id,
        queryFn: async () => {
            const cafeId = user?.cafe_id;
            const [cafeRes, imgRes, slotsRes] = await Promise.all([
                api.get(`/cafes/${cafeId}`),
                api.get(`/cafes/${cafeId}/images`),
                api.get(`/bookings/cafe-slots/${cafeId}`),
            ]);

            // Convert backend hours (number[]) → SlotTime[]
            const categories = (slotsRes.data.categories ?? []).map((cat: any) => ({
                name: cat.name,
                hours: cat.hours.map((time: string) => {
                    const [h, m] = time.split(":");
                    return { hour: Number(h), minute: Number(m) };
                })
            })) as SlotCategory[];
            return {
                cafe: cafeRes.data.data,
                images: imgRes.data.data,
                categories,
            };
        },
    });

    /* ---------------- SET FORM VALUES ---------------- */

    useEffect(() => {
        if (!data?.cafe) return;

        const backend = data.cafe;

        form.reset({
            cafe_name: backend.cafe_name,
            cafe_location: backend.cafe_location,
            cafe_description: backend.cafe_description,
            cafe_mobile_no: backend.cafe_mobile_no,
            cafe_upi_id: backend.cafe_upi_id,
            opening_time: backend.opening_time?.slice(0, 5),
            closing_time: backend.closing_time?.slice(0, 5),
            cafe_latitude: backend.cafe_latitude ?? undefined,
            cafe_longitude: backend.cafe_longitude ?? undefined,
            working_days: backend.working_days || [],
            is_available: backend.is_available,
            categories: data.categories ?? [],
        });
    }, [data, form]);

    const images = data?.images ?? [];

    /* ---------------- MUTATION ---------------- */

    const updateCafe = useMutation({
        mutationFn: async (payload: UpdateCafeInput) =>
            api.put(`/cafes/${user?.cafe_id}`, payload),
        onSuccess: () => {
            toast.success("Café updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["cafe", user?.cafe_id] });
        },
        onError: (error: unknown) => {
            const err = error as AxiosError<any>;
            const message = err.response?.data?.message || err.message || "Update failed";
            console.log("Update cafe error:", err.response?.data || err);
            toast.error(message);
        },
    });

    const onSubmit = (vals: UpdateCafeInput) => {
        if (!user?.cafe_id) return toast.error("Missing cafe ID");

        const normalizedWorkingDays: Day[] | undefined = vals.working_days
            ? (vals.working_days.map((d) => d.toUpperCase()) as Day[])
            : undefined;

        const normalizedCategories: SlotCategory[] | undefined =
            vals.categories && vals.categories.length
                ? vals.categories.map((c) => ({ name: c.name.trim(), hours: [...c.hours] }))
                : undefined;

        const payload: UpdateCafeInput = {
            ...vals,
            cafe_id: user.cafe_id,
            working_days: normalizedWorkingDays,
            categories: normalizedCategories,
        };

        console.log("Payload:", payload);
        updateCafe.mutate(payload);
    };

    if (loading || isLoading) return <p className="text-center mt-10">Loading...</p>;
    if (!user) return null;

    form.watch("categories");

    /* --------------------------------------- */
    /* UI */
    /* --------------------------------------- */

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 md:p-10 grid md:grid-cols-2 gap-12"
        >
            {/* LEFT SIDE */}
            <div className="space-y-6">
                <h2 className={`${bebasNeue.className} text-3xl`}>
                    Update Café Details
                </h2>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {[
                        { id: "cafe_name", label: "Café Name" },
                        { id: "cafe_location", label: "Location" },
                        { id: "cafe_description", label: "Description" },
                        { id: "cafe_mobile_no", label: "Mobile No" },
                        { id: "cafe_upi_id", label: "UPI ID" },
                    ].map(({ id, label }) => (
                        <div key={id}>
                            <Label>{label}</Label>
                            <Input {...form.register(id as any)} />
                        </div>
                    ))}

                    {/* Working days */}
                    <div>
                        <Label>Working Days</Label>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                            {([
                                "MON",
                                "TUE",
                                "WED",
                                "THU",
                                "FRI",
                                "SAT",
                                "SUN",
                            ] as Day[]).map((day) => {
                                const curr = form.getValues("working_days") ?? [];
                                const selected = curr.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            const updated = selected
                                                ? curr.filter((d) => d !== day)
                                                : [...curr, day];
                                            form.setValue("working_days", updated, {
                                                shouldValidate: true,
                                            });
                                        }}
                                        className={`px-3 py-2 rounded-lg text-sm border ${selected
                                            ? "bg-black text-white"
                                            : "bg-white text-gray-700"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Slot Categories */}
                    <div className="mt-6 space-y-4">
                        <Label>Time Slot Categories</Label>

                        <Button
                            type="button"
                            onClick={() => {
                                const current = getCategories();
                                const newName = nextCategoryName(
                                    current.map((c) => c.name)
                                );
                                form.setValue("categories", [
                                    ...current,
                                    { name: newName, hours: [] },
                                ]);
                            }}
                        >
                            Add Slot Category
                        </Button>

                        {getCategories().map((cat, index) => (
                            <motion.div
                                key={`cat-${index}`}
                                layout
                                className="p-4 border rounded-xl bg-white shadow-sm space-y-4"
                            >
                                <div className="flex justify-between items-center">
                                    <Input
                                        className="w-48"
                                        value={cat.name}
                                        onChange={(e) => {
                                            const all = [...getCategories()];
                                            all[index].name = e.target.value;
                                            form.setValue("categories", all);
                                        }}
                                    />

                                    <button
                                        className="text-red-500"
                                        type="button"
                                        onClick={() => {
                                            form.setValue(
                                                "categories",
                                                getCategories().filter(
                                                    (_c, i) => i !== index
                                                )
                                            );
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {/* Hours display */}
                                <div className="flex flex-wrap gap-2">
                                    {cat.hours.map((h, i) => (
                                        <motion.div
                                            key={`${cat.name}-${h.hour}-${h.minute}-${i}`}
                                            className="px-3 py-1 rounded-full bg-black text-white text-xs flex items-center gap-2"
                                        >
                                            {formatTime(h)}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const all = [...getCategories()];
                                                    all[index].hours =
                                                        all[index].hours.filter(
                                                            (_, vi) => vi !== i
                                                        );
                                                    form.setValue("categories", all);
                                                }}
                                            >
                                                ×
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Add time slot */}
                                <div className="flex gap-3">
                                    {/* Hour */}
                                    <select
                                        id={`hour_${index}`}
                                        className="border rounded-md px-2 py-1 text-sm"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Hour
                                        </option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                            (hr) => (
                                                <option value={hr} key={hr}>
                                                    {hr}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {/* Minute */}
                                    <select
                                        id={`minute_${index}`}
                                        className="border rounded-md px-2 py-1 text-sm"
                                        defaultValue="00"
                                    >
                                        {[
                                            "00",
                                            "05",
                                            "10",
                                            "15",
                                            "20",
                                            "25",
                                            "30",
                                            "35",
                                            "40",
                                            "45",
                                            "50",
                                            "55",
                                        ].map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Period */}
                                    <select
                                        id={`period_${index}`}
                                        className="border rounded-md px-2 py-1 text-sm"
                                        defaultValue="AM"
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>

                                    {/* Add Button */}
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            const hrEl =
                                                document.getElementById(
                                                    `hour_${index}`
                                                ) as HTMLSelectElement;
                                            const minEl =
                                                document.getElementById(
                                                    `minute_${index}`
                                                ) as HTMLSelectElement;
                                            const prEl =
                                                document.getElementById(
                                                    `period_${index}`
                                                ) as HTMLSelectElement;

                                            if (!hrEl.value)
                                                return toast.error(
                                                    "Choose hour"
                                                );

                                            const hour24 = to24Hour(
                                                Number(hrEl.value),
                                                prEl.value as "AM" | "PM"
                                            );
                                            const minute = Number(minEl.value);

                                            const all = [...getCategories()];

                                            const exists = all[index].hours.some(
                                                (h) =>
                                                    h.hour === hour24 &&
                                                    h.minute === minute
                                            );
                                            if (exists)
                                                return toast.error(
                                                    "Time already exists!"
                                                );

                                            all[index].hours.push({
                                                hour: hour24,
                                                minute,
                                            });
                                            all[index].hours.sort((a, b) =>
                                                a.hour === b.hour
                                                    ? a.minute - b.minute
                                                    : a.hour - b.hour
                                            );

                                            form.setValue("categories", all);

                                            hrEl.value = "";
                                            minEl.value = "00";
                                            prEl.value = "AM";
                                        }}
                                    >
                                        Add
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <Separator />

                    <Button type="submit" className="w-full">
                        Save Changes
                    </Button>
                </form>
            </div>

            {/* RIGHT SIDE IMAGES */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className={`${bebasNeue.className} text-3xl`}>
                        Manage Images
                    </h2>
                    <span className="text-sm">{images.length}/5 uploaded</span>
                </div>

                <Label
                    htmlFor="upload"
                    className="cursor-pointer flex gap-2 text-blue-600"
                >
                    <Upload size={20} /> Upload Image
                </Label>

                <Input
                    id="upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                        if (!e.target.files?.length) return;
                        if (images.length >= 5)
                            return toast.error("Max 5 images");

                        const file = e.target.files[0];
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("cafe_id", user!.cafe_id);
                        formData.append("file_name", file.name);
                        formData.append("bucket", "krown-cafes");

                        api
                            .post(`/cafes/images/upload`, formData)
                            .then(() => {
                                toast.success("Uploaded!");
                                queryClient.invalidateQueries({
                                    queryKey: ["cafe", user?.cafe_id],
                                });
                            })
                            .catch(() => toast.error("Upload failed"));
                    }}
                />

                <div className="grid grid-cols-2 gap-3">
                    {images.map((img: any) => (
                        <motion.div
                            key={img.image_id}
                            layout
                            className="relative group"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <Image
                                src={img.image_url}
                                width={230}
                                height={140}
                                className="rounded-md object-cover w-full h-36"
                                alt=""
                            />

                            <button
                                onClick={() =>
                                    api
                                        .delete(
                                            `/cafes/images/${img.image_id}`,
                                            {
                                                data: {
                                                    cafe_id: user!.cafe_id,
                                                    path: img.image_url.split(
                                                        "krown-cafes/"
                                                    )[1],
                                                    bucket: "krown-cafes",
                                                },
                                            }
                                        )
                                        .then(() => {
                                            toast.success("Deleted");
                                            queryClient.invalidateQueries({
                                                queryKey: [
                                                    "cafe",
                                                    user?.cafe_id,
                                                ],
                                            });
                                        })
                                }
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
