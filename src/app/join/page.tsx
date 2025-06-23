
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, LogIn, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function JoinGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [groupCode, setGroupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setGroupCode(codeFromUrl);
    }
  }, [searchParams]);
  
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please Login", description: "You must be logged in to join a group.", variant: "destructive" });
      router.push(`/auth/login?redirect=/join?code=${groupCode}`);
      return;
    }
    if (!groupCode.trim()) {
      toast({ title: "Group Code Required", description: "Please enter a valid group code.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupCode: groupCode.trim(), studentIdentifier: user.displayName }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: "Success!", description: result.message });
        router.push(`/dashboard/groups/${result.groupId}`);
      } else {
        throw new Error(result.message || "Failed to join group.");
      }

    } catch (error: any) {
      console.error("Join group error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen w-full bg-gray-100 flex items-center justify-center overflow-hidden">
       {/* Decorative background shapes */}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-tl from-accent/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-pulse delay-75"></div>
      
      <main className="z-10 w-full max-w-md p-4">
        <Card className="w-full bg-card/80 backdrop-blur-lg rounded-2xl shadow-2xl border-white/20">
          <CardHeader className="text-left space-y-4">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <GraduationCap className="h-8 w-8" />
              <span className="text-2xl font-bold font-headline">Test Pilot</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Join a Group</h1>
              <CardDescription>Enter the code provided by your teacher to join their group.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isAuthLoading ? (
              <div className="text-center text-muted-foreground">Loading user details...</div>
            ) : user ? (
              <form onSubmit={handleJoinGroup} className="space-y-6">
                <div>
                  <Label htmlFor="groupCode">Group Code</Label>
                  <Input
                    id="groupCode"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="py-6 text-center text-lg tracking-[0.3em]"
                    autoCapitalize="characters"
                  />
                </div>
                <Button type="submit" className="w-full py-6 text-lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                  Join Group
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 p-4 border rounded-lg bg-secondary/50">
                <p className="text-muted-foreground">You need to be logged in to join a group.</p>
                <Button asChild>
                  <Link href={`/auth/login?redirect=/join?code=${groupCode}`}>
                    <LogIn className="mr-2 h-4 w-4" /> Login to Continue
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

