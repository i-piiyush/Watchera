"use client";

import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { useAuthStore } from "@/store/authStore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRequireAdmin();
  const { loading } = useAuthStore();
  if (loading)
    return (
      <div className="w-full h-screen overflow-hidden flex justify-center items-center">
        <Spinner className="text-zinc-900 size-6" />
      </div>
    );

  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
