"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRequireAdmin = () => {
  const { user, role, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // ⛔ WAIT
    if (!loading) {
      if (!user) router.replace("/login");
      else if (role !== "admin") router.replace("/products");
    }

    
  }, [user, role, loading, router]);
};
