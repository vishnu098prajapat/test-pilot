
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Loader2, AlertTriangle, Home } from 'lucide-react';

export default function SelectAccountPage() {
  console.log("SelectAccountPage: Component rendering initiated."); // Log 1: Page starts rendering
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("SelectAccountPage: useEffect triggered to fetch users."); // Log 2: useEffect starts
    async function fetchUsers() {
      setIsLoading(true);
      setError(null);
      console.log("SelectAccountPage: fetchUsers function called. Setting isLoading=true."); // Log 3: fetchUsers starts
      try {
        const response = await fetch('/api/mock-users');
        console.log("SelectAccountPage: fetch('/api/mock-users') response status:", response.status); // Log 4: API response status
        if (!response.ok) {
          const errorText = await response.text();
          console.error("SelectAccountPage: Failed to fetch mock users. Status:", response.status, "Error:", errorText);
          throw new Error('Failed to fetch mock users');
        }
        const data: User[] = await response.json();
        console.log("SelectAccountPage: Successfully fetched and parsed mock users data:", data); // Log 5: API data received
        setUsers(data.filter(user => user.email && user.id && user.role)); 
      } catch (e: any) {
        console.error("SelectAccountPage: Error in fetchUsers catch block:", e); // Log 6: Error during fetch
        setError('Could not load user accounts. Please try again or check console.');
      } finally {
        setIsLoading(false);
        console.log("SelectAccountPage: fetchUsers function finished. setIsLoading=false."); // Log 7: fetchUsers ends
      }
    }
    fetchUsers();
  }, []); // Empty dependency array, runs once on mount

  const handleSelectUser = (user: User) => {
    console.log("SelectAccountPage: handleSelectUser called for user:", user.email); // Log 8: User selected
    login(user);
    toast({
      title: "Login Successful",
      description: `Welcome, ${user.displayName || user.email}!`,
      duration: 2000,
    });
    router.push("/dashboard");
    console.log("SelectAccountPage: Redirecting to /dashboard after user selection."); // Log 9: Redirecting to dashboard
  };

  const getInitials = (displayName?: string, email?: string) => {
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      return displayName.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return "TP";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
       <div className="absolute top-4 left-4">
        <Button variant="ghost" asChild className="text-primary hover:bg-primary/10">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Home
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-md bg-card rounded-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center text-foreground">Choose an Account</CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-2">
            Select a mock account to continue to Test Pilot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading accounts...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="text-center py-4 text-destructive">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
              <p>{error}</p>
              <Button variant="link" onClick={() => window.location.reload()} className="mt-2">Try Again</Button>
            </div>
          )}
          {!isLoading && !error && users.length === 0 && (
             <p className="text-center text-muted-foreground py-8">No mock accounts found. Please ensure `mock_users.json` is set up correctly and the API is working.</p>
          )}
          {!isLoading && !error && users.length > 0 && (
            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {users.map((user) => (
                <li key={user.id}>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3 px-4 items-center"
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar className="h-9 w-9 mr-3">
                      <AvatarImage src={undefined} />
                      <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium text-sm text-foreground">{user.displayName || 'Unnamed User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          )}
           <div className="text-center mt-4">
            <Button variant="link" asChild className="p-0 h-auto text-sm">
              <Link href="/auth/login">Back to Login Options</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
       <p className="mt-6 text-center text-xs text-muted-foreground max-w-md">
        This is a simulated account selection for demonstration. In a real application, this would integrate with Google's actual account chooser.
      </p>
    </div>
  );
}
    