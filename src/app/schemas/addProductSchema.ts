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

export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  variants: z.array(variantSchema).min(1),
});

export const createProductSchemaFrontend = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
})