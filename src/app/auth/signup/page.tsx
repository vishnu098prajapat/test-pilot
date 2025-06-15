
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Home, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { signUpWithNameAndDob } from "@/lib/auth-actions";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required."),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of Birth must be in YYYY-MM-DD format."),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      dob: "",
    },
  });

  const handleSignUp = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    console.log("SignupPage: handleSignUp called with data:", data);
    try {
      const result = await signUpWithNameAndDob(data.name, data.dob);
      console.log("SignupPage: signUpWithNameAndDob result:", result);

      if (result.success && result.user) {
        login(result.user); 
        toast({
          title: "Sign Up Successful",
          description: `Welcome, ${result.user.displayName}! Your account is ready. Redirecting...`,
          duration: 2000,
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Sign Up Failed",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("SignupPage: Signup error", error);
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
  
  const getMaxDate = () => {
    const today = new Date();
    // Prevent selecting future dates
    return today.toISOString().split("T")[0];
  }

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
          <CardTitle className="text-3xl font-headline text-center text-foreground">Create Account</CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-2">
            Provide your Name and Date of Birth to create an account.
          </CardDescription>
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
                      <Input placeholder="Enter your full name" {...field} />
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
                        className="w-full"
                        min="1900-01-01" // Set a reasonable minimum year
                        max={getMaxDate()}   // Set maximum date to today
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" /> Create Account
                  </>
                )}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline">
              <Link href="/auth/login">Login</Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
