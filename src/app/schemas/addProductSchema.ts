import { z } from "zod";

const imageSchema = z.object({
  url: z.string().url(),
  fileId: z.string(),
});

const variantSchema = z.object({
  color: z.string().min(1),
  stock: z.number().int().min(0),
  images: z.array(imageSchema).min(1),
});

// ✅ FIXED: Added discountedPrice to Backend Schema
export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  discountedPrice: z.number().min(0).optional().nullable(), // Allow optional/null
  variants: z.array(variantSchema).min(1),
});

export const createProductSchemaFrontend = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(1, "Price is required"),
  discountedPrice: z.number().min(0).optional(),
})
.refine((data) => {
  // Logic: If discount exists, it must be less than regular price
  if (data.discountedPrice && data.discountedPrice >= data.price) {
    return false;
  }
  return true;
}, {
  message: "Discount price must be less than regular price",
  path: ["discountedPrice"],
});