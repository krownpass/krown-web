"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, Trash2, ImageIcon, MenuIcon } from "lucide-react";
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

// Constants
const MAX_GALLERY_IMAGES = 15;
const MAX_MENU_IMAGES = 5;
const MAX_MAIN_IMAGES = 5;

/* --------------------------------------- */
/* COMPONENT                               */
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
            latitude: undefined,
            longitude: undefined,
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
            if (!cafeId) throw new Error("No cafe ID");

            const [cafeRes, imgRes, galleryRes, menuRes, slotsRes] = await Promise.all([
                api.get(`/cafes/${cafeId}`),
                api.get(`/cafes/${cafeId}/images`),
                api.get(`/cafes/${cafeId}/gallery`),
                api.get(`/cafes/${cafeId}/menu-images`),
                api.get(`/bookings/cafe-slots/${cafeId}`),
            ]);
            const categories = (slotsRes.data.categories ?? []).map((cat: any) => ({
                name: cat.name,
                hours: cat.hours.map((time: string) => {
                    const [h, m] = time.split(":");
                    return { hour: Number(h), minute: Number(m) };
                }),
            })) as SlotCategory[];

            const imgData = imgRes.data.data ?? imgRes.data ?? {};

            return {
                cafe: cafeRes.data.data ?? null,
                images: Array.isArray(imgData.main?.images)
                    ? imgData.main.images
                    : Array.isArray(imgData.main)
                        ? imgData.main
                        : [],
                galleryImages: Array.isArray(galleryRes.data.data) ? galleryRes.data.data : [],
                menuImages: Array.isArray(menuRes.data.data) ? menuRes.data.data : [],
                categories,
            };
        },
    });

    /* ---------------- SET FORM VALUES ---------------- */
    useEffect(() => {
        if (!data?.cafe) return;

        const backend = data.cafe;

        form.reset({
            cafe_name: backend.cafe_name ?? "",
            cafe_location: backend.cafe_location ?? "",
            cafe_description: backend.cafe_description ?? "",
            cafe_mobile_no: backend.cafe_mobile_no ?? "",
            cafe_upi_id: backend.cafe_upi_id ?? "",
            opening_time: backend.opening_time?.slice(0, 5) ?? "",
            closing_time: backend.closing_time?.slice(0, 5) ?? "",
            latitude: backend.latitude ?? undefined,
            longitude: backend.longitude ?? undefined,
            working_days: backend.working_days || [],
            is_available: backend.is_available ?? true,
            categories: data.categories ?? [],
        });
    }, [data, form]);

    // Safe image arrays
    const images = data?.images ?? [];
    const galleryImages = data?.galleryImages ?? [];
    const menuImages = data?.menuImages ?? [];

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
            toast.error(message);
        },
    });

    /* ---------------- IMAGE UPLOAD / DELETE HANDLERS ---------------- */
    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !user?.cafe_id) return;
        if (galleryImages.length >= MAX_GALLERY_IMAGES) {
            return toast.error(`Maximum ${MAX_GALLERY_IMAGES} gallery images allowed`);
        }

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("cafe_id", user.cafe_id);
        formData.append("file_name", file.name);
        formData.append("bucket", "krown-cafes");

        try {
            await api.post(`/cafes/gallery/upload`, formData);
            toast.success("Gallery image uploaded");
            queryClient.invalidateQueries({ queryKey: ["cafe", user.cafe_id] });
        } catch (err: any) {
            console.error("Gallery upload failed:", err);
            toast.error(err.response?.data?.message || "Upload failed");
        }
        e.target.value = "";
    };

    const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !user?.cafe_id) return;
        if (menuImages.length >= MAX_MENU_IMAGES) {
            return toast.error(`Maximum ${MAX_MENU_IMAGES} menu images allowed`);
        }

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("cafe_id", user.cafe_id);
        formData.append("file_name", file.name);
        formData.append("bucket", "krown-cafes");

        try {
            await api.post(`/cafes/menu/upload`, formData);
            toast.success("Menu image uploaded");
            queryClient.invalidateQueries({ queryKey: ["cafe", user.cafe_id] });
        } catch (err: any) {
            console.error("Menu upload failed:", err);
            toast.error(err.response?.data?.message || "Upload failed");
        }
        e.target.value = "";
    };

    const handleGalleryDelete = async (img: { image_id: string; image_url: string }) => {
        if (!user?.cafe_id) return;
        try {
            await api.delete(`/cafes/gallery/${img.image_id}`, {
                data: {
                    cafe_id: user.cafe_id,
                    path: img.image_url.split("krown-cafes/")[1] || "",
                    bucket: "krown-cafes",
                },
            });
            toast.success("Gallery image deleted");
            queryClient.invalidateQueries({ queryKey: ["cafe", user.cafe_id] });
        } catch (err: any) {
            console.error("Gallery delete failed:", err);
            toast.error(err.response?.data?.message || "Delete failed");
        }
    };

    const handleMenuDelete = async (img: { image_id: string; image_url: string }) => {
        if (!user?.cafe_id) return;
        try {
            await api.delete(`/cafes/menu/${img.image_id}`, {
                data: {
                    cafe_id: user.cafe_id,
                    path: img.image_url.split("krown-cafes/")[1] || "",
                    bucket: "krown-cafes",
                },
            });
            toast.success("Menu image deleted");
            queryClient.invalidateQueries({ queryKey: ["cafe", user.cafe_id] });
        } catch (err: any) {
            console.error("Menu delete failed:", err);
            toast.error(err.response?.data?.message || "Delete failed");
        }
    };

    const handleMainDelete = async (img: { image_id: string; image_url: string }) => {
        if (!user?.cafe_id) return;
        try {
            await api.delete(`/cafes/images/${img.image_id}`, {
                data: {
                    cafe_id: user.cafe_id,
                    path: img.image_url.split("krown-cafes/")[1] || "",
                    bucket: "krown-cafes",
                },
            });
            toast.success("Main image deleted");
            queryClient.invalidateQueries({ queryKey: ["cafe", user.cafe_id] });
        } catch (err: any) {
            console.error("Main image delete failed:", err);
            toast.error(err.response?.data?.message || "Delete failed");
        }
    };

    /* ---------------- SUBMIT ---------------- */
    const onSubmit = (values: UpdateCafeInput) => {
        if (!user?.cafe_id) {
            toast.error("Missing cafe ID");
            return;
        }

        const normalizedCategories = values.categories?.map((c) => ({
            name: c.name.trim(),
            hours: [...c.hours],
        }));

        const payload: UpdateCafeInput = {
            ...values,
            cafe_id: user.cafe_id,
            categories: normalizedCategories,
        };

        updateCafe.mutate(payload);
    };

    if (loading || isLoading) return <p className="text-center mt-10">Loading...</p>;
    if (!user) return null;

    form.watch("categories");

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 md:p-10 grid md:grid-cols-2 gap-12"
        >
            {/* LEFT SIDE - FORM */}
            <div className="space-y-6">
                <h2 className={`${bebasNeue.className} text-3xl`}>Update Café Details</h2>

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
                            <Input {...form.register(id as keyof UpdateCafeInput)} />
                        </div>
                    ))}

                    {/* Lat / Lng */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Latitude</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="e.g. 12.9586"
                                {...form.register("latitude", { valueAsNumber: true })}
                            />
                        </div>
                        <div>
                            <Label>Longitude</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="e.g. 79.1377"
                                {...form.register("longitude", { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    {/* Working days */}
                    <div>
                        <Label>Working Days</Label>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                            {(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as Day[]).map((day) => {
                                const curr = form.watch("working_days") ?? [];
                                const selected = curr.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            const updated = selected ? curr.filter((d) => d !== day) : [...curr, day];
                                            form.setValue("working_days", updated, { shouldValidate: true });
                                        }}
                                        className={`px-3 py-2 rounded-lg text-sm border ${selected ? "bg-black text-white" : "bg-white text-gray-700"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="mt-4">
                        <Label>Is Available?</Label>
                        <div className="flex items-center gap-3 mt-1">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-md border ${form.watch("is_available")
                                    ? "bg-green-600 text-white border-green-700"
                                    : "bg-red-600 text-white border-red-700"
                                    }`}
                                onClick={() => {
                                    form.setValue("is_available", !form.watch("is_available"), {
                                        shouldValidate: true,
                                    });
                                }}
                            >
                                {form.watch("is_available") ? "Available" : "Unavailable"}
                            </button>
                        </div>
                    </div>

                    {/* Slot Categories */}
                    <div className="mt-6 space-y-4">
                        <Label>Time Slot Categories</Label>
                        <Button
                            type="button"
                            onClick={() => {
                                const current = getCategories();
                                const newName = nextCategoryName(current.map((c) => c.name));
                                form.setValue("categories", [...current, { name: newName, hours: [] }]);
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
                                        className="text-red-500 hover:text-red-700"
                                        type="button"
                                        onClick={() => {
                                            form.setValue(
                                                "categories",
                                                getCategories().filter((_, i) => i !== index)
                                            );
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

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
                                                    all[index].hours = all[index].hours.filter((_, vi) => vi !== i);
                                                    form.setValue("categories", all);
                                                }}
                                            >
                                                ×
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="flex gap-3 flex-wrap">
                                    <select id={`hour_${index}`} className="border rounded px-2 py-1 text-sm" defaultValue="">
                                        <option value="" disabled>
                                            Hour
                                        </option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((hr) => (
                                            <option key={hr} value={hr}>
                                                {hr}
                                            </option>
                                        ))}
                                    </select>

                                    <select id={`minute_${index}`} className="border rounded px-2 py-1 text-sm" defaultValue="00">
                                        {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>

                                    <select id={`period_${index}`} className="border rounded px-2 py-1 text-sm" defaultValue="AM">
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>

                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            const hrEl = document.getElementById(`hour_${index}`) as HTMLSelectElement;
                                            const minEl = document.getElementById(`minute_${index}`) as HTMLSelectElement;
                                            const prEl = document.getElementById(`period_${index}`) as HTMLSelectElement;

                                            if (!hrEl.value) return toast.error("Select hour");

                                            const hour24 = to24Hour(Number(hrEl.value), prEl.value as "AM" | "PM");
                                            const minute = Number(minEl.value);

                                            const all = [...getCategories()];
                                            const exists = all[index].hours.some((h) => h.hour === hour24 && h.minute === minute);

                                            if (exists) return toast.error("This time already exists in category");

                                            all[index].hours.push({ hour: hour24, minute });
                                            all[index].hours.sort((a, b) =>
                                                a.hour === b.hour ? a.minute - b.minute : a.hour - b.hour
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

                    <Button type="submit" className="w-full" disabled={updateCafe.isPending}>
                        {updateCafe.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </div>

            {/* RIGHT SIDE - IMAGES */}
            <div className="space-y-8">
                {/* Cover Image */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className={`${bebasNeue.className} text-2xl`}>Cover Image</h2>
                        <span className="text-sm text-gray-500">{data?.cafe?.cover_img ? "1/1" : "0/1"}</span>
                    </div>

                    {!data?.cafe?.cover_img ? (
                        <>
                            <Label
                                htmlFor="coverUpload"
                                className="cursor-pointer flex items-center gap-2 text-blue-600 hover:text-blue-700"
                            >
                                <Upload size={20} /> Upload Cover Image
                            </Label>
                            <Input
                                id="coverUpload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    if (!e.target.files?.length || !user?.cafe_id) return;
                                    const file = e.target.files[0];
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    formData.append("cafe_id", user.cafe_id);
                                    formData.append("file_name", file.name);
                                    formData.append("bucket", "krown-cafes");

                                    try {
                                        await api.post(`/cafes/cover/upload`, formData);
                                        toast.success("Cover image uploaded");
                                        queryClient.invalidateQueries({ queryKey: ["cafe", user.cafe_id] });
                                    } catch (err: any) {
                                        toast.error(err.response?.data?.message || "Upload failed");
                                    }
                                }}
                            />
                        </>
                    ) : (
                        <motion.div layout className="relative group w-full max-w-sm">
                            <Image
                                src={data.cafe.cover_img}
                                width={320}
                                height={180}
                                className="rounded-lg object-cover w-full h-44"
                                alt="Cover"
                            />
                            <button
                                onClick={async () => {
                                    if (!user?.cafe_id) return;
                                    try {
                                        await api.delete(`/cafes/${user.cafe_id}/cover`, {
                                            data: {
                                                cafe_id: user.cafe_id,
                                                path: data.cafe.cover_img.split("krown-cafes/")[1] || "",
                                                bucket: "krown-cafes",
                                            },
                                        });
                                        toast.success("Cover image deleted");
                                        queryClient.invalidateQueries({ queryKey: ["cafe", user.cafe_id] });
                                    } catch (err: any) {
                                        toast.error("Failed to delete cover image");
                                    }
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    )}
                </div>

                <Separator />

                {/* Gallery */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <ImageIcon size={20} />
                            <h2 className={`${bebasNeue.className} text-2xl`}>Gallery</h2>
                        </div>
                        <span className="text-sm text-gray-500">
                            {galleryImages.length} / {MAX_GALLERY_IMAGES}
                        </span>
                    </div>

                    {galleryImages.length < MAX_GALLERY_IMAGES && (
                        <>
                            <Label
                                htmlFor="galleryUpload"
                                className="cursor-pointer flex items-center gap-2 text-blue-600 hover:text-blue-700"
                            >
                                <Upload size={20} /> Upload Gallery Image
                            </Label>
                            <Input
                                id="galleryUpload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleGalleryUpload}
                            />
                        </>
                    )}

                    {galleryImages.length === 0 ? (
                        <p className="text-gray-400 text-sm">No gallery images yet.</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {galleryImages.map((img: any) => (
                                <motion.div key={img.image_id} layout className="relative group">
                                    <Image
                                        src={img.image_url}
                                        width={150}
                                        height={100}
                                        className="rounded-md object-cover w-full h-24"
                                        alt="gallery"
                                    />
                                    <button
                                        onClick={() => handleGalleryDelete(img)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Menu */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <MenuIcon size={20} />
                            <h2 className={`${bebasNeue.className} text-2xl`}>Menu</h2>
                        </div>
                        <span className="text-sm text-gray-500">
                            {menuImages.length} / {MAX_MENU_IMAGES}
                        </span>
                    </div>

                    {menuImages.length < MAX_MENU_IMAGES && (
                        <>
                            <Label
                                htmlFor="menuUpload"
                                className="cursor-pointer flex items-center gap-2 text-blue-600 hover:text-blue-700"
                            >
                                <Upload size={20} /> Upload Menu Image
                            </Label>
                            <Input
                                id="menuUpload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleMenuUpload}
                            />
                        </>
                    )}

                    {menuImages.length === 0 ? (
                        <p className="text-gray-400 text-sm">No menu images yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {menuImages.map((img: any) => (
                                <motion.div key={img.image_id} layout className="relative group">
                                    <Image
                                        src={img.image_url}
                                        width={200}
                                        height={150}
                                        className="rounded-md object-cover w-full h-32"
                                        alt="menu"
                                    />
                                    <button
                                        onClick={() => handleMenuDelete(img)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Main Images */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className={`${bebasNeue.className} text-2xl`}>Main Images</h2>
                        <span className="text-sm text-gray-500">
                            {images.length} / {MAX_MAIN_IMAGES}
                        </span>
                    </div>

                    {images.length < MAX_MAIN_IMAGES && (
                        <>
                            <Label
                                htmlFor="mainUpload"
                                className="cursor-pointer flex items-center gap-2 text-blue-600 hover:text-blue-700"
                            >
                                <Upload size={20} /> Upload Main Image
                            </Label>
                            <Input
                                id="mainUpload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (!e.target.files?.length || !user?.cafe_id) return;
                                    if (images.length >= MAX_MAIN_IMAGES) {
                                        return toast.error(`Maximum ${MAX_MAIN_IMAGES} main images allowed`);
                                    }

                                    const file = e.target.files[0];
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    formData.append("cafe_id", user.cafe_id);
                                    formData.append("file_name", file.name);
                                    formData.append("bucket", "krown-cafes");

                                    api
                                        .post(`/cafes/images/upload`, formData)
                                        .then(() => {
                                            toast.success("Main image uploaded");
                                            queryClient.invalidateQueries({ queryKey: ["cafe", user.cafe_id] });
                                        })
                                        .catch((err: any) => {
                                            toast.error(err.response?.data?.message || "Upload failed");
                                        });

                                    e.target.value = "";
                                }}
                            />
                        </>
                    )}

                    {images.length === 0 ? (
                        <p className="text-gray-400 text-sm">No main images yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {images.map((img: any) => (
                                <motion.div key={img.image_id} layout className="relative group">
                                    <Image
                                        src={img.image_url}
                                        width={200}
                                        height={140}
                                        className="rounded-md object-cover w-full h-32"
                                        alt="main image"
                                    />
                                    <button
                                        onClick={() => handleMainDelete(img)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
