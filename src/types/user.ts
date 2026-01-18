export interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  avatar: string | null;
  role: "user" | "admin";
  phoneVerified: boolean;
  emailVerified: boolean;
  phone?: string | null;
  createdAt: number;
}
