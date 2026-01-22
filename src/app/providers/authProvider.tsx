"use client";

import { auth } from "@/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
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
          setLoading(false);
          return;
        }

        setUser(user);

        const token = await user.getIdToken();
        const res = await axios.get<ApiResponse<AppUser | null>>("/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data.data) {
          // Check if the user was created very recently (e.g., last 10 seconds)
          // This helps identify if it's just a signup race condition
          const isBrandNewUser =
            user.metadata.creationTime &&
            Date.now() - new Date(user.metadata.creationTime).getTime() < 10000;

          if (isBrandNewUser) {
            // Don't logout! Just assume default role and wait for next sync or page load.
            setRole("user");
            setLoading(false);
            return;
          }
          resetAuth();
          return;
        }

        setRole(res.data.data.role);

        await mergeCartAfterLogin();
      } catch (error) {
        resetAuth();
      } finally {
        setLoading(false); // ✅ ALWAYS
      }
    });

    return () => unsub();
  }, []);

  return <>{children}</>;
};

export default AuthProvider;
