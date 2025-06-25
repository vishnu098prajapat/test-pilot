"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { signUpWithNameAndDob } from "@/lib/auth-actions";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required."),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of Birth must be in YYYY-MM-DD format."),
  role: z.enum(['student', 'teacher'], {
    required_error: "You need to select a role."
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const authContext = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      dob: "",
      role: "student",
    },
  });

  const handleSignUp = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      const ipResponse = await fetch('/api/get-ip');
      if (!ipResponse.ok) {
        throw new Error('Could not verify your network details. Please try again.');
      }
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;

      const result = await signUpWithNameAndDob(data.name, data.dob, data.role, ipAddress);
      
      if (result.success && result.user && typeof result.user.id === 'string' && result.user.id.trim() !== '') {
        authContext.login(result.user);
        toast({
          title: "Sign Up Successful",
          description: `Welcome, ${result.user.displayName}! Redirecting...`,
          duration: 2000,
        });
        const redirectUrl = searchParams.get('redirect') || "/dashboard";
        router.push(redirectUrl);
      } else {
        toast({
          title: "Sign Up Failed",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("SignupPage: Signup error", error);
      toast({
        title: "Sign Up Error",
        description: error.message || "An unexpected error occurred. Please try again.",
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
              <h1 className="text-3xl font-bold text-foreground">Create an account</h1>
              <p className="text-muted-foreground">to start creating and taking tests</p>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} className="py-6"/>
                      </FormControl>
                       <p className="text-xs text-muted-foreground pt-1">This will be your unique identifier. Make sure it's correct.</p>
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
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I am a...</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="student" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Student
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="teacher" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Teacher
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full py-6 text-lg" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
             <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" asChild className="p-0 h-auto font-semibold text-primary hover:underline">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
