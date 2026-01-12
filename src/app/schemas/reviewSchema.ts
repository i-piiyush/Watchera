import { z } from "zod";

export const ReplySchema = z.object({
  userId: z.string().min(1),
  content: z.string().min(1, "Reply cannot be empty"),
  createdAt: z.number(),
});

export const ReviewSchema = z.object({
  userId: z.string().min(1),     // Firebase UID
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1),
  replies: z.array(ReplySchema).default([]),
  likes: z.number().int().min(0).default(0),
  createdAt: z.number(),
});
