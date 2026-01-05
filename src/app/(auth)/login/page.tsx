"use client";

import { auth } from "@/firebase/client";
import { ApiResponse } from "@/types/apiResponse";
import axios, { AxiosError } from "axios";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import React from "react";

const Login = () => {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      // 1️⃣ Configure Google provider
      const provider = new GoogleAuthProvider();

      // 2️⃣ Open Google OAuth popup (can fail / be cancelled)
      const result = await signInWithPopup(auth, provider);

      // 3️⃣ Always get Firebase ID token (proof of auth)
      const idToken = await result.user.getIdToken();

      // 4️⃣ Call backend to sync Firebase user → App user
      const res = await axios.post<ApiResponse>("/api/auth/sync-user", {
        idToken, // payload key MUST match backend
      });

      // 5️⃣ Use HTTP status as source of truth (not body)
      if (res.status === 200) {
        router.push("/");
      }
    } catch (error) {
      // 6️⃣ Strongly typed axios error handling
      const err = error as AxiosError<ApiResponse>;

      // Backend-provided message (preferred)
      if (err.response?.data?.message) {
        console.error(err.response.data.message);
      } else {
        console.error("Login failed or cancelled");
      }
    }
  };

  return (
    <button onClick={handleGoogleLogin}>
      Continue with Google
    </button>
  );
};

export default Login;
