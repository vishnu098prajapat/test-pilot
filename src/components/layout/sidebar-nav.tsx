
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
  Users, // Existing icon, good for Student Performance
  DollarSign // New icon for Plans
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
import { useAuth } from "@/hooks/use-auth"; 

const mainNavItemsTeacher = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tests", label: "My Tests", icon: ClipboardList },
  { href: "/dashboard/create-test", label: "Create Test", icon: PlusCircle },
  { href: "/dashboard/ai-generate-test", label: "AI Generate Test", icon: Sparkles }, 
  { href: "/dashboard/results", label: "Results & Leaderboards", icon: BarChart3 }, 
  { href: "/dashboard/student-analytics", label: "Student Performance", icon: Users }, // Renamed from Student Analytics
  { href: "/dashboard/my-progress", label: "My Personal Progress", icon: TrendingUp },
];

const mainNavItemsStudent = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, 
  { href: "/dashboard/my-progress", label: "My Progress", icon: TrendingUp },
];


const secondaryNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings }, 
  { href: "/dashboard/plans", label: "View Plans", icon: DollarSign }, // Added Plans link
];


export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar(); 
  const { user } = useAuth(); 

  const currentNavItems = user?.role === 'teacher' ? mainNavItemsTeacher : mainNavItemsStudent;

  const navLinkClass = (href: string, exact: boolean = false) => {
    const isActive = exact 
      ? pathname === href 
      : (href === "/dashboard/tests" && pathname.startsWith("/dashboard/test/")) 
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
                  isActive={navLinkClass(item.href, ["/dashboard", "/dashboard/ai-generate-test", "/dashboard/my-progress", "/dashboard/student-analytics", "/dashboard/plans"].includes(item.href))} 
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
          <SidebarGroupLabel className={open ? "" : "hidden"}>Account & Billing</SidebarGroupLabel>
           <SidebarGroupContent>
            {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={navLinkClass(item.href, item.href === "/dashboard/plans")}
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
