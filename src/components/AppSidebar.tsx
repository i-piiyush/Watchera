import { BarChart3, Package, Percent, PlusSquare, Trash2 } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

// Menu items.
export const items = [
  {
    title: "Add Products",
    url: "/admin/add-products",
    icon: PlusSquare, // ➕ clearly means create/add
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: Package, // 📦 Represents orders/shipments
  },
  {
    title: "Delete Products",
    url: "/admin/delete-products",
    icon: Trash2, // 🗑️ destructive action
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3, // 📊 stats / insights
  },
  {
    title: "Add Promo Code",
    url: "/admin/add-promo",
    icon: Percent, // % discounts / offers
  },
];
export function AppSidebar() {
  return (
    <Sidebar className="py-18">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Watchera</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className="
                    group
                    flex items-center gap-3
                    px-3 py-2 rounded-md
                    text-zinc-900
                    transition-all duration-200 ease-out
                    hover:bg-zinc-300
                    hover:text-zinc-900
                  "
                    >
                      {/* Icon */}
                      <item.icon
                        className="
                      h-4 w-4
                      transition-transform duration-200
                      group-hover:translate-x-1
                    "
                      />

                      {/* Text */}
                      <span
                        className="
                      text-sm font-medium
                      transition-colors duration-200
                    "
                      >
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
