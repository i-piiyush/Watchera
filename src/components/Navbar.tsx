"use client";

import { auth } from "@/firebase/client";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";

const Navbar = () => {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  // ⏳ Wait until auth state is resolved
  if (loading)
    return (
      <div className="w-full h-screen overflow-hidden flex items-center justify-center">
        <Spinner className="text-zinc-900 size-6" />
      </div>
    );

  const handleAuthClick = async () => {
    if (!user) {
      // 🔐 Not logged in → go to login
      router.push("/login");
      return;
    }

    // 🔓 Logged in → logout
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div className="bg-zinc-900 text-zinc-50 px-6 py-3 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Watchera</h1>

      <button
        onClick={handleAuthClick}
        className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded cursor-pointer"
      >
        {user ? "Logout" : "Login"}
      </button>
    </div>
  );
};

export default Navbar;
