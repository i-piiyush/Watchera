"use client";

import { signupSchema } from "@/app/schemas/signUpSchema";
import Beams from "@/components/Beams";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/firebase/client";
import { ApiResponse } from "@/types/apiResponse";
import { AppUser } from "@/types/user";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// ✅ Wait until Firebase auth state is updated (so AuthProvider updates Zustand)
const waitForAuthReady = () =>
  new Promise<void>((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        unsub();
        resolve();
      }
    });
  });

const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    try {
      setLoading(true);

      const result = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      await updateProfile(result.user, {
        displayName: data.name,
      });

      const idToken = await result.user.getIdToken(true);

      const res = await axios.post<ApiResponse<AppUser>>("/api/auth/sync-user", {
        idToken,
      });

      if (res.status === 200) {
        toast.success("Account created successfully 🎉");

        // ✅ important fix
        await waitForAuthReady();

        router.push("/products");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.log(error);

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

      const err = error as AxiosError<ApiResponse<AppUser>>;
      toast.error(
        err.response?.data?.message || "Server error. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const idToken = await result.user.getIdToken();

      const res = await axios.post<ApiResponse<AppUser>>("/api/auth/sync-user", {
        idToken,
      });

      if (res.status === 200) {
        toast.success("Logged in successfully 🎉");

        // ✅ important fix
        await waitForAuthReady();

        router.push("/products");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.log(error);

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

      const err = error as AxiosError<ApiResponse<AppUser>>;
      toast.error(
        err.response?.data?.message || "Server error. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[90vh] overflow-hidden px-3 py-8 w-full   bg-zinc-50 ">
      <div className=" hidden md:block md:w-[60%] rounded-2xl bg-zinc-900 overflow-hidden relative ">
        <Beams lightColor="#fff700" rotation={30} />

        <div className="absolute w-full h-full py-16 px-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  text-white font-bold  z-10 flex flex-col items-center justify-center gap-1">
          <h1 className=" px-4 tracking-tighter text-xl bg-zinc-50/20 backdrop-blur-6xl rounded-full ">
            Watchera.
          </h1>

          <div className="flex flex-col gap-4 justify-center items-center">
            <h1 className="text-center  md:text-5xl xl:text-6xl  mb-5 tracking-tighter  text-zinc-50 leading-none">
              Get started with us
            </h1>
            <p className="text-xl xl:text-2xl text-center  text-zinc-50 leading-none tracking-tighter font-medium xl:w-[75%]">
              Discover premium timepieces crafted for precision, style, and
              people who value time over trends.{" "}
            </p>
          </div>
        </div>
      </div>

      <div className=" tracking-tighter  w-full md:w-[40%] px-4 flex flex-col items-center justify-center gap-7">
        <div className="flex flex-col justify-center gap-2 items-center">
          <h1 className="text-4xl  leading-none font-bold ">Sign Up Account</h1>
          <p className="opacity-70">
            Enter your personal details to create an account
          </p>
        </div>

        <div className="w-full max-w-80 flex flex-col ">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="px-4 py-2 bg-zinc-900 text-zinc-50 border cursor-pointer rounded-lg font-semibold hover:bg-zinc-800 transition flex items-center justify-center gap-3 disabled:opacity-60"
          >
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

        <div className="bg-zinc-900/20 w-full max-w-80 h-px relative ">
          <span className="bg-zinc-50 px-2  absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            or
          </span>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 w-full max-w-80"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="name">Username</label>
            <input
              placeholder="Name"
              {...form.register("name")}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg "
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email">Email</label>
            <input
              placeholder="Email"
              {...form.register("email")}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg "
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              placeholder="Password"
              {...form.register("password")}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg "
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
            className="px-4 py-2 w-full bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                Create Account
                <Spinner />
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div>
          <p className="text-sm font-medium text-zinc-900/40">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-zinc-900 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
