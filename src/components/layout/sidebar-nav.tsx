
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
  Users, 
  UserPlus,
  DollarSign,
  Lock,
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
import { useSubscription } from "@/hooks/use-subscription";

const mainNavItemsTeacher = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/create-test", label: "Create Test", icon: PlusCircle },
  { href: "/dashboard/ai-generate-test", label: "AI Generate Test", icon: Sparkles, feature: "ai" }, 
  { href: "/dashboard/groups", label: "Groups", icon: Users, feature: "groups" },
  { href: "/dashboard/results", label: "Results & Leaderboards", icon: BarChart3 }, 
  { href: "/dashboard/student-analytics", label: "Student Performance", icon: TrendingUp, feature: "studentAnalytics" },
];

const mainNavItemsStudent = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, 
  { href: "/dashboard/my-progress", label: "My Progress", icon: TrendingUp },
  { href: "/join", label: "Join Group", icon: UserPlus },
];

const secondaryNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings }, 
  { href: "/dashboard/plans", label: "View Plans", icon: DollarSign },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { open, isMobile, setOpenMobile } = useSidebar(); 
  const { user } = useAuth(); 
  const { plan } = useSubscription();

  const currentNavItems = user?.role === 'teacher' ? mainNavItemsTeacher : mainNavItemsStudent;

  const handleLinkClick = () => {
    if (isMobile) { 
      setOpenMobile(false);
    }
  };

  const navLinkClass = (href: string) => {
    if (href === "/dashboard") {
      // Make dashboard active only for its own page, not for sub-pages like /test/[id]
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isFeatureLocked = (feature?: string): boolean => {
    if (!feature || !plan) return false;
    if (feature === 'ai' && !plan.canUseAI) return true;
    if (feature === 'groups' && !plan.canUseGroups) return true;
    if (feature === 'studentAnalytics' && !plan.canViewStudentAnalytics) return true;
    return false;
  };

  return (
    <nav className="flex flex-col h-full">
      <SidebarMenu className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className={open ? "" : "hidden"}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            {currentNavItems.map((item) => {
              const locked = isFeatureLocked((item as any).feature);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={navLinkClass(item.href)}
                    tooltip={!open ? item.label : undefined}
                    onClick={handleLinkClick} 
                    disabled={locked}
                  >
                    <Link href={locked ? "/dashboard/plans" : item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                      {locked && <Lock className="ml-auto h-3.5 w-3.5" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
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
                    isActive={navLinkClass(item.href)}
                    tooltip={!open ? item.label : undefined}
                    onClick={handleLinkClick} 
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
