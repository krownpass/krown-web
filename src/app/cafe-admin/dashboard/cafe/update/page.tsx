"use client";

import { useState, useEffect } from "react";
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
import { CreateCafeSchema, CreateCafeInput } from "@/lib/validators/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, Trash2 } from "lucide-react";

//  Types for data shape
type CafeData = {
  cafe: CreateCafeInput;
  images: { image_id: string; image_url: string }[];
};

export default function CafeAdminUpdatePage() {
  const { cafeadmin, loading } = useCafeAdmin();
  const queryClient = useQueryClient();

  const form = useForm<CreateCafeInput>({
    resolver: zodResolver(CreateCafeSchema),
    defaultValues: {
      cafe_name: "",
      cafe_location: "",
      cafe_description: "",
      cafe_mobile_no: "",
      cafe_upi_id: "",
      opening_time: "",
      closing_time: "",
    },
  });

  //  Fetch Café + Images
  const { data, isLoading } = useQuery<CafeData>({
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

  //  Reset form once data is fetched
  useEffect(() => {
    if (data?.cafe) form.reset(data.cafe);
  }, [data, form]);

  const images = data?.images ?? [];

  // Mutations
  const updateCafe = useMutation({
    mutationFn: async (payload: CreateCafeInput) =>
      api.put(`/cafes/${cafeadmin?.cafe_id}`, payload),
    onSuccess: () => {
      toast.success("Café details updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["cafe", cafeadmin?.cafe_id] });
    },
    onError: () => toast.error("Failed to update café details"),
  });

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_name", file.name);
      formData.append("cafe_id", cafeadmin!.cafe_id);
      formData.append("bucket", "krown-cafes");

      return api.post("/cafes/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Image uploaded!");
      queryClient.invalidateQueries({ queryKey: ["cafe", cafeadmin?.cafe_id] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Upload failed"),
  });

  const deleteImage = useMutation({
    mutationFn: async ({
      image_id,
      image_url,
    }: {
      image_id: string;
      image_url: string;
    }) =>
      api.delete(`/cafes/images/${image_id}`, {
        data: {
          cafe_id: cafeadmin!.cafe_id,
          path: image_url.split("krown-cafes/")[1],
          bucket: "krown-cafes",
        },
      }),
    onSuccess: () => {
      toast.success("Image deleted");
      queryClient.invalidateQueries({ queryKey: ["cafe", cafeadmin?.cafe_id] });
    },
    onError: () => toast.error("Failed to delete image"),
  });

  // Handlers
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    if (images.length >= 5)
      return toast.error("You can upload up to 5 images only");
    uploadImage.mutate(e.target.files[0]);
  };

  const handleDelete = (image_id: string, image_url: string) => {
    deleteImage.mutate({ image_id, image_url });
  };

  const onSubmit = (data: CreateCafeInput) => {
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
      {/* LEFT — Café Update Form */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Update Café Details</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {[
            { id: "cafe_name", label: "Café Name" },
            { id: "cafe_location", label: "Location" },
            { id: "cafe_description", label: "Description" },
            { id: "cafe_mobile_no", label: "Mobile No" },
            { id: "cafe_upi_id", label: "UPI ID" },
          ].map(({ id, label }) => (
            <div key={id}>
              <Label htmlFor={id}>{label}</Label>
              <Input id={id} {...form.register(id as keyof CreateCafeInput)} />
              {form.formState.errors[id as keyof CreateCafeInput] && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors[id as keyof CreateCafeInput]?.message}
                </p>
              )}
            </div>
          ))}

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

      {/* RIGHT — Image Management */}
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
            onChange={handleUpload}
          />
        </div>

        {uploadImage.isPending && (
          <p className="text-sm text-blue-500">Uploading...</p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          {images.map((img) => (
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
                onClick={() => handleDelete(img.image_id, img.image_url)}
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
