import z from "zod";

export const CreateCafeUserSchema = z.object({
  user_name: z.string().min(3),
  user_email: z.string().email(),
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
});

export type CreateCafeInput = z.infer<typeof CreateCafeSchema>;

export type CreateCafeUserInput = z.infer<typeof CreateCafeUserSchema>;
