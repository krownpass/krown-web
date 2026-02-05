import { z } from "zod";

export const CreateCafeUserSchema = z.object({
    user_name: z.string().min(3),
    user_email: z.email(),
    user_mobile_no: z.string().min(10),
    login_user_name: z.string().min(3),
    password_hash: z.string().min(6),
    user_role: z.string().optional(),
    cafe_id: z.uuid().optional()
});



export const CreateCafeSchema = z.object({
    cafe_name: z.string().min(3, "Café name is required"),
    cafe_location: z.string().min(5, "Location must be descriptive"),
    cafe_description: z.string().optional(),
    cafe_mobile_no: z
        .string()
        .regex(/^\+?\d{10,15}$/, "Invalid phone number format"),
    cafe_upi_id: z.string().min(5, "Valid UPI ID required"),
    opening_time: z
        .string()
        .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM)"),
    closing_time: z
        .string()
        .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM)"),
    latitude: z
        .number()
        .refine((val) => val >= -90 && val <= 90, "Latitude must be between -90 and 90"),
    longitude: z
        .number()
        .refine((val) => val >= -180 && val <= 180, "Longitude must be between -180 and 180"),
    working_days: z
        .array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]))
        .min(1, "Select at least one working day"),
});

export const DayEnum = z.enum([
    "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN",
]);

export const SlotTimeSchema = z.object({
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
});

export const SlotCategorySchema = z.object({
    name: z.string(),
    hours: z.array(SlotTimeSchema),
});

export const UpdateCafeSchema = z.object({
    cafe_id: z.string().uuid().optional(),
    cafe_name: z.string().optional(),
    cafe_location: z.string().optional(),
    cafe_description: z.string().optional(),
    cafe_mobile_no: z.string().optional(),
    cafe_upi_id: z.string().optional(),
    opening_time: z.string().optional(),
    closing_time: z.string().optional(),
    latitude: z.number().nullable().optional(),      // Changed from cafe_latitude
    longitude: z.number().nullable().optional(),     // Changed from cafe_longitude
    working_days: z.array(DayEnum).optional(),
    is_available: z.boolean().optional(),
    categories: z.array(SlotCategorySchema).optional(),
});
export type UpdateCafeInput = z.infer<typeof UpdateCafeSchema>;

export type CreateCafeInput = z.infer<typeof CreateCafeSchema>;

export type CreateCafeUserInput = z.infer<typeof CreateCafeUserSchema>;

export type Day = z.infer<typeof DayEnum>;

export type SlotCategory = z.infer<typeof SlotCategorySchema>;

export type SlotTime = z.infer<typeof SlotTimeSchema>;
