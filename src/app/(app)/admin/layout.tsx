"use client";

import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready } = useRequireAdmin();

  if (!ready) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Spinner className="size-6" />
      </div>
    );
  }

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
