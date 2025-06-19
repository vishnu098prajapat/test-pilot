
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
  TrendingUp, 
  Sparkles,
  Users // New icon for Student Analytics
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
import { useAuth } from "@/hooks/use-auth"; // Import useAuth

const mainNavItemsTeacher = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tests", label: "My Tests", icon: ClipboardList },
  { href: "/dashboard/create-test", label: "Create Test", icon: PlusCircle },
  { href: "/dashboard/ai-generate-test", label: "AI Generate Test", icon: Sparkles }, 
  { href: "/dashboard/results", label: "Results & Leaderboards", icon: BarChart3 }, 
  { href: "/dashboard/student-analytics", label: "Student Analytics", icon: Users }, // New for Teacher
  { href: "/dashboard/my-progress", label: "My Personal Progress", icon: TrendingUp },
];

const mainNavItemsStudent = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, // Or a student-specific dashboard
  { href: "/dashboard/my-progress", label: "My Progress", icon: TrendingUp },
  // Students might see available tests or a different view for "tests"
  // { href: "/dashboard/available-tests", label: "Available Tests", icon: ClipboardList }, 
];


const secondaryNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings }, 
];


export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar(); 
  const { user } = useAuth(); // Get user role

  const currentNavItems = user?.role === 'teacher' ? mainNavItemsTeacher : mainNavItemsStudent;

  const navLinkClass = (href: string, exact: boolean = false) => {
    const isActive = exact 
      ? pathname === href 
      : (href === "/dashboard/tests" && pathname.startsWith("/dashboard/test/")) // Special case for individual test management
      ? true 
      : pathname.startsWith(href);
    return isActive;
  };

  return (
    <nav className="flex flex-col h-full">
      <SidebarMenu className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className={open ? "" : "hidden"}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            {currentNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={navLinkClass(item.href, ["/dashboard", "/dashboard/ai-generate-test", "/dashboard/my-progress", "/dashboard/student-analytics"].includes(item.href))} 
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
