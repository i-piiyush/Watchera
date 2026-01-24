"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import axios, { AxiosError } from "axios";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { auth } from "@/firebase/client";
import { AppUser } from "@/types/user";
import { ApiResponse } from "@/types/apiResponse";

// RHF + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VerifyForm, verifySchema } from "@/app/schemas/verifyUserSchema";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// -------------------------
// Steps config
// -------------------------
const STEPS_CONFIG = {
  unverified: [
    { id: "email", label: "Identity" },
    { id: "otp", label: "Verification" },
    { id: "phone", label: "Contact" },
  ],
  verified: [{ id: "phone", label: "Contact" }],
} as const;

export default function VerifyPage() {
  // Page state
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AppUser | undefined>(undefined);

  // Flow state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter()

  // -------------------------
  // React Hook Form
  // -------------------------
  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: "",
      otp: "",
      phone: "",
    },
    mode: "onChange",
  });

  // Steps based on DB emailVerified
  const steps = useMemo(() => {
    return user?.emailVerified
      ? STEPS_CONFIG.verified
      : STEPS_CONFIG.unverified;
  }, [user?.emailVerified]);

  const currentStepId = steps[currentStepIndex]?.id;

  // -------------------------
  // Fetch user once
  // -------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          console.log("user not found");
          return;
        }

        const res = await axios.get<ApiResponse<AppUser>>("/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // -------------------------
  // Sync email into form
  // -------------------------
  useEffect(() => {
    if (!user?.email) return;
    setValue("email", user.email);
  }, [user?.email, setValue]);

  // -------------------------
  // Reset step when emailVerified changes
  // -------------------------
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [user?.emailVerified]);

  // -------------------------
  // Next step handler
  // -------------------------
  const handleNext = async () => {
    setIsSubmitting(true);

    try {
      // --------------------------
      // STEP 1: EMAIL
      // --------------------------
      if (currentStepId === "email") {
        const ok = await trigger("email");
        if (!ok) return;

        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          toast.error("Please login again");
          return;
        }

        // 🔥 Call your backend to SEND OTP using Resend
        await axios.post(
          "/api/verify/email/send-otp",
          { email: watch("email") },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Move to OTP step
        setDirection(1);
        setCurrentStepIndex((prev) => prev + 1);
        return;
      }

      // --------------------------
      // STEP 2: OTP
      // --------------------------
      if (currentStepId === "otp") {
        const ok = await trigger("otp");
        if (!ok) return;

        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          toast.error("Please login again");
          return;
        }

        const otp = watch("otp");
        const email = watch("email");

        // 🔥 Verify OTP from backend (bcrypt compare happens backend)
        await axios.post(
          "/api/verify/email/verify-otp",
          { email, otp },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Move to Phone step
        setDirection(1);
        setCurrentStepIndex((prev) => prev + 1);
        return;
      }

      // --------------------------
      // STEP 3: PHONE
      // --------------------------
      if (currentStepId === "phone") {
        const ok = await trigger("phone");
        if (!ok) return;

        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          toast.error("Please login again");
          return;
        }

        // 🔥 Save phone to DB (manual confirmation later)
        await axios.patch(
          "/api/verify/phone",
          { phone: watch("phone") },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // End
        console.log("Flow complete:", {
          email: watch("email"),
          otp: watch("otp"),
          phone: watch("phone"),
        });

        router.replace("/checkout")


        

        return;
      }
    } catch (error) {
      const err = error as AxiosError<ApiResponse<null>>;

      toast.error(
        err.response?.data.message || "Something went wrong, try again",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-zinc-50">
        <Spinner className="size-6 text-zinc-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 text-zinc-900 p-4 font-sans selection:bg-amber-100">
      <div className="w-full max-w-md bg-zinc-50 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full p-6 flex gap-2 z-20">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="h-1 flex-1 bg-zinc-100 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-zinc-900"
                initial={{ width: "0%" }}
                animate={{
                  width:
                    index < currentStepIndex
                      ? "100%"
                      : index === currentStepIndex
                        ? "100%"
                        : "0%",
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="pt-16 px-8 pb-10 min-h-96 flex flex-col justify-between">
          <div className="space-y-2 mb-8">
            <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-400 font-medium">
              Verification
            </h2>

            <h1 className="text-3xl font-serif text-zinc-900 tracking-tight">
              {currentStepId === "email" && "Enter your email"}
              {currentStepId === "otp" && "Verify access"}
              {currentStepId === "phone" && "Secure your account"}
            </h1>

            <p className="text-zinc-500 text-sm">
              {currentStepId === "email" &&
                "We will send a one-time code to verify your identity."}
              {currentStepId === "otp" &&
                `Enter the 6-digit code sent to ${watch("email")}`}
              {currentStepId === "phone" &&
                "Please provide an Indian mobile number (+91)."}
            </p>
          </div>

          {/* Animated Form Steps */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStepIndex}
                custom={direction}
                initial={{ x: direction > 0 ? 20 : -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -20 : 20, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-2"
              >
                {/* STEP 1: EMAIL */}
                {currentStepId === "email" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-300" />
                      <Input
                        placeholder="name@example.com"
                        className="pl-10 h-12 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-900 bg-transparent rounded-lg text-base"
                        {...register("email")}
                      />
                    </div>

                    {errors.email && (
                      <p className="text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                )}

                {/* STEP 2: OTP */}
                {currentStepId === "otp" && (
                  <div className="space-y-2">
                    <div className="flex justify-center py-4">
                      <InputOTP
                        maxLength={6}
                        value={watch("otp") || ""}
                        onChange={(val) => setValue("otp", val)}
                      >
                        <InputOTPGroup className="gap-2">
                          {[...Array(6)].map((_, i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className="h-12 w-10 border border-zinc-200 rounded-md text-lg shadow-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {errors.otp && (
                      <p className="text-xs text-red-500 text-center">
                        {errors.otp.message}
                      </p>
                    )}
                  </div>
                )}

                {/* STEP 3: PHONE */}
                {currentStepId === "phone" && (
                  <div className="space-y-2">
                    <div className="relative flex items-center">
                      <span className="absolute left-3 top-3 text-zinc-400 select-none">
                        +91
                      </span>
                      <Input
                        type="tel"
                        placeholder="98765 43210"
                        className="pl-12 h-12 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-900 bg-transparent rounded-lg text-base tracking-widest"
                        value={watch("phone") || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val.length <= 10) setValue("phone", val);
                        }}
                      />
                    </div>

                    {errors.phone && (
                      <p className="text-xs text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-8 py-4 h-auto text-sm tracking-wide transition-all shadow-lg shadow-zinc-200"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  {currentStepIndex === steps.length - 1
                    ? "Finish"
                    : "Continue"}{" "}
                  <Loader2 className="animate-spin w-5 h-5" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {currentStepIndex === steps.length - 1
                    ? "Finish"
                    : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
