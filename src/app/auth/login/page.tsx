
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSignIn = () => {
    console.log("LoginPage: handleGoogleSignIn called. Attempting to redirect to /auth/select-account");
    router.push("/auth/select-account");
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
          <CardTitle className="text-3xl font-headline text-center text-foreground">Account Login</CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-2">
            Sign in with Google to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={handleGoogleSignIn} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"></path></svg>
              Continue with Google
            </>
          </Button>
           <p className="mt-4 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline">
              <Link href="/auth/signup">Sign up with Google</Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    