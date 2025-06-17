
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, BarChart3, FileText, AlertTriangle, CalendarDays, Percent, CheckCircle, BookOpen, Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { TestAttempt } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { startOfMonth, isWithinInterval } from "date-fns";

export default function MyProgressPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [allUserAttempts, setAllUserAttempts] = useState<TestAttempt[]>([]);
  const [currentMonthAttempts, setCurrentMonthAttempts] = useState<TestAttempt[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttempts() {
      if (isAuthLoading) {
        console.log("[MyProgressPage] Auth loading, waiting...");
        setIsLoadingAttempts(true);
        return;
      }

      if (!user || !user.displayName || user.displayName.trim() === "") {
        console.warn("[MyProgressPage] User or user.displayName not available or empty. Cannot fetch attempts. User:", JSON.stringify(user));
        setIsLoadingAttempts(false);
        setAllUserAttempts([]);
        setCurrentMonthAttempts([]);
        return;
      }
      
      const userDisplayNameNormalized = user.displayName.trim().toLowerCase();
      console.log(`[MyProgressPage] Fetching attempts. Current user for filter: "${user.displayName}" (Raw), Normalized: "${userDisplayNameNormalized}"`);

      setIsLoadingAttempts(true);
      setError(null);
      try {
        const response = await fetch(`/api/attempts`); 
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch attempts: ${response.statusText}`);
        }
        const allAttemptsData: TestAttempt[] = await response.json();
        console.log(`[MyProgressPage] All attempts fetched from API: ${allAttemptsData.length}`);
        
        const studentSpecificAttempts = allAttemptsData.filter(attempt => {
          const attemptIdentifierRaw = attempt.studentIdentifier;
          const attemptIdentifierNormalized = attemptIdentifierRaw?.trim().toLowerCase();
          const match = attemptIdentifierNormalized === userDisplayNameNormalized;
          
          if (!match && (attemptIdentifierNormalized || userDisplayNameNormalized)) { 
            console.log(`[MyProgressPage] Mismatch Detail: Attempt ID ${attempt.id}, Stored Identifier (Raw): "${attemptIdentifierRaw}", Stored (Normalized): "${attemptIdentifierNormalized || 'undefined'}") vs User DisplayName (Raw): "${user.displayName}", User (Normalized): "${userDisplayNameNormalized}"`);
          }
          return match;
        });
        
        console.log(`[MyProgressPage] Found ${studentSpecificAttempts.length} student-specific attempts after filtering for display name: "${userDisplayNameNormalized}".`);

        studentSpecificAttempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setAllUserAttempts(studentSpecificAttempts);

        const today = new Date();
        const currentMonthStart = startOfMonth(today);
        const filteredCurrentMonthAttempts = studentSpecificAttempts.filter(attempt => {
          const attemptDate = new Date(attempt.submittedAt);
          return isWithinInterval(attemptDate, { start: currentMonthStart, end: today });
        });
        setCurrentMonthAttempts(filteredCurrentMonthAttempts);
        console.log(`[MyProgressPage] Found ${filteredCurrentMonthAttempts.length} attempts for the current month.`);

      } catch (e: any) {
        console.error("[MyProgressPage] Error fetching student attempts:", e);
        setError(e.message || "Could not load your progress data.");
        toast({ title: "Error", description: "Failed to load progress data.", variant: "destructive" });
      } finally {
        setIsLoadingAttempts(false);
      }
    }

    fetchAttempts();
  }, [user, isAuthLoading, toast]);

  const summaryStats = useMemo(() => {
    const lifetimeTotalAttempts = allUserAttempts.length;
    const lifetimeTestsPassed = allUserAttempts.filter(attempt => (attempt.scorePercentage || 0) >= 50).length;

    const currentMonthTotalScoreSum = currentMonthAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    const currentMonthAverageScore = currentMonthAttempts.length > 0 ? Math.round(currentMonthTotalScoreSum / currentMonthAttempts.length) : 0;
    const currentMonthTestsPassed = currentMonthAttempts.filter(attempt => (attempt.scorePercentage || 0) >= 50).length;
    const currentMonthPassRate = currentMonthAttempts.length > 0 ? Math.round((currentMonthTestsPassed / currentMonthAttempts.length) * 100) : 0;

    return { 
      lifetimeTotalAttempts, 
      currentMonthAverageScore, 
      lifetimeTestsPassed, 
      currentMonthPassRate 
    };
  }, [allUserAttempts, currentMonthAttempts]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isAuthLoading || isLoadingAttempts) {
    return (
      <div className="container mx-auto py-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-8"> <Skeleton className="w-10 h-10 rounded-full mr-3" /><Skeleton className="h-8 w-48" /> </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-1/2" /><Skeleton className="h-8 w-full mt-2" /></CardContent><CardFooter><Skeleton className="h-9 w-24" /></CardFooter></Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!user) { 
    return (
      <div className="container mx-auto py-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-lg shadow-sm p-6">
        <AlertTriangle className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Please Log In</h2>
        <p className="text-muted-foreground">
          You need to be logged in to view your progress.
        </p>
      </div>
    );
  }
  
  if (user.role === 'teacher' && currentMonthAttempts.length === 0 && allUserAttempts.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-lg shadow-sm p-6">
        <Info className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Teacher View - My Progress</h2>
        <p className="text-muted-foreground">
          This page displays test attempts you've made under your teacher name: "{user.displayName}".<br/>
          For aggregated results of tests you've created for students, please visit the <Link href="/dashboard/results" className="underline text-primary hover:text-primary/80">Results page</Link>.
        </p>
         <p className="text-sm text-muted-foreground mt-4">Currently, no attempts found for "{user.displayName}". If you take a test using this name, it will appear here.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Progress</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex items-center mb-8">
        <TrendingUp className="w-10 h-10 text-primary mr-3" />
        <div>
            <h1 className="text-3xl font-bold font-headline">My Progress</h1>
            <p className="text-muted-foreground">Track your test performance for: {user.displayName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Attempts (Lifetime)</CardTitle><FileText className="h-4 w-4 text-sky-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summaryStats.lifetimeTotalAttempts}</div></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Average Score (Current Month)</CardTitle><Percent className="h-4 w-4 text-sky-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summaryStats.currentMonthAverageScore}%</div></CardContent>
        </Card>
         <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tests Passed (Lifetime)</CardTitle><CheckCircle className="h-4 w-4 text-sky-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summaryStats.lifetimeTestsPassed}</div></CardContent>
        </Card>
         <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pass Rate (Current Month)</CardTitle><BarChart3 className="h-4 w-4 text-sky-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summaryStats.currentMonthPassRate}%</div></CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold font-headline mb-6">Attempt History (Current Month)</h2>
      {currentMonthAttempts.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent className="flex flex-col items-center gap-3">
            <BookOpen className="w-12 h-12 text-muted-foreground/70" />
            <p className="text-muted-foreground">No test attempts found for "{user.displayName}" in the current month.</p>
            <p className="text-sm text-muted-foreground">Take a test to see your progress here!</p>
            <Button asChild variant="link"><Link href="/dashboard">Explore Available Tests</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentMonthAttempts.map((attempt) => (
            <Card key={attempt.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-lg">{attempt.testTitle || `Test ID: ${attempt.testId}`}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                        <CalendarDays className="h-3 w-3 mr-1.5" />
                        {new Date(attempt.submittedAt).toLocaleDateString()}
                    </Badge>
                </div>
                <CardDescription>
                  Score: <span className="font-semibold text-primary">{attempt.scorePercentage}%</span> ({attempt.score}/{attempt.maxPossiblePoints} points)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={attempt.scorePercentage || 0} className={`h-2.5 ${getProgressColor(attempt.scorePercentage || 0)}`} />
                 {attempt.isSuspicious && (
                    <p className="text-xs text-destructive mt-2 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1"/> This attempt was flagged for suspicious activity.
                    </p>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/10">
                  <Link href={`/test/${attempt.testId}/results`}>
                    View Detailed Results
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
