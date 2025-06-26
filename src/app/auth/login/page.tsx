
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { signInWithNameAndDob } from "@/lib/auth-actions";

const loginSchema = z.object({
  name: z.string().min(1, "Name is required."),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of Birth must be in YYYY-MM-DD format."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const authContext = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      dob: "",
    },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await signInWithNameAndDob(data.name, data.dob);
      if (result.success && result.user && typeof result.user.id === 'string' && result.user.id.trim() !== '') {
        authContext.login(result.user);
        toast({
          title: "Login Successful",
          description: `Welcome, ${result.user.displayName}! Redirecting...`,
          duration: 2000,
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("LoginPage: Login error", error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  return (
    <div className="relative min-h-screen w-full bg-background flex items-center justify-center overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-tl from-accent/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-pulse delay-75"></div>
      
      <main className="z-10 w-full max-w-md p-4">
        <Card className="w-full bg-card/80 backdrop-blur-lg rounded-2xl shadow-2xl border-white/20">
          <CardHeader className="text-left space-y-4">
             <Link href="/" className="flex items-center gap-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                <span className="text-2xl font-bold font-headline">Test Pilot</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sign in</h1>
              <p className="text-muted-foreground">to continue to your dashboard</p>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} className="py-6"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="w-full py-6"
                          min="1900-01-01"
                          max={getMaxDate()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full py-6 text-lg" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Sign In"}
                </Button>
              </form>
            </Form>
             <p className="mt-6 text-center text-sm text-muted-foreground">
              New to Test Pilot?{" "}
              <Button variant="link" asChild className="p-0 h-auto font-semibold text-primary hover:underline">
                <Link href="/auth/signup">Create an account</Link>
              </Button>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
