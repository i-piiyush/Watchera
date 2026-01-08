import { create } from "zustand";
import { User } from "firebase/auth";

type Role = "user" | "admin" | null;

interface AuthState {
  user: User | null;
  role: Role;
  loading: boolean;

  // setters
  setUser: (user: User | null) => void;
  setRole: (role: Role) => void;
  setLoading: (loading: boolean) => void;

  // helpers
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,

  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),

  resetAuth: () =>
    set({
      user: null,
      role: null,
      loading: false,
    }),
}));
