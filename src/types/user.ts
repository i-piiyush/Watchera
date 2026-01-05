export interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  role: "user" | "admin";
  phoneVerified: boolean;
  createdAt: number;
}
