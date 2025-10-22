"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Store,
  Crown,
  LogOut,
  ChevronDown,
  Settings,
  BarChart,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearToken } from "@/lib/auth";
import { useCafeAdmin } from "@/hooks/useCafeAdmin";
import { bebasNeue } from "@/lib/font";
import { useState } from "react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export function CafeAdminSidebarMinimal({ collapsed, setCollapsed }: SidebarProps) {
  const { cafeadmin } = useCafeAdmin();
  const router = useRouter();

  const [cafeMenuOpen, setCafeMenuOpen] = useState(false);

  const handleLogout = () => {
    clearToken();
    router.replace("/cafe-admin/login");
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[64px]" : "w-[220px]"
      } h-screen border-r flex flex-col transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex h-13.5 items-center justify-between px-3 border-b">
        <div className="flex items-center gap-2">
          <Crown className="size-5" />
          {!collapsed && (
            <span className={`${bebasNeue.className} font-medium text-xl`}>
              Krown
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-sm rounded-md px-2 py-1 border"
          >
            Hide
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-2 flex-1 space-y-1">
        <Link href="/cafe-admin/dashboard" className="flex items-center gap-3 px-2 py-2 hover:bg-muted">
          <Home className="size-4" />
          {!collapsed && <span>Home</span>}
        </Link>

        {/* Café Menu */}
        <button
          onClick={() => setCafeMenuOpen(!cafeMenuOpen)}
          className="flex items-center gap-3 px-2 py-2 hover:bg-muted w-full text-left"
        >
          <Store className="size-4" />
          {!collapsed && <span>Cafe</span>}
          {!collapsed && (
            <ChevronDown
              className={`ml-auto size-4 transform transition-transform ${
                cafeMenuOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {!collapsed && cafeMenuOpen && (
          <div className="pl-6 space-y-1">
            <Link href="/cafe-admin/dashboard/cafe/update-items" className="block text-sm hover:underline">
              Update Items 
            </Link>
            <Link href="/cafe-admin/dashboard/cafe/update" className="block text-sm hover:underline">
              Update Cafe
            </Link>
            <Link href="/cafe-admin/dashboard/cafe/bookings" className="block text-sm hover:underline">
              Bookings
            </Link>
            <Link href="/cafe-admin/dashboard/cafe/redeem" className="block text-sm hover:underline">
              Redeem Drinks
            </Link>
          </div>
        )}

        <Link href="/cafe-admin/dashboard/analytics" className="flex items-center gap-3 px-2 py-2 hover:bg-muted">
          <BarChart className="size-4" />
          {!collapsed && <span>Analytics</span>}
        </Link>

        <Link href="/cafe-admin/dashboard/settings" className="flex items-center gap-3 px-2 py-2 hover:bg-muted">
          <Settings className="size-4" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {cafeadmin?.user_name?.[0]?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="grid text-left text-sm">
              <span className="truncate font-medium">{cafeadmin?.user_name}</span>
              <span className="text-xs">{cafeadmin?.user_role}</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 px-2 py-2 hover:bg-muted text-sm"
          >
            <LogOut className="size-4" /> Logout
          </button>
        )}
      </div>
    </aside>
  );
}
