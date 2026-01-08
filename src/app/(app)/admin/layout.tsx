"use client";

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
    <div className="flex">
      <aside className="w-64 bg-zinc-900 text-white p-4">Admin Sidebar</aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
