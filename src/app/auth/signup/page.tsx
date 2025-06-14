
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogleAction } from "@/lib/auth-actions";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogleAction(); 
      if (result.success && result.user) {
        login(result.user); 
        toast({
          title: "Sign Up Successful",
          description: `Welcome, ${result.user.displayName || result.user.email}! Your account is ready.`,
          duration: 2000,
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Sign Up Failed",
          description: result.message || "An unexpected error occurred with Google Sign-Up.",
          variant: "destructive",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "Sign Up Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-purple-600 to-accent p-4 relative overflow-hidden">
      {/* Background Animated Circles */}
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-[-60px] left-[-60px] w-72 h-72 bg-pink-500/20 rounded-full filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-90px] right-[-90px] w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] left-[40%] w-80 h-80 bg-indigo-500/15 rounded-full filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" asChild className="text-white hover:bg-white/10">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Home
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl relative z-10">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center text-white">Create Account</CardTitle>
          <CardDescription className="text-center text-white/80">Join Test Pilot using Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={handleGoogleSignUp} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"></path></svg>
                Continue with Google
              </>
            )}
          </Button>
          <p className="mt-4 text-center text-sm text-white/80">
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto text-white/90 hover:text-white">
              <Link href="/auth/login">Login with Google</Link>
            </Button>
          </p>
          <p className="mt-6 text-center text-sm text-white/70">
            This app uses a simulated Google Sign-In for demonstration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

