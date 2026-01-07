import { z } from "zod";

export const syncUserSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});


