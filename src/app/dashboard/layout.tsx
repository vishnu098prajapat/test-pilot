
"use client"; // This layout needs to be a client component for useAuth and SidebarProvider

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { useAuth } from '@/hooks/use-auth';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import DashboardHeader from '@/components/layout/dashboard-header';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  useEffect(() => {
    // Detailed logging for auth state and redirection logic
    if (isLoading) {
      console.log(`DashboardLayout: Auth check. Still loading. isLoading: ${isLoading}. Path: ${pathname}.`);
    } else {
      if (!user) {
        console.log(`DashboardLayout: Auth check COMPLETE. User NOT found. isLoading: ${isLoading}, user: ${JSON.stringify(user)}. Path: ${pathname}. Redirecting to /auth/login.`);
        router.push('/auth/login');
      } else {
        console.log(`DashboardLayout: Auth check COMPLETE. User FOUND: ${user.displayName || user.email}. Path: ${pathname}. Not redirecting.`);
      }
    }
  }, [user, isLoading, router, pathname]);


  if (isLoading || (!isLoading && !user)) { // Show skeleton if loading OR if loading is done but user is still null (before redirect effect runs)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 p-8 max-w-sm w-full">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full mt-4" />
        </div>
      </div>
    );
  }
  
  // If user is definitely present and not loading, render the layout
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold font-headline text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            <span className="group-data-[collapsible=icon]:hidden">Test Pilot</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2 group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-sidebar-foreground/70">&copy; {new Date().getFullYear()} Test Pilot</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
