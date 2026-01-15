"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/client";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { ShoppingBag, User, Search, LogOut, UserCircle, LayoutDashboard } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "./ui/spinner";

const Navbar = () => {
  const { user, loading, role } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  // ⏳ LOADING STATE: Full Screen Overlay
  if (loading)
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        {/* Adjusted size and color for visibility */}
        <Spinner className="size-8 text-zinc-900" />
      </div>
    );

  console.log(role, "  role");
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex-shrink-0">
          <h1 className="text-2xl font-bold tracking-[0.2em] text-zinc-900 font-serif uppercase cursor-pointer">
            Watchera
          </h1>
        </Link>

        {/* Actions (Search, Profile, Cart) */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Search Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-zinc-600 hover:text-black"
          >
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </Button>

          {/* Cart Option */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-zinc-600 hover:text-black"
            onClick={()=>{
              router.replace("/cart")
            }}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
          </Button>

          {/* Profile Option */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full ml-1"
                >
                  <Avatar className="h-9 w-9 border border-zinc-100">
                    <AvatarImage
                      src={user.photoURL || ""}
                      alt={user.displayName || "User"}
                    />
                    <AvatarFallback className="bg-zinc-100 text-zinc-700 text-xs">
                      {user.displayName
                        ? user.displayName.charAt(0).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                {role === "admin" && (
                  <>
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              variant="ghost"
              size="icon"
              className="ml-1 text-zinc-600 hover:text-black"
            >
              <User className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
