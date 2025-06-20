
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BarChartBig, AlertTriangle, Info, FileText, BookOpen, Percent, ShieldAlert, Download, Eye, Clock, Target, ListChecks, ArrowRight, Trophy, CalendarRange, ClipboardList, Activity } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Test, TestAttempt } from "@/lib/types";
import { getTestsByTeacher } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Added DialogFooter
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

interface OverallMonthlyStats {
  totalCreatedTests: number; // This is lifetime
  totalMonthlySubmissions: number;
  averageMonthlyScore: number;
  uniqueMonthlyParticipants: number;
  totalMonthlyRedFlaggedAttempts: number;
  averageMonthlyTimePerAttemptSeconds: number;
  monthlyStudentsFailedCount: number;
  monthlyLowPerformersCount: number;
}

interface TopperStudent {
  studentIdentifier: string;
  averageScore: number;
  testsAttempted: number;
  averageTimeSeconds?: number;
  rank?: number;
  testsToppedCount: number;
}

interface RedFlaggedAttemptDetails {
  studentIdentifier: string;
  testTitle: string;
  suspiciousReason?: string;
  attemptDate: string;
}

interface TestSpecificLifetimeStats {
  submissions: number;
  averageScore: number;
  flaggedAttempts: number;
}

export default function StudentPerformanceOverviewPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [teacherTests, setTeacherTests] = useState<Test[]>([]);
  const [allAttempts, setAllAttempts] = useState<TestAttempt[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFlaggedAttemptsModalOpen, setIsFlaggedAttemptsModalOpen] = useState(false);
  const [redFlaggedAttemptDetails, setRedFlaggedAttemptDetails] = useState<RedFlaggedAttemptDetails[]>([]);
  const [topperTimeFrame, setTopperTimeFrame] = useState<'weekly' | 'monthly'>('weekly');

  const formatTime = useCallback((totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "N/A";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (isAuthLoading) {
        setIsLoadingData(true);
        return;
      }
      if (!user || user.role !== 'teacher') {
        setIsLoadingData(false);
        if (user && user.role !== 'teacher') {
            setError("This page is for teachers only.");
        }
        return;
      }

      setIsLoadingData(true);
      setError(null);
      try {
        const [fetchedTeacherTests, fetchedAllAttempts] = await Promise.all([
          getTestsByTeacher(user.id),
          fetch('/api/attempts').then(res => {
            if (!res.ok) throw new Error('Failed to fetch attempts');
            return res.json();
          })
        ]);

        setTeacherTests(fetchedTeacherTests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setAllAttempts(fetchedAllAttempts);

        const flagged: RedFlaggedAttemptDetails[] = [];
        const teacherTestIdsSet = new Set(fetchedTeacherTests.map(t => t.id));
        fetchedAllAttempts.forEach(attempt => {
            if (teacherTestIdsSet.has(attempt.testId) && attempt.isSuspicious) {
                 flagged.push({
                    studentIdentifier: attempt.studentIdentifier,
                    testTitle: attempt.testTitle || fetchedTeacherTests.find(t => t.id === attempt.testId)?.title || "Unknown Test",
                    suspiciousReason: attempt.suspiciousReason,
                    attemptDate: new Date(attempt.submittedAt).toLocaleString()
                });
            }
        });
        setRedFlaggedAttemptDetails(flagged.sort((a,b) => new Date(b.attemptDate).getTime() - new Date(a.attemptDate).getTime()));

      } catch (e: any) {
        console.error("[StudentPerformanceOverviewPage] Error fetching initial data:", e);
        setError(e.message || "Could not load necessary data.");
        toast({ title: "Error", description: "Failed to load performance data.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [user, isAuthLoading, toast]);
  

  const overallMonthlyStats = useMemo((): OverallMonthlyStats => {
    const teacherTestIds = new Set(teacherTests.map(t => t.id));
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const currentMonthAttempts = allAttempts.filter(attempt => 
      teacherTestIds.has(attempt.testId) &&
      isWithinInterval(new Date(attempt.submittedAt), { start: currentMonthStart, end: currentMonthEnd })
    );

    const totalCreatedTests = teacherTests.length; 
    const totalMonthlySubmissions = currentMonthAttempts.length;
    const uniqueMonthlyStudentIdentifiers = new Set(currentMonthAttempts.map(a => a.studentIdentifier));
    const uniqueMonthlyParticipants = uniqueMonthlyStudentIdentifiers.size;

    const totalMonthlyScoreSum = currentMonthAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    const averageMonthlyScore = totalMonthlySubmissions > 0 ? Math.round(totalMonthlyScoreSum / totalMonthlySubmissions) : 0;

    const totalMonthlyRedFlaggedAttempts = currentMonthAttempts.filter(a => a.isSuspicious).length;

    const totalMonthlyTimeSeconds = currentMonthAttempts.reduce((sum, attempt) => {
        const duration = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;
        return sum + (isNaN(duration) ? 0 : duration);
    }, 0);
    const averageMonthlyTimePerAttemptSeconds = totalMonthlySubmissions > 0 ? Math.round(totalMonthlyTimeSeconds / totalMonthlySubmissions) : 0;
    
    const studentMonthlyAverages = new Map<string, { totalScore: number; count: number }>();
    currentMonthAttempts.forEach(att => {
        const current = studentMonthlyAverages.get(att.studentIdentifier) || { totalScore: 0, count: 0 };
        current.totalScore += (att.scorePercentage || 0);
        current.count++;
        studentMonthlyAverages.set(att.studentIdentifier, current);
    });

    let monthlyStudentsFailedCount = 0;
    let monthlyLowPerformersCount = 0;
    studentMonthlyAverages.forEach(data => {
        const avg = data.count > 0 ? data.totalScore / data.count : 0;
        if (avg < 50) monthlyStudentsFailedCount++;
        if (avg < 30) monthlyLowPerformersCount++;
    });


    return {
      totalCreatedTests,
      totalMonthlySubmissions,
      averageMonthlyScore,
      uniqueMonthlyParticipants,
      totalMonthlyRedFlaggedAttempts,
      averageMonthlyTimePerAttemptSeconds,
      monthlyStudentsFailedCount,
      monthlyLowPerformersCount,
    };
  }, [teacherTests, allAttempts]);

  const testSpecificStatsMap = useMemo(() => {
    const statsMap = new Map<string, TestSpecificLifetimeStats>();
    teacherTests.forEach(test => {
      const attemptsForThisTest = allAttempts.filter(attempt => attempt.testId === test.id);
      const submissions = attemptsForThisTest.length;
      const totalScoreSum = attemptsForThisTest.reduce((sum, att) => sum + (att.scorePercentage || 0), 0);
      const averageScore = submissions > 0 ? Math.round(totalScoreSum / submissions) : 0;
      const flaggedAttempts = attemptsForThisTest.filter(att => att.isSuspicious).length;
      statsMap.set(test.id, { submissions, averageScore, flaggedAttempts });
    });
    return statsMap;
  }, [teacherTests, allAttempts]);

  const topPerformers = useMemo((): TopperStudent[] => {
    if (!user || teacherTests.length === 0 || allAttempts.length === 0) return [];

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (topperTimeFrame === 'weekly') {
        startDate = startOfWeek(now, { weekStartsOn: 1 }); 
        endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else { 
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }
    
    const teacherTestIds = new Set(teacherTests.map(t => t.id));
    
    const periodAttempts = allAttempts.filter(attempt =>
        teacherTestIds.has(attempt.testId) &&
        isWithinInterval(new Date(attempt.submittedAt), { start: startDate, end: endDate })
    );

    if (periodAttempts.length === 0) return [];

    const testToppersMap = new Map<string, Set<string>>(); 
    teacherTests.forEach(test => {
        const attemptsForThisTestInPeriod = periodAttempts.filter(att => att.testId === test.id);
        if (attemptsForThisTestInPeriod.length > 0) {
            const maxScore = Math.max(...attemptsForThisTestInPeriod.map(att => att.scorePercentage || 0));
            if (maxScore > 0) { 
                const toppersForThisTest = new Set<string>();
                attemptsForThisTestInPeriod.forEach(att => {
                    if ((att.scorePercentage || 0) === maxScore) {
                        toppersForThisTest.add(att.studentIdentifier);
                    }
                });
                if (toppersForThisTest.size > 0) {
                    testToppersMap.set(test.id, toppersForThisTest);
                }
            }
        }
    });

    const potentialToppersAggregatedStats = new Map<string, {
        totalScore: number;
        testCount: number;
        totalTime: number;
        testsTopped: number;
    }>();

    periodAttempts.forEach(attempt => {
        let isTopperForThisTest = false;
        if (testToppersMap.has(attempt.testId) && testToppersMap.get(attempt.testId)!.has(attempt.studentIdentifier)) {
            isTopperForThisTest = true;
        }

        const studentId = attempt.studentIdentifier;
        const studentStats = potentialToppersAggregatedStats.get(studentId) || {
            totalScore: 0, testCount: 0, totalTime: 0, testsTopped: 0
        };

        studentStats.totalScore += (attempt.scorePercentage || 0);
        studentStats.testCount++;
        const duration = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;
        studentStats.totalTime += isNaN(duration) ? 0 : duration;
        if (isTopperForThisTest) {
            studentStats.testsTopped++;
        }
        potentialToppersAggregatedStats.set(studentId, studentStats);
    });
    
    const processedStudents: TopperStudent[] = [];
    potentialToppersAggregatedStats.forEach((stats, studentId) => {
        if (stats.testsTopped > 0) { 
            processedStudents.push({
                studentIdentifier: studentId,
                averageScore: stats.testCount > 0 ? Math.round(stats.totalScore / stats.testCount) : 0,
                testsAttempted: stats.testCount,
                averageTimeSeconds: stats.testCount > 0 ? Math.round(stats.totalTime / stats.testCount) : 0,
                testsToppedCount: stats.testsTopped,
            });
        }
    });
    
    processedStudents.sort((a, b) => {
        if (b.testsToppedCount !== a.testsToppedCount) return b.testsToppedCount - a.testsToppedCount; 
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore; 
        return (a.averageTimeSeconds || Infinity) - (b.averageTimeSeconds || Infinity); 
    });

    let rank = 0;
    let lastTestsTopped = -1;
    let lastAvgScore = -1;
    let tiedCount = 1;

    const rankedStudents = processedStudents.map(student => {
        if (student.testsToppedCount !== lastTestsTopped || student.averageScore !== lastAvgScore) {
            rank += tiedCount;
            tiedCount = 1;
            lastTestsTopped = student.testsToppedCount;
            lastAvgScore = student.averageScore;
        } else {
            tiedCount++;
        }
        return { ...student, rank };
    });

    return rankedStudents.slice(0, 5); 

  }, [teacherTests, allAttempts, user, topperTimeFrame]);


  if (isLoadingData || isAuthLoading) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Card key={i} className="p-4 h-36"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-full mt-2" /></Card>)}
        </div>
        <Separator className="my-8" />
        <Skeleton className="h-8 w-1/3 mb-6" />
         <Card><CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader><CardContent><Skeleton className="h-60 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (user && user.role !== 'teacher') {
     return (
      <div className="container mx-auto py-8 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-destructive">Access Denied</h2>
        <p className="text-muted-foreground">This page is for teachers only. Students can view their progress on the &quot;My Personal Progress&quot; page.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/my-progress">View My Progress</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Data</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div className="flex items-center">
          <BarChartBig className="w-10 h-10 text-primary mr-3 hidden sm:block" />
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center">
              <BarChartBig className="mr-3 h-8 w-8 text-primary sm:hidden" /> Student Performance Overview
            </h1>
            <p className="text-muted-foreground">
              Performance metrics for the current month, and lifetime stats per test.
            </p>
          </div>
        </div>
      </div>
      
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap justify-between items-center gap-2">
            <CardTitle className="text-2xl font-headline flex items-center">
              <Trophy className="mr-2 h-6 w-6 text-yellow-500" /> Top Performers
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={topperTimeFrame === 'weekly' ? 'default' : 'outline'}
                onClick={() => setTopperTimeFrame('weekly')}
                size="sm"
              >
                This Week
              </Button>
              <Button 
                variant={topperTimeFrame === 'monthly' ? 'default' : 'outline'}
                onClick={() => setTopperTimeFrame('monthly')}
                size="sm"
              >
                This Month
              </Button>
            </div>
          </div>
          <CardDescription>
            Students who achieved Rank #1 in at least one test during the current {topperTimeFrame}. Ranked by number of tests topped, then average score, then average time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topPerformers.length === 0 ? (
            <div className="text-center py-6">
              <CalendarRange className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
              <p className="text-muted-foreground">No students achieved Rank #1 in any test for the selected period ({topperTimeFrame}).</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((topper, index) => ( // Added index for unique key if needed, though studentIdentifier should be unique
                 <div key={topper.studentIdentifier} className={`flex items-center justify-between p-3 rounded-md ${topper.rank === 1 ? 'bg-yellow-400/10 border-yellow-500' : (topper.rank === 2 ? 'bg-gray-300/20 border-gray-400' : (topper.rank === 3 ? 'bg-orange-400/10 border-orange-500' : 'bg-muted/50 border'))} border`}>
                  <div className="flex items-center gap-3">
                    <Badge variant={topper.rank === 1 ? "default" : (topper.rank === 2 ? "secondary" : (topper.rank === 3 ? "outline" : "secondary"))} className={`text-sm w-8 h-8 flex items-center justify-center rounded-full ${topper.rank === 1 ? 'bg-yellow-500 text-white' : (topper.rank ===2 ? 'bg-gray-400 text-white' : (topper.rank === 3 ? 'bg-orange-500 text-white' : 'bg-slate-500 text-white')) }`}>
                      {topper.rank}
                    </Badge>
                    <Link href={`/dashboard/student-analytics/${encodeURIComponent(topper.studentIdentifier)}`} className="font-medium text-foreground hover:underline">{topper.studentIdentifier}</Link>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{topper.averageScore}% <span className="text-xs text-muted-foreground">avg. ({topper.testsAttempted} tests)</span></p>
                    <p className="text-xs text-muted-foreground">Topped in: {topper.testsToppedCount} test(s)</p>
                     {topper.averageTimeSeconds !== undefined && <p className="text-xs text-muted-foreground">Avg. Time: {formatTime(topper.averageTimeSeconds)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

       <h2 className="text-xl font-semibold font-headline mb-4">This Month&apos;s Summary</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Tests Created" value={overallMonthlyStats.totalCreatedTests} icon={FileText} description="All tests designed by you (lifetime)" formatTimeFn={formatTime} />
        <StatCard title="Monthly Submissions" value={overallMonthlyStats.totalMonthlySubmissions} icon={ListChecks} description="Across all your published tests this month" animate={true} formatTimeFn={formatTime} />
        <StatCard title="Unique Participants (Monthly)" value={overallMonthlyStats.uniqueMonthlyParticipants} icon={Users} description="Students who took your tests this month" formatTimeFn={formatTime} />
        <StatCard title="Monthly Avg. Score" value={`${overallMonthlyStats.averageMonthlyScore}%`} icon={Percent} description="Avg. score on your tests this month" animate={true} formatTimeFn={formatTime} />
        <StatCard title="Avg. Time / Attempt (Monthly)" value={formatTime(overallMonthlyStats.averageMonthlyTimePerAttemptSeconds)} icon={Clock} description="Avg. duration of attempts this month" animate={true} formatTimeFn={formatTime} />
        
        <Dialog open={isFlaggedAttemptsModalOpen} onOpenChange={setIsFlaggedAttemptsModalOpen}>
          <DialogTrigger asChild>
             <div className="cursor-pointer">
                <StatCard 
                    title="Flagged Attempts (Monthly)" 
                    value={overallMonthlyStats.totalMonthlyRedFlaggedAttempts} 
                    icon={ShieldAlert} 
                    description="Attempts marked for review this month" 
                    colorClass="text-destructive"
                    onClick={() => setIsFlaggedAttemptsModalOpen(true)}
                    animate={true}
                    formatTimeFn={formatTime}
                />
             </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-destructive"/>Lifetime Red-Flagged Attempts</DialogTitle>
              <DialogDescription>
                List of all attempts across your tests that were ever flagged for suspicious activity.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2">
            {redFlaggedAttemptDetails.length > 0 ? (
              <div className="space-y-3 py-2">
                {redFlaggedAttemptDetails.map((attempt, idx) => (
                  <div key={idx} className="p-3 border rounded-md bg-muted/50">
                    <p className="font-semibold">{attempt.studentIdentifier}</p>
                    <p className="text-sm text-muted-foreground">Test: {attempt.testTitle}</p>
                    <p className="text-sm text-muted-foreground">Date: {attempt.attemptDate}</p>
                    <p className="text-xs text-destructive mt-1">Reason: {attempt.suspiciousReason || "No specific reason provided."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No attempts have been flagged as suspicious across your tests.</p>
            )}
            </ScrollArea>
            <DialogFooter> {/* Ensure DialogFooter is imported and used */}
                <Button variant="outline" onClick={() => setIsFlaggedAttemptsModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <StatCard title="Students Below Passing (Monthly)" value={overallMonthlyStats.monthlyStudentsFailedCount} icon={Users} colorClass="text-orange-500" description="Avg. score < 50% this month" animate={true} formatTimeFn={formatTime} />
        <StatCard title="Needs Attention (Monthly)" value={overallMonthlyStats.monthlyLowPerformersCount} icon={AlertTriangle} colorClass="text-red-600" description="Avg. score < 30% this month" animate={true} formatTimeFn={formatTime} />
      </div>

      <Separator className="my-8" />
      
      <h2 className="text-2xl font-semibold font-headline mb-6">Select a Test for Detailed Analytics (Lifetime Stats)</h2>
      {teacherTests.length === 0 ? (
         <Card className="text-center py-12 shadow-md">
          <CardContent className="flex flex-col items-center gap-3">
            <ClipboardList className="w-12 h-12 text-muted-foreground/70" />
            <p className="text-muted-foreground">You haven&apos;t created any tests yet.</p>
            <p className="text-sm text-muted-foreground">Create a test to see its performance here.</p>
            <Button asChild className="mt-2">
                <Link href="/dashboard/create-test">Create New Test</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teacherTests.map(test => {
            const stats = testSpecificStatsMap.get(test.id) || { submissions: 0, averageScore: 0, flaggedAttempts: 0 };
            return (
              <Card key={test.id} className="flex flex-col shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-lg">{test.title}</CardTitle>
                     <Badge variant={test.published ? "default" : "secondary"}>
                        {test.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {test.subject} | {test.questions.length} Qs | {test.duration} min
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Submissions (Lifetime):</span>
                        <span className="font-medium">{stats.submissions}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg. Score (Lifetime):</span>
                        <span className="font-medium">{stats.submissions > 0 ? `${stats.averageScore}%` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Flagged (Lifetime):</span>
                        <span className={`font-medium ${stats.flaggedAttempts > 0 ? 'text-destructive' : ''}`}>{stats.flaggedAttempts}</span>
                    </div>
                     <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(test.createdAt).toLocaleDateString()}
                      </p>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full" disabled={!test.published && stats.submissions === 0}>
                    <Link href={`/dashboard/student-analytics/test/${test.id}`}> 
                      View Detailed Analytics <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  colorClass?: string;
  onClick?: () => void;
  animate?: boolean;
  formatTimeFn: (totalSeconds: number) => string; 
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, colorClass = "text-primary", onClick, animate = false, formatTimeFn }) => {
  const IconComponent = icon;
  const [animatedValue, setAnimatedValue] = useState<string | number>(value); 

  const isTimeFormat = typeof value === 'string' && (value.includes('m') || value.includes('s'));

  const timeToSeconds = useCallback((timeStr: string): number => {
    if (!timeStr || (!timeStr.includes('m') && !timeStr.includes('s'))) {
        const parsed = parseFloat(timeStr);
        return isNaN(parsed) ? 0 : parsed;
    }
    const minutesMatch = timeStr.match(/(\d+)m/);
    const secondsMatch = timeStr.match(/(\d+)s/);
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
    return minutes * 60 + seconds;
  }, []);

  const numericValue = useMemo(() => {
    return typeof value === 'string' && !isTimeFormat ? parseFloat(value.toString().replace('%','').replace(/[^\d.-]/g, '')) : (isTimeFormat ? timeToSeconds(String(value)) : Number(value));
  }, [value, isTimeFormat, timeToSeconds]);
  
  const suffix = typeof value === 'string' && value.includes('%') ? '%' : '';

  useEffect(() => {
    if (animate && typeof numericValue === 'number' && !isNaN(numericValue)) {
      let startTimestamp: number | null = null;
      const duration = 1000; 
      setAnimatedValue(isTimeFormat ? formatTimeFn(0) : 0 + suffix); 

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentAnimatedNumber = Math.floor(progress * numericValue);

        if (isTimeFormat) {
            setAnimatedValue(formatTimeFn(currentAnimatedNumber));
        } else {
            setAnimatedValue(currentAnimatedNumber + suffix);
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
           if (isTimeFormat) {
               setAnimatedValue(formatTimeFn(numericValue)); 
           } else {
               setAnimatedValue(numericValue + suffix); 
           }
        }
      };
      const frameId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(frameId);
    } else {
        setAnimatedValue(value); 
    }
  }, [animate, value, numericValue, suffix, isTimeFormat, formatTimeFn]);


  return (
    <Card className={`bg-card shadow-md hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
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

    