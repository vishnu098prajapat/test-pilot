
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, UserCircle, CalendarDays, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center mb-8">
        <Settings className="w-10 h-10 text-primary mr-3" />
        <h1 className="text-3xl font-bold font-headline">Account Settings</h1>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-1/3" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      ) : user ? (
        <Card className="w-full max-w-lg mx-auto shadow-lg">
          <CardHeader className="text-center">
            <UserCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline">{user.displayName}</CardTitle>
            <CardDescription>Manage your account details and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <UserCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{user.displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{user.dob}</p>
                </div>
              </div>
               {user.email && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                  <UserCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email (if provided)</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>More account management options will be available soon.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
         <Card className="text-center py-12">
          <CardHeader>
            <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline">User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please log in to view your settings.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8 text-center bg-secondary/30 border-secondary">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Application Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Theme settings and other application-wide preferences will appear here in a future update.
          </p>
          <p className="text-sm text-muted-foreground">We appreciate your patience as we build these features.</p>
        </CardContent>
      </Card>
    </div>
  );
}
