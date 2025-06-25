
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3, FileText, AlertTriangle, CalendarDays, Percent, CheckCircle, BookOpen, Info, User, Zap, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { TestAttempt } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { startOfMonth, isWithinInterval } from "date-fns";
import { useSubscription } from '@/hooks/use-subscription';

// New StatCard Component with Animation
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  colorClass?: string;
  animate?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, colorClass = "text-primary", animate = false }) => {
  const IconComponent = icon;
  const [animatedValue, setAnimatedValue] = useState<string | number>(0);
  const numericValue = useMemo(() => {
    return typeof value === 'string' ? parseFloat(value.replace('%','').replace(/[^\d.-]/g, '')) : value;
  }, [value]);
  const suffix = typeof value === 'string' && value.includes('%') ? '%' : '';

  useEffect(() => {
    if (animate && typeof numericValue === 'number' && !isNaN(numericValue)) {
      let startTimestamp: number | null = null;
      const duration = 1200; 
      
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentAnimatedNumber = Math.floor(progress * numericValue);
        
        setAnimatedValue(currentAnimatedNumber + suffix);
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
           setAnimatedValue(numericValue + suffix);
        }
      };
      const frameId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(frameId);
    } else {
      setAnimatedValue(value);
    }
  }, [animate, value, numericValue, suffix]);

  return (
    <Card className="shadow-sm hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
        <IconComponent className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorClass}`}>{animatedValue}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
};


export default function MyProgressPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { plan, isLoading: isSubscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const [allUserAttempts, setAllUserAttempts] = useState<TestAttempt[]>([]);
  const [currentMonthAttempts, setCurrentMonthAttempts] = useState<TestAttempt[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttempts() {
      if (isAuthLoading) {
        setIsLoadingAttempts(true);
        return;
      }
      if (!user || !user.displayName || user.displayName.trim() === "") {
        setIsLoadingAttempts(false);
        setAllUserAttempts([]);
        setCurrentMonthAttempts([]);
        return;
      }
      
      const userDisplayNameNormalized = user.displayName.trim().toLowerCase();
      setIsLoadingAttempts(true);
      setError(null);
      try {
        const response = await fetch(`/api/attempts?studentIdentifier=${encodeURIComponent(userDisplayNameNormalized)}`);
        if (!response.ok) throw new Error(`Failed to fetch attempts: ${response.statusText}`);
        
        const allAttemptsData: TestAttempt[] = await response.json();
        const studentSpecificAttempts = allAttemptsData;
        studentSpecificAttempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setAllUserAttempts(studentSpecificAttempts);

        const today = new Date();
        const currentMonthStart = startOfMonth(today);
        const filteredCurrentMonthAttempts = studentSpecificAttempts.filter(attempt => 
          isWithinInterval(new Date(attempt.submittedAt), { start: currentMonthStart, end: today })
        );
        setCurrentMonthAttempts(filteredCurrentMonthAttempts);

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

    const totalMonthlySubmissions = currentMonthAttempts.length;
    const currentMonthTotalScoreSum = currentMonthAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    const currentMonthAverageScore = totalMonthlySubmissions > 0 ? Math.round(currentMonthTotalScoreSum / totalMonthlySubmissions) : 0;
    
    const currentMonthTestsPassed = currentMonthAttempts.filter(attempt => (attempt.scorePercentage || 0) >= 50).length;
    const currentMonthPassRate = totalMonthlySubmissions > 0 ? Math.round((currentMonthTestsPassed / totalMonthlySubmissions) * 100) : 0;
    
    const totalTimeSpentThisMonth = currentMonthAttempts.reduce((sum, attempt) => {
      const duration = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;
      return sum + (isNaN(duration) ? 0 : duration);
    }, 0);
    const averageTimePerAttemptSeconds = totalMonthlySubmissions > 0 ? Math.round(totalTimeSpentThisMonth / totalMonthlySubmissions) : 0;


    return { 
      lifetimeTotalAttempts, 
      totalMonthlySubmissions,
      currentMonthAverageScore, 
      lifetimeTestsPassed, 
      currentMonthPassRate,
      averageTimePerAttemptSeconds,
    };
  }, [allUserAttempts, currentMonthAttempts]);

  const formatTime = (totalSeconds: number) => {
    if (isNaN(totalSeconds)) return "N/A";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
  };

  if (isAuthLoading || isLoadingAttempts || isSubscriptionLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex items-center mb-8"> <Skeleton className="w-10 h-10 rounded-full mr-3" /><Skeleton className="h-8 w-48" /> </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  if (user && user.role === 'teacher') {
    return (
      <div className="container mx-auto py-8 text-center bg-card rounded-lg shadow-sm p-6">
        <Info className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your Personal Test Attempts Summary</h2>
        <p className="text-muted-foreground">This page displays a summary of tests you (<b>{user.displayName}</b>) have personally taken.</p>
        <p className="text-muted-foreground mt-2">To view your students' performance, please visit the <Link href="/dashboard/student-analytics" className="underline text-primary hover:text-primary/80">Student Performance Overview</Link> page.</p>
         <p className="text-sm text-muted-foreground mt-4">Currently, no personal attempts found. If you take a test, your summary will appear here.</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-8 text-center bg-card rounded-lg shadow-sm p-6">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-destructive">{error ? "Error Loading Progress" : "Please Log In"}</h2>
        <p className="text-muted-foreground">{error || "You need to be logged in to view your progress."}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center mb-8">
        <TrendingUp className="w-10 h-10 text-primary mr-3" />
        <div>
            <h1 className="text-3xl font-bold font-headline">My Personal Progress</h1>
            <p className="text-muted-foreground">A summary of your test performance for the current month.</p>
        </div>
      </div>

      {allUserAttempts.length === 0 ? (
         <Card className="text-center py-12 shadow-md">
          <CardContent className="flex flex-col items-center gap-3">
            <BookOpen className="w-12 h-12 text-muted-foreground/70" />
            <p className="text-muted-foreground">No personal test attempts found for "{user.displayName}".</p>
            <p className="text-sm text-muted-foreground">Take a test to see your progress summary here!</p>
            <Button asChild variant="link"><Link href="/dashboard">Explore Available Tests</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Attempts This Month" value={summaryStats.totalMonthlySubmissions} icon={FileText} description={`Lifetime attempts: ${summaryStats.lifetimeTotalAttempts}`} animate={true}/>
          <StatCard title="Average Score (This Month)" value={`${summaryStats.currentMonthAverageScore}%`} icon={Percent} description="Your average score for this calendar month." animate={true}/>
          <StatCard title="Avg. Time / Attempt (This Month)" value={formatTime(summaryStats.averageTimePerAttemptSeconds)} icon={Clock} description="Your average completion time this month." animate={true}/>
         
          {plan.id === 'free' ? (
            <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-sm flex flex-col items-center justify-center text-center bg-primary/5 border-primary/20 p-6">
              <CardHeader className="p-0">
                <CardTitle className="font-semibold text-primary flex items-center"><Zap className="mr-2 h-5 w-5" />Unlock Full Analytics</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-2 mb-4">
                <p className="text-sm text-muted-foreground">Upgrade to a Student plan to view lifetime pass rates, detailed reports, and more insights.</p>
              </CardContent>
              <CardFooter className="p-0">
                <Button asChild size="sm">
                  <Link href="/dashboard/plans">View Student Plans</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <StatCard title="Tests Passed (Lifetime)" value={summaryStats.lifetimeTestsPassed} icon={CheckCircle} description="Lifetime tests with score ≥ 50%." colorClass="text-green-500" animate={true}/>
              <StatCard title="Pass Rate (This Month)" value={`${summaryStats.currentMonthPassRate}%`} icon={BarChart3} description="Your pass rate for this month." colorClass="text-green-500" animate={true}/>
            </>
          )}
        </div>
      )}
    </div>
  );
}
