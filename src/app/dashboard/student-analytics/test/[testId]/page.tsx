
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, AlertTriangle, Home, LayoutDashboard, ArrowLeft, Users, FileText, Percent, Clock, ShieldAlert, CheckCircle, BookOpen } from 'lucide-react';
import type { Test, TestAttempt, StudentAnswer } from '@/lib/types';
import { getTestById } from '@/lib/store';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RankedAttemptForTest extends TestAttempt {
  rank: number | null;
  badge?: { name: string; color: string; icon: React.ElementType };
  correctAnswersCount: number;
  totalQuestionsInAttempt: number;
  timeTakenFormatted: string;
}

interface TestSpecificSummaryStats {
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
  averageTimePerAttemptSeconds: number;
  redFlaggedAttemptsCount: number;
  highestScore: number;
  lowestScore: number;
}

export default function SpecificTestAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;
  const { toast } = useToast();

  const [testDetails, setTestDetails] = useState<Test | null>(null);
  const [attemptsForTest, setAttemptsForTest] = useState<RankedAttemptForTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const formatTime = useCallback((totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "N/A";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
  }, []);

  useEffect(() => {
    if (!testId) {
      setError("Test ID is missing.");
      setIsLoading(false);
      return;
    }

    async function fetchTestAndAttempts() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTest = await getTestById(testId);
        if (!fetchedTest) {
          throw new Error(`Test with ID "${testId}" not found.`);
        }
        setTestDetails(fetchedTest);

        const attemptsResponse = await fetch(`/api/attempts?testId=${testId}`);
        if (!attemptsResponse.ok) {
          const errorData = await attemptsResponse.json();
          throw new Error(errorData.error || `Failed to fetch attempts for test ID ${testId}.`);
        }
        const fetchedAttempts: TestAttempt[] = await attemptsResponse.json();
        
        fetchedAttempts.sort((a, b) => {
          if ((b.scorePercentage ?? 0) !== (a.scorePercentage ?? 0)) {
            return (b.scorePercentage ?? 0) - (a.scorePercentage ?? 0);
          }
          const timeA = (new Date(a.endTime).getTime() - new Date(a.startTime).getTime());
          const timeB = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime());
          return timeA - timeB;
        });

        const rankedAttempts: RankedAttemptForTest[] = [];
        let currentRank = 0;
        let lastScore = -1;
        let lastTime = -1;
        let tiedCount = 1;

        fetchedAttempts.forEach((attempt) => {
          const score = attempt.scorePercentage ?? 0;
          const timeTakenMs = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime());
          const timeTakenSeconds = isNaN(timeTakenMs) ? Infinity : timeTakenMs / 1000;


          if (score !== lastScore || (score === lastScore && timeTakenSeconds !== lastTime) ) {
            currentRank += tiedCount;
            tiedCount = 1;
            lastScore = score;
            lastTime = timeTakenSeconds;
          } else {
            tiedCount++;
          }
          
          let badge;
          if (currentRank === 1) badge = { name: 'Gold', color: 'text-yellow-500', icon: Award };
          else if (currentRank === 2) badge = { name: 'Silver', color: 'text-gray-400', icon: Award };
          else if (currentRank === 3) badge = { name: 'Bronze', color: 'text-orange-400', icon: Award };

          const correctAnswersCount = attempt.answers.filter(a => a.isCorrect).length;
          
          rankedAttempts.push({ 
            ...attempt, 
            rank: currentRank, 
            badge,
            correctAnswersCount,
            totalQuestionsInAttempt: attempt.answers.length,
            timeTakenFormatted: formatTime(timeTakenSeconds)
          });
        });
        setAttemptsForTest(rankedAttempts);

      } catch (e: any) {
        console.error(`[SpecificTestAnalyticsPage] Error fetching data for test ${testId}:`, e);
        setError(e.message || "Could not load data for this test.");
        toast({ title: "Error", description: "Failed to load test analytics.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchTestAndAttempts();
  }, [testId, toast, formatTime]);

  const testSummaryStats = useMemo((): TestSpecificSummaryStats | null => {
    if (!testDetails || attemptsForTest.length === 0) return null;

    const totalSubmissions = attemptsForTest.length;
    const totalScoreSum = attemptsForTest.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    const averageScore = totalSubmissions > 0 ? Math.round(totalScoreSum / totalSubmissions) : 0;
    
    const totalTimeSpent = attemptsForTest.reduce((sum, attempt) => {
      const duration = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;
      return sum + (isNaN(duration) ? 0 : duration);
    }, 0);
    const averageTimePerAttemptSeconds = totalSubmissions > 0 ? Math.round(totalTimeSpent / totalSubmissions) : 0;

    const testsPassedCount = attemptsForTest.filter(attempt => (attempt.scorePercentage || 0) >= 50).length;
    const passRate = totalSubmissions > 0 ? Math.round((testsPassedCount / totalSubmissions) * 100) : 0;

    const redFlaggedAttemptsCount = attemptsForTest.filter(attempt => attempt.isSuspicious).length;
    
    const scores = attemptsForTest.map(a => a.scorePercentage || 0);
    const highestScore = Math.max(...scores, 0);
    const lowestScore = Math.min(...scores, 100);


    return { totalSubmissions, averageScore, passRate, averageTimePerAttemptSeconds, redFlaggedAttemptsCount, highestScore, lowestScore };
  }, [testDetails, attemptsForTest]);


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-1/4 mb-2" />
        <Skeleton className="h-10 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[1,2,3,4,5].map(i => <Card key={i} className="h-28"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>)}
        </div>
        <Card><CardHeader><Skeleton className="h-7 w-1/3" /></CardHeader><CardContent><Skeleton className="h-60 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Test Analytics</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/student-analytics"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Overview</Link>
        </Button>
      </div>
    );
  }
  
  if (!testDetails) {
     return (
      <div className="container mx-auto py-8 px-4 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
        <p className="text-muted-foreground">Test details could not be loaded.</p>
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
         <div>
            <h1 className="text-3xl font-bold font-headline">{testDetails.title} - Analytics</h1>
            <p className="text-muted-foreground">Subject: {testDetails.subject} | Duration: {testDetails.duration} mins</p>
        </div>
         <Badge variant={testDetails.published ? "default" : "secondary"} className="text-sm">
            {testDetails.published ? "Published" : "Draft"}
        </Badge>
      </div>

      {testSummaryStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Submissions" value={testSummaryStats.totalSubmissions} icon={FileText} />
          <StatCard title="Average Score" value={`${testSummaryStats.averageScore}%`} icon={Percent} />
          <StatCard title="Pass Rate (≥50%)" value={`${testSummaryStats.passRate}%`} icon={CheckCircle} colorClass="text-green-500" />
          <StatCard title="Avg. Time / Attempt" value={formatTime(testSummaryStats.averageTimePerAttemptSeconds)} icon={Clock} />
          <StatCard title="Flagged Attempts" value={testSummaryStats.redFlaggedAttemptsCount} icon={ShieldAlert} colorClass="text-destructive" />
          <StatCard title="Highest Score" value={`${testSummaryStats.highestScore}%`} icon={Award} colorClass="text-sky-500" />
        </div>
      ) : (
         <p className="text-center text-muted-foreground py-4">No attempts yet to show summary statistics for this test.</p>
      )}

      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <Award className="mr-2 h-6 w-6 text-primary" /> Leaderboard for &quot;{testDetails.title}&quot;
          </CardTitle>
          <CardDescription>Ranking of all students who attempted this test.</CardDescription>
        </CardHeader>
        <CardContent>
          {attemptsForTest.length === 0 ? (
            <div className="text-center py-10">
                <BookOpen className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
              <p className="text-muted-foreground">No one has attempted this test yet.</p>
            </div>
          ) : (
             <ScrollArea className="max-h-[70vh]">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[60px] text-center">Rank</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Score (%)</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Score (Raw)</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Time Taken</TableHead>
                    <TableHead className="text-center">Badge</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {attemptsForTest.map((attempt) => (
                    <TableRow key={attempt.id} className={`${attempt.isSuspicious ? 'bg-destructive/5 hover:bg-destructive/10' : ''}`}>
                        <TableCell className="font-medium text-center">{attempt.rank}</TableCell>
                        <TableCell>
                        <div className="flex items-center">
                            <Link href={`/dashboard/student-analytics/${encodeURIComponent(attempt.studentIdentifier)}`} className="hover:underline text-primary">
                                {attempt.studentIdentifier}
                            </Link>
                            {attempt.isSuspicious && (
                                <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertTriangle className="ml-2 h-4 w-4 text-destructive cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                    <p className="text-xs font-semibold">Suspicious Activity Detected</p>
                                    <p className="text-xs">{attempt.suspiciousReason || "Activity flagged for review."}</p>
                                    </TooltipContent>
                                </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        </TableCell>
                        <TableCell className="text-right">{attempt.scorePercentage}%</TableCell>
                        <TableCell className="text-right hidden md:table-cell">{attempt.score}/{attempt.maxPossiblePoints}</TableCell>
                        <TableCell className="text-center hidden sm:table-cell">{attempt.timeTakenFormatted}</TableCell>
                        <TableCell className="text-center">
                        {attempt.badge && (
                            <span className={`flex items-center justify-center gap-1 ${attempt.badge.color}`}>
                            <attempt.badge.icon className="h-5 w-5" /> 
                            </span>
                        )}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; colorClass?: string }> = ({ title, value, icon, colorClass = "text-primary" }) => {
  const IconComponent = icon;
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
        <IconComponent className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
};

    