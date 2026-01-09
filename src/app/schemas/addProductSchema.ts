import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must not exceed 100 characters"),
    description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must not exceed 1000 characters"),
    price: z.number().positive("Price must be a positive number"),
    stock: z.number().int("Stock must be an integer").min(0, "Stock cannot be negative"),
   
});
