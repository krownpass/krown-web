"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Trash2,
    Edit3,
    Upload,
    Loader2,
    Save,
    X,
} from "lucide-react";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { useCafeUser } from "@/hooks/useCafeUser";
import { bebasNeue } from "@/lib/font";

//  Validation Schema
const UpdateItemSchema = z.object({
    item_id: z.number().optional(),
    item_name: z.string().min(2, "Item name is required"),
    item_description: z.string().min(2, "Description required"),
    category: z.string().min(2, "Category required"),
    price: z.number().positive("Price must be greater than 0"),
    recommended: z.boolean().optional(),
});

type ItemInput = z.infer<typeof UpdateItemSchema>;

type Item = {
    item_id: number;
    item_name: string;
    item_description: string;
    category: string;
    price: number;
    recommended: boolean;
    image_url?: string | null;
    image_id?: number;
};

//  Debounce hook
function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

export default function ItemsDashboardPage() {
    const { user, loading } = useCafeUser(["cafe_admin", "cafe_staff"]);
    const queryClient = useQueryClient();

    const [tab, setTab] = useState("create");
    const [query, setQuery] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);

    const debouncedQuery = useDebouncedValue(query);

    //  Fetch all items
    const { data: items = [], isLoading } = useQuery({
        queryKey: ["items", user?.cafe_id],
        queryFn: async () => {
            const res = await api.get(`/cafes/cafe/${user?.cafe_id}`);


            return res.data?.data || [];
        },
        enabled: !!user?.cafe_id,
    });

    const filtered = useMemo(() => {
        const q = debouncedQuery.toLowerCase();
        if (!q) return items;
        return items.filter((i: any) =>
            [i.item_name, i.category, i.item_description].some((v) =>
                v?.toLowerCase().includes(q)
            )
        );
    }, [items, debouncedQuery]);

    const form = useForm<ItemInput>({
        resolver: zodResolver(UpdateItemSchema),
        defaultValues: {
            item_name: "",
            item_description: "",
            category: "",
            price: 0,
            recommended: false,
        },
    });

    //  Create / Update
    const onSubmit = async (data: ItemInput) => {
        try {
            if (editingId) {
                await api.put("/cafes/items/update", { ...data, item_id: editingId });
                toast.success("Item updated successfully!");
            } else {
                if (!user) return;
                await api.post("/cafes/items/create", {
                    ...data,
                    cafe_id: user.cafe_id,
                });
                toast.success("Item created successfully!");
            }
            form.reset();
            setEditingId(null);
            setTab("update");
            queryClient.invalidateQueries({ queryKey: ["items"] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save item");
        }
    };

    //  Delete item
    const handleDelete = async (id: number) => {
        if (!confirm("Delete this item permanently?")) return;
        await toast.promise(
            api.delete("/cafes/items/delete", { data: { item_id: id } }),
            {
                loading: "Deleting...",
                success: "Item deleted",
                error: "Failed to delete item",
            }
        );
        queryClient.invalidateQueries({ queryKey: ["items"] });
    };

    //  Upload image
    const handleUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        item_id: number
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("file_name", file.name);
        formData.append("item_id", String(item_id));
        formData.append("bucket", "krown-cafes");

        await toast.promise(
            api.post("/cafes/items/images/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            }),
            {
                loading: "Uploading image...",
                success: "Image uploaded!",
                error: "Failed to upload image",
            }
        );
        queryClient.invalidateQueries({ queryKey: ["items"] });
    };

    //  Delete image
    const handleDeleteImage = async (
        item_id: number,
        image_url: string,
        image_id?: number
    ) => {
        if (!confirm("Delete this image?")) return;
        await toast.promise(
            api.delete("/cafes/items/images/delete", {
                data: {
                    item_id,
                    image_id,
                    path: image_url.split("krown-cafes/")[1],
                    bucket: "krown-cafes",
                },
            }),
            {
                loading: "Deleting image...",
                success: "Image deleted",
                error: "Failed to delete image",
            }
        );
        queryClient.invalidateQueries({ queryKey: ["items"] });
    };

    if (loading || isLoading)
        return <p className="text-center mt-10">Loading...</p>;
    if (!user) return null;

    return (
        <div className="p-6 md:p-10">
            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-8 flex gap-4 bg-transparent">
                    <TabsTrigger value="create">Create Items</TabsTrigger>
                    <TabsTrigger value="update">Update Items</TabsTrigger>
                    <TabsTrigger value="images">Update Images</TabsTrigger>
                </TabsList>

                {/* CREATE / UPDATE FORM */}
                <TabsContent value="create">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto"
                    >
                        <h2 className={`${bebasNeue.className} text-3xl font-medium mb-4`}>
                            {editingId ? "Edit Item" : "Create New Item"}
                        </h2>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="grid md:grid-cols-2 gap-4"
                        >
                            <div>
                                <Label>Item Name</Label>
                                <Input {...form.register("item_name")} />
                                <p className="text-red-500 text-sm">
                                    {form.formState.errors.item_name?.message}
                                </p>
                            </div>

                            <div>
                                <Label>Category</Label>
                                <Input {...form.register("category")} />
                            </div>

                            <div>
                                <Label>Price (₹)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...form.register("price", { valueAsNumber: true })}
                                />
                            </div>

                            <div>
                                <Label>Recommended</Label>
                                <Select
                                    onValueChange={(v) =>
                                        form.setValue("recommended", v === "true")
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Yes</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2">
                                <Label>Description</Label>
                                <Textarea rows={3} {...form.register("item_description")} />
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-3 mt-3">
                                {editingId && (
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            form.reset();
                                        }}
                                    >
                                        <X className="w-4 h-4 mr-1" /> Cancel
                                    </Button>
                                )}
                                <Button type="submit" className="gap-1">
                                    <Save className="w-4 h-4" />
                                    {editingId ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </TabsContent>

                {/* UPDATE ITEMS TABLE */}
                <TabsContent value="update">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex justify-between items-center mb-5">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                                <Input
                                    placeholder="Search items..."
                                    className="pl-9"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <Table>
                            <TableCaption>
                                Showing {filtered.length} of {items.length} items
                            </TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Recommended</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence>
                                    {filtered.map((item: any) => (
                                        <motion.tr
                                            key={item.item_id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <TableCell>{item.item_name}</TableCell>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>₹{item.price}</TableCell>
                                            <TableCell>
                                                {item.recommended ? (
                                                    <span className="text-green-600 font-semibold">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 font-semibold">No</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{item.item_description}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingId(item.item_id);
                                                            form.reset(item);
                                                            setTab("create");
                                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                                        }}
                                                    >
                                                        <Edit3 size={14} className="mr-1" /> Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDelete(item.item_id)}
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </motion.div>
                </TabsContent>

                {/* IMAGE MANAGEMENT */}
                <TabsContent value="images">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                                <Input
                                    placeholder="Search by item name..."
                                    className="pl-9"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <Table>
                            <TableCaption>Manage item images</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Image</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((item: any) => (
                                    <motion.tr key={item.item_id} layout>
                                        <TableCell>{item.item_name}</TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell>
                                            {item.cover_img ? (
                                                <Image
                                                    src={item.cover_img}
                                                    alt={item.item_name}
                                                    width={100}
                                                    height={100}
                                                    className="rounded-md object-cover border"
                                                />
                                            ) : (
                                                <span className="text-gray-500 italic">No image</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2 items-center">
                                                <Label
                                                    htmlFor={`upload-${item.item_id}`}
                                                    className="cursor-pointer text-blue-600 flex items-center gap-1"
                                                >
                                                    <Upload size={14} /> Upload
                                                </Label>
                                                <Input
                                                    id={`upload-${item.item_id}`}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleUpload(e, item.item_id)}
                                                />
                                                {item.image_url && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            handleDeleteImage(
                                                                item.item_id,
                                                                item.image_url!,
                                                                item.image_id
                                                            )
                                                        }
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </TableBody>
                        </Table>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
