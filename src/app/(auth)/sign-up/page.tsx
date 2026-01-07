"use client";

import { signupSchema } from "@/app/schemas/signUpSchema";
import { auth } from "@/firebase/client";
import { ApiResponse } from "@/types/apiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const SignUp = () => {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    try {
      setLoading(true);

      // 1️⃣ Create Firebase auth user
      const result = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // 2️⃣ Store name in Firebase Auth profile
      await updateProfile(result.user, {
        displayName: data.name,
      });

      // 3️⃣ Get ID token
      const idToken = await result.user.getIdToken(true);

      // 4️⃣ Sync user with backend
      const res = await axios.post<ApiResponse>("/api/auth/sync-user", {
        idToken,
      });

      if (res.status === 200) {
        toast.success("Account created successfully 🎉");
        router.push("/products");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      // 🔴 Firebase Auth errors (signup stage)
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/email-already-in-use":
            toast.error("Account already exists. Please login instead.");
            break;
          case "auth/weak-password":
            toast.error("Password is too weak.");
            break;
          case "auth/invalid-email":
            toast.error("Invalid email address.");
            break;
          default:
            toast.error("Signup failed. Please try again.");
        }
        return;
      }

      // 🔴 Backend / Axios errors (sync-user stage)
      const err = error as AxiosError<ApiResponse>;
      toast.error(
        err.response?.data?.message || "Server error. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 1️⃣ Configure Google provider
      const provider = new GoogleAuthProvider();

      // 2️⃣ Open Google OAuth popup
      const result = await signInWithPopup(auth, provider);

      // 3️⃣ Get Firebase ID token
      const idToken = await result.user.getIdToken();

      // 4️⃣ Sync user with backend
      const res = await axios.post<ApiResponse>("/api/auth/sync-user", {
        idToken,
      });

      // 5️⃣ Success path
      if (res.status === 200) {
        router.push("/products");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.log(error);
      // 🔴 Firebase popup / auth errors
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            toast.info("Login cancelled");
            break;
          case "auth/popup-blocked":
            toast.error("Popup blocked. Please allow popups.");
            break;
          case "auth/account-exists-with-different-credential":
            toast.error(
              "Account exists with another sign-in method. Try email login."
            );
            break;
          default:
            toast.error("Google login failed. Please try again.");
        }
        return;
      }

      // 🔴 Backend / Axios errors
      const err = error as AxiosError<ApiResponse>;
      toast.error(
        err.response?.data?.message || "Server error. Please try again later."
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-6">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {/* Name */}
        <div className="flex flex-col gap-1">
          <input
            placeholder="Name"
            {...form.register("name")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <input
            placeholder="Email"
            {...form.register("email")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <input
            type="password"
            placeholder="Password"
            {...form.register("password")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-3"
      >
        {/* Google SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#34A853"
            d="M46.98 24.55c0-1.64-.15-3.21-.43-4.73H24v9.02h12.95c-.56 3.02-2.26 5.58-4.78 7.3l7.73 6.01C44.43 37.78 46.98 31.72 46.98 24.55z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#EA4335"
            d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.73-6.01c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>

        <span>Continue with Google</span>
      </button>
    </div>
  );
};

export default SignUp;
