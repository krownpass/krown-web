"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useCafeAdmin } from "@/hooks/useCafeAdmin";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, Trash2 } from "lucide-react";
import { UpdateCafeInput, UpdateCafeSchema } from "@/lib/validators/schema";


// ---------- Component ----------
export default function CafeAdminUpdatePage() {
    const { cafeadmin, loading } = useCafeAdmin();
    const queryClient = useQueryClient();

    const form = useForm<UpdateCafeInput>({
        resolver: zodResolver(UpdateCafeSchema) as import("react-hook-form").Resolver<UpdateCafeInput>,
        mode: "onSubmit",
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
            working_days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        } as UpdateCafeInput,
    });


    // ---------- Fetch cafe + images ----------
    const { data, isLoading } = useQuery({
        queryKey: ["cafe", cafeadmin?.cafe_id],
        enabled: !!cafeadmin?.cafe_id,
        queryFn: async () => {
            const [cafeRes, imgRes] = await Promise.all([
                api.get(`/cafes/${cafeadmin?.cafe_id}`),
                api.get(`/cafes/${cafeadmin?.cafe_id}/images`),
            ]);
            return {
                cafe: cafeRes.data.data,
                images: imgRes.data.data || [],
            };
        },
    });

    // ---------- Normalize working_days ----------
    useEffect(() => {
        if (data?.cafe) {
            const wd = data.cafe.working_days;
            let normalized: string[];

            if (Array.isArray(wd)) normalized = wd;
            else if (typeof wd === "string")
                normalized = wd
                    .replace(/[{}"]/g, "")
                    .split(",")
                    .map((d) => d.trim());
            else normalized = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

            const parsed: UpdateCafeInput = {
                ...data.cafe,
                working_days: normalized as (
                    | "MON"
                    | "TUE"
                    | "WED"
                    | "THU"
                    | "FRI"
                    | "SAT"
                    | "SUN"
                )[],
            };

            form.reset(parsed);
        }
    }, [data, form]);

    const images = data?.images ?? [];

    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
        });
        return () => subscription.unsubscribe();
    }, [form]);

    const handleWorkingDaysChange = (
        day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"
    ) => {
        const current =
            (form.getValues("working_days") as (
                | "MON"
                | "TUE"
                | "WED"
                | "THU"
                | "FRI"
                | "SAT"
                | "SUN"
            )[]) || [];
        const updated = current.includes(day)
            ? current.filter((d) => d !== day)
            : [...current, day];
        form.setValue("working_days", updated, { shouldValidate: true });
    };

    const updateCafe = useMutation({
        mutationFn: async (payload: UpdateCafeInput) => {
            return api.put(`/cafes/${cafeadmin?.cafe_id}`, payload);
        },
        onSuccess: (res) => {
            toast.success("Café details updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["cafe", cafeadmin?.cafe_id] });
        },
        onError: (err: any) => {
            const msg =
                err.response?.data?.message?.includes("Duplicate entry")
                    ? "This UPI ID is already used by another café."
                    : "Failed to update café details";
            toast.error(msg);
        },
    });

    const onSubmit = (data: UpdateCafeInput) => {
        updateCafe.mutate(data);
    };
    if (loading || isLoading)
        return <p className="text-center mt-10">Loading...</p>;
    if (!cafeadmin) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 md:p-10 grid md:grid-cols-2 gap-12"
        >
            {/* ---------- LEFT ---------- */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Update Café Details</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit(
                            onSubmit,
                            (errors) => {
                                toast.error("Please fix validation errors before saving.");
                            }
                        )(e);
                    }}
                    className="space-y-4"

                >
                    {[
                        { id: "cafe_name", label: "Café Name" },
                        { id: "cafe_location", label: "Location" },
                        { id: "cafe_description", label: "Description" },
                        { id: "cafe_mobile_no", label: "Mobile No" },
                        { id: "cafe_upi_id", label: "UPI ID" },
                    ].map(({ id, label }) => (
                        <div key={id}>
                            <Label htmlFor={id}>{label}</Label>
                            <Input id={id} {...form.register(id as keyof UpdateCafeInput)} />
                            {form.formState.errors[id as keyof UpdateCafeInput] && (
                                <p className="text-red-500 text-sm">
                                    {
                                        form.formState.errors[id as keyof UpdateCafeInput]
                                            ?.message as string
                                    }
                                </p>
                            )}
                        </div>
                    ))}

                    {/* ---------- Lat / Long ---------- */}
                    <div className="flex gap-3">
                        <div className="w-1/2">
                            <Label htmlFor="cafe_latitude">Latitude</Label>
                            <Input
                                type="number"
                                step="any"
                                id="cafe_latitude"
                                {...form.register("cafe_latitude", { valueAsNumber: true })}
                            />
                        </div>
                        <div className="w-1/2">
                            <Label htmlFor="cafe_longitude">Longitude</Label>
                            <Input
                                type="number"
                                step="any"
                                id="cafe_longitude"
                                {...form.register("cafe_longitude", { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    {/* ---------- Working Days ---------- */}
                    <div>
                        <Label className="block text-sm font-medium mb-2">
                            Working Days
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => {
                                const selected = form.watch("working_days")?.includes(day as any);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() =>
                                            handleWorkingDaysChange(day as any)
                                        }
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 
                      ${selected
                                                ? "bg-black text-white border-black shadow-sm"
                                                : "bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ---------- Time ---------- */}
                    <div className="flex gap-3">
                        <div className="w-1/2">
                            <Label htmlFor="opening_time">Opening Time</Label>
                            <Input
                                type="time"
                                id="opening_time"
                                {...form.register("opening_time")}
                            />
                        </div>
                        <div className="w-1/2">
                            <Label htmlFor="closing_time">Closing Time</Label>
                            <Input
                                type="time"
                                id="closing_time"
                                {...form.register("closing_time")}
                            />
                        </div>
                    </div>

                    <Separator />
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={updateCafe.isPending}
                    >
                        {updateCafe.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </div>

            {/* ---------- RIGHT (Images) ---------- */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Manage Images</h2>
                    <span className="text-sm text-muted-foreground">
                        {images.length}/5 uploaded
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <Label
                        htmlFor="upload"
                        className="cursor-pointer flex items-center gap-2 text-blue-600 hover:underline"
                    >
                        <Upload className="w-5 h-5" /> Upload Image
                    </Label>
                    <Input
                        id="upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            if (!e.target.files?.length) return;
                            if (images.length >= 5)
                                return toast.error("You can upload up to 5 images only");
                            const file = e.target.files[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("cafe_id", cafeadmin!.cafe_id);

                            formData.append("file_name", file.name);
                            formData.append("bucket", "krown-cafes");
                            api
                                .post("/cafes/images/upload", formData, {
                                    headers: { "Content-Type": "multipart/form-data" },
                                })
                                .then(() => {
                                    toast.success("Image uploaded!");
                                    queryClient.invalidateQueries({
                                        queryKey: ["cafe", cafeadmin?.cafe_id],
                                    });
                                })
                                .catch((err) => {
                                    toast.error("Upload failed");
                                });
                        }}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    {images.map((img: any) => (
                        <motion.div
                            key={img.image_id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="relative group"
                        >
                            <Image
                                src={img.image_url}
                                alt="cafe image"
                                width={250}
                                height={150}
                                className="rounded-md object-cover h-36 w-full"
                            />
                            <button
                                onClick={() =>
                                    api
                                        .delete(`/cafes/images/${img.image_id}`, {
                                            data: {
                                                cafe_id: cafeadmin!.cafe_id,
                                                path: img.image_url.split("krown-cafes/")[1],
                                                bucket: "krown-cafes",
                                            },
                                        })
                                        .then(() => {
                                            toast.success("Image deleted");
                                            queryClient.invalidateQueries({
                                                queryKey: ["cafe", cafeadmin?.cafe_id],
                                            });
                                        })
                                        .catch((err) => {
                                            toast.error("Delete failed");
                                        })
                                }
                                className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
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
