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
      if (!user) {
        resetAuth();
        return;
      }

      setUser(user);

      try {
        const token = await user.getIdToken();
        const res = await axios.get<ApiResponse<AppUser | null>>("/api/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.data.data) {
          resetAuth();
          return;
        }
        setRole(res.data.data.role);

        mergeCartAfterLogin()
      } catch (error) {
        resetAuth();
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return <>{children}</>;
};

export default AuthProvider;
