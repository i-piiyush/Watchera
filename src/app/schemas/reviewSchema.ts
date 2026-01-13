import { z } from "zod";


export const ReviewSchema = z.object({
  userId: z.string().min(1),
  user: z.string().min(1),
  avatar: z.string().optional().default(""),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1),
  likes: z.number().int().min(0).default(0),
  createdAt: z.number(),
  likedBy: z.array(z.string()).default([])
});
export const createReviewSchemaFrontend = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(5, "Review must be at least 5 characters"),
});