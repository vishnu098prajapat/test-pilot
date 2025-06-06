
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  Settings,
  BarChart3,
  BookOpenCheck,
  Sparkles // Added Sparkles
} from "lucide-react";
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar, 
} from "@/components/ui/sidebar";
import React from "react";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tests", label: "My Tests", icon: ClipboardList },
  { href: "/dashboard/create-test", label: "Create Test", icon: PlusCircle },
  { href: "/dashboard/ai-generate-test", label: "AI Generate Test", icon: Sparkles }, // New Item
  { href: "/dashboard/results", label: "Results", icon: BarChart3 }, 
];

const secondaryNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings }, 
];


export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar(); // Get sidebar state for tooltip logic

  const navLinkClass = (href: string, exact: boolean = false) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return isActive;
  };

  return (
    <nav className="flex flex-col h-full">
      <SidebarMenu className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className={open ? "" : "hidden"}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={navLinkClass(item.href, item.href === "/dashboard" || item.href === "/dashboard/ai-generate-test")}
                  tooltip={!open ? item.label : undefined}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarMenu>

      <SidebarMenu className="mt-auto">
         <SidebarGroup>
          <SidebarGroupLabel className={open ? "" : "hidden"}>Account</SidebarGroupLabel>
           <SidebarGroupContent>
            {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={navLinkClass(item.href)}
                    tooltip={!open ? item.label : undefined}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
           </SidebarGroupContent>
         </SidebarGroup>
      </SidebarMenu>
    </nav>
  );
}

