import { z } from "zod";

export const syncUserSchema = z.object({
  idToken: z.string().min(1),
  name: z.string().trim().min(2).optional(),
});
