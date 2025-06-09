
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ClipboardList, BarChart3, Eye, ArrowRight, Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Test } from "@/lib/types";
import { getTestsByTeacher } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ResultsDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTeacherTests() {
      if (user?.id) {
        setIsLoadingTests(true);
        try {
          const teacherTests = await getTestsByTeacher(user.id);
          setTests(teacherTests);
        } catch (error) {
          toast({ title: "Error", description: "Failed to load tests for results.", variant: "destructive", duration: 2000 });
          console.error("ResultsDashboard fetch error:", error);
        } finally {
          setIsLoadingTests(false);
        }
      } else if (!isAuthLoading) {
        // If auth is loaded and there's no user, don't attempt to load tests
        setIsLoadingTests(false);
      }
    }
    fetchTeacherTests();
  }, [user?.id, isAuthLoading, toast]);

  if (isAuthLoading || isLoadingTests) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-10 w-1/2 mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="container mx-auto py-8 text-center">
        <Info className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Please Log In</h2>
        <p className="text-muted-foreground mb-4">You need to be logged in to view test results.</p>
        <Button asChild>
          <Link href="/auth/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-primary" />
            Test Results & Analytics
          </h1>
          <p className="text-muted-foreground">
            Select a test to view its leaderboard and participant scores.
          </p>
        </div>
      </div>

      {tests.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <ClipboardList className="w-16 h-16 text-muted-foreground/50" />
            <p className="text-muted-foreground text-lg">No tests found.</p>
            <p className="text-sm text-muted-foreground">
              You haven't created any tests yet, or no tests are available.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/create-test">Create a Test</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card key={test.id} className="flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-xl">{test.title}</CardTitle>
                  <Badge variant={test.published ? "default" : "secondary"}>
                    {test.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <CardDescription>{test.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {test.questions.length} Questions
                </p>
                <p className="text-sm text-muted-foreground">
                  Duration: {test.duration} mins
                </p>
                 <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(test.createdAt).toLocaleDateString()}
                  </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/test/${test.id}/leaderboard`}>
                    View Leaderboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
