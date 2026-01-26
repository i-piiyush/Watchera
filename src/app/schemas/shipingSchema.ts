import { z } from "zod";

// Indian States and UTs list for the dropdown
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
] as const;

export const shippingSchemaFrontend = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long")
    .regex(/^[a-zA-Z\s]+$/, "Only alphabets are allowed"),
  
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name is too long")
    .regex(/^[a-zA-Z\s]+$/, "Only alphabets are allowed"),

  address: z
    .string()
    .min(10, "Please provide a complete address (min 10 chars)")
    .max(200, "Address is too long"),

  landmark: z
    .string()
    .max(100, "Landmark is too long")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .min(2, "City name is too short")
    .max(50, "City name is too long"),

  // --- STATE ADDED HERE ---
  state: z.enum(INDIAN_STATES).catch(() => INDIAN_STATES[0]),

  pincode: z
    .string()
    .length(6, "Pincode must be exactly 6 digits")
    .regex(/^[1-9][0-9]{5}$/, "Invalid Pincode format"),

  paymentMethod: z.enum(["online", "cod"]),
});

export type ShippingFormData = z.infer<typeof shippingSchemaFrontend>;