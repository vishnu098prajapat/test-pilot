
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, BarChart3, AlertTriangle, ArrowLeft, Clock, CheckCircle, XCircle, FileText, CalendarDays, ShieldAlert, Percent } from 'lucide-react'; // Added Percent here
import { useAuth } from '@/hooks/use-auth';
import type { Test, TestAttempt, StudentAnswer } from '@/lib/types';
import { getTestsByTeacher } from '@/lib/store'; // To get test titles if not in attempt
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudentDetailSummary {
  totalAttempts: number;
  averageScore: number;
  averageTimePerAttemptSeconds: number;
  testsPassedCount: number;
  redFlaggedAttemptsCount: number;
}

export default function IndividualStudentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const studentIdentifier = decodeURIComponent(params.studentIdentifier as string);

  const [studentAttempts, setStudentAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudentData() {
      if (isAuthLoading) {
        setIsLoading(true);
        return;
      }
      if (!user || user.role !== 'teacher') {
        setError("Access denied. This page is for teachers only.");
        setIsLoading(false);
        return;
      }
      if (!studentIdentifier) {
        setError("Student identifier is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Fetch all attempts and then filter.
        // In a real app, you'd ideally fetch only relevant attempts from the backend.
        const allAttemptsResponse = await fetch(`/api/attempts?studentIdentifier=${encodeURIComponent(studentIdentifier)}`);
        if (!allAttemptsResponse.ok) {
          throw new Error("Failed to fetch student attempts.");
        }
        const allAttemptsData: TestAttempt[] = await allAttemptsResponse.json();

        // Filter attempts for tests created by the current teacher
        const teacherTests = await getTestsByTeacher(user.id);
        const teacherTestIds = new Set(teacherTests.map(t => t.id));
        
        const filteredAttempts = allAttemptsData.filter(attempt => 
            attempt.studentIdentifier.toLowerCase() === studentIdentifier.toLowerCase() &&
            teacherTestIds.has(attempt.testId)
        );
        
        filteredAttempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setStudentAttempts(filteredAttempts);

      } catch (e: any) {
        console.error("[IndividualStudentAnalyticsPage] Error fetching data:", e);
        setError(e.message || "Could not load student's analytics data.");
        toast({ title: "Error", description: "Failed to load student data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudentData();
  }, [studentIdentifier, user, isAuthLoading, toast]);

  const summaryStats = useMemo((): StudentDetailSummary | null => {
    if (studentAttempts.length === 0) return null;

    const totalAttempts = studentAttempts.length;
    const totalScoreSum = studentAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    const averageScore = totalAttempts > 0 ? Math.round(totalScoreSum / totalAttempts) : 0;
    
    const totalTimeSpent = studentAttempts.reduce((sum, attempt) => {
      const duration = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;
      return sum + (isNaN(duration) ? 0 : duration);
    }, 0);
    const averageTimePerAttemptSeconds = totalAttempts > 0 ? Math.round(totalTimeSpent / totalAttempts) : 0;

    const testsPassedCount = studentAttempts.filter(attempt => (attempt.scorePercentage || 0) >= 50).length;
    const redFlaggedAttemptsCount = studentAttempts.filter(attempt => attempt.isSuspicious).length;
    
    return { totalAttempts, averageScore, averageTimePerAttemptSeconds, testsPassedCount, redFlaggedAttemptsCount };
  }, [studentAttempts]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-1/4 mb-2" />
        <Skeleton className="h-10 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[1,2,3].map(i => <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>)}
        </div>
        <Card><CardHeader><Skeleton className="h-7 w-1/3" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Student Analytics</h2>
        <p className="text-muted-foreground">{error}</p>
         <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/student-analytics"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Overview</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard/student-analytics">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Student Performance Overview
        </Link>
      </Button>

      <div className="flex items-center mb-8">
        <User className="w-10 h-10 text-primary mr-3" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Analytics for: {studentIdentifier}</h1>
          <p className="text-muted-foreground">Detailed performance and attempt history.</p>
        </div>
      </div>

      {summaryStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <StatCard title="Total Attempts" value={summaryStats.totalAttempts} icon={FileText} />
          <StatCard title="Average Score" value={`${summaryStats.averageScore}%`} icon={Percent} />
          <StatCard title="Avg. Time / Attempt" value={formatTime(summaryStats.averageTimePerAttemptSeconds)} icon={Clock} />
          <StatCard title="Tests Passed (≥50%)" value={summaryStats.testsPassedCount} icon={CheckCircle} colorClass="text-green-500" />
          <StatCard title="Flagged Attempts" value={summaryStats.redFlaggedAttemptsCount} icon={ShieldAlert} colorClass="text-destructive" />
        </div>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Attempt History</CardTitle>
          <CardDescription>List of all tests attempted by this student from your created tests.</CardDescription>
        </CardHeader>
        <CardContent>
          {studentAttempts.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
              <p className="text-muted-foreground">This student has not attempted any of your tests yet.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-3">
                {studentAttempts.map((attempt) => (
                  <Card key={attempt.id} className={`hover:shadow-md transition-shadow ${attempt.isSuspicious ? 'border-destructive dark:border-destructive/70 bg-destructive/5 dark:bg-destructive/10' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold">{attempt.testTitle || "Test (Title Missing)"}</CardTitle>
                        <Badge variant={attempt.scorePercentage >= 50 ? "default" : "destructive"} className="whitespace-nowrap">
                          {attempt.scorePercentage}%
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Attempted on: {new Date(attempt.submittedAt).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Score:</span>
                        <span>{attempt.score} / {attempt.maxPossiblePoints}</span>
                      </div>
                       <div className="flex justify-between">
                        <span className="text-muted-foreground">Time Taken:</span>
                        <span>{formatTime((new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000)}</span>
                      </div>
                      {attempt.isSuspicious && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                          <p className="text-xs text-destructive font-medium flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1.5 shrink-0" />
                            Flagged: <span className="font-normal ml-1">{attempt.suspiciousReason || "Suspicious activity detected."}</span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                     <CardFooter className="pt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/test/${attempt.testId}/leaderboard`}>View Test Leaderboard</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const StatCard = ({ title, value, icon, colorClass = "text-primary" }: { title: string, value: string | number, icon: React.ElementType, colorClass?: string }) => {
  const IconComponent = icon;
  return (
    <Card className="bg-card shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
        <IconComponent className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
};

