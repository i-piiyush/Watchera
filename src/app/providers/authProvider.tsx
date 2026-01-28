"use client";

import { auth } from "@/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { ApiResponse } from "@/types/apiResponse";
import { AppUser } from "@/types/user";
import { mergeCartAfterLogin } from "@/lib/mergeCartAfterLogin";

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setRole, setLoading, resetAuth } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          resetAuth();
          return;
        }

        setUser(user);

        const token = await user.getIdToken();
        const res = await axios.get<ApiResponse<AppUser | null>>("/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data.data) {
          // Signup race window (10s)
          const createdAt = user.metadata.creationTime
            ? new Date(user.metadata.creationTime).getTime()
            : 0;

          if (Date.now() - createdAt < 10_000) {
            setRole("user"); // default optimistic role
            return;
          }

          resetAuth();
          return;
        }

        setRole(res.data.data.role);
        await mergeCartAfterLogin();
      } catch (error) {
        console.error("AuthProvider error:", error);
        resetAuth();
      } finally {
        // 🔥 THIS is what fixes infinite navbar loading
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return <>{children}</>;
};

export default AuthProvider;
