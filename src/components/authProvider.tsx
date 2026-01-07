"use client";

import { auth } from "@/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsub();
  }, [setUser, setLoading]);

  return <>{children}</>;
};

export default AuthProvider;
