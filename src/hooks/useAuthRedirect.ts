"use client";

import { auth } from "@/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useAuthRedirect = (
  requireAuth: boolean,
  redirectTo: string
) => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (requireAuth && !user) {
        // protected route → not logged in
        router.replace(redirectTo);
      }

      if (!requireAuth && user) {
        // public route → already logged in
        router.replace(redirectTo);
      }

      setChecking(false);
    });

    return () => unsub();
  }, [router, requireAuth, redirectTo]);

  return { checking };
};
