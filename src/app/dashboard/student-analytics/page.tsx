
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BarChartBig, AlertTriangle, Info, FileText, BookOpen, Percent, ShieldAlert, Download, Eye, Clock, Target, ListChecks, ArrowRight, Trophy, CalendarRange, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Test, TestAttempt } from "@/lib/types";
import { getTestsByTeacher } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OverallStats {
  totalCreatedTests: number;
  totalSubmissions: number;
  averageClassScore: number;
  uniqueStudentParticipants: number;
  totalRedFlaggedAttempts: number;
  averageTimePerAttemptOverallSeconds: number;
  studentsFailedCount: number; 
  lowPerformersCount: number;  
  overallClassAccuracy: number;
}

interface StudentPerformanceData {
  studentIdentifier: string;
  totalAttempts: number;
  averageScore: number;
  testsPassed: number;
  redFlags: number;
  totalCorrectAnswers: number;
  totalAnsweredQuestions: number;
  averageTimePerAttemptSeconds: number;
}

interface PerTestStats {
  testId: string;
  numberOfAttempts: number;
  averageScore: number;
  redFlaggedAttemptsCount: number;
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


export default function StudentPerformancePage() {
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
        const teacherTestIds = new Set(fetchedTeacherTests.map(t => t.id));
        fetchedAllAttempts.forEach(attempt => {
            if (teacherTestIds.has(attempt.testId) && attempt.isSuspicious) {
                 flagged.push({
                    studentIdentifier: attempt.studentIdentifier,
                    testTitle: attempt.testTitle || fetchedTeacherTests.find(t => t.id === attempt.testId)?.title || "Unknown Test",
                    suspiciousReason: attempt.suspiciousReason,
                    attemptDate: new Date(attempt.submittedAt).toLocaleString()
                });
            }
        });
        setRedFlaggedAttemptDetails(flagged);

      } catch (e: any) {
        console.error("[StudentPerformancePage] Error fetching initial data:", e);
        setError(e.message || "Could not load necessary data.");
        toast({ title: "Error", description: "Failed to load performance data.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [user, isAuthLoading, toast]);

  const studentPerformance = useMemo((): StudentPerformanceData[] => {
    if (!user || teacherTests.length === 0) return [];

    const teacherTestIds = new Set(teacherTests.map(t => t.id));
    const relevantAttempts = allAttempts.filter(attempt => teacherTestIds.has(attempt.testId));

    const studentMap = new Map<string, { 
        totalScorePercentage: number; 
        attemptCount: number; 
        passedCount: number; 
        flagCount: number; 
        totalTimeSpent: number;
        totalCorrect: number;
        totalAnswered: number;
    }>();

    relevantAttempts.forEach(attempt => {
      const studentData = studentMap.get(attempt.studentIdentifier) || { 
        totalScorePercentage: 0, 
        attemptCount: 0, 
        passedCount: 0, 
        flagCount: 0, 
        totalTimeSpent: 0,
        totalCorrect: 0,
        totalAnswered: 0,
      };
      studentData.totalScorePercentage += attempt.scorePercentage || 0;
      studentData.attemptCount++;
      if ((attempt.scorePercentage || 0) >= 50) studentData.passedCount++;
      if (attempt.isSuspicious) studentData.flagCount++;
      
      attempt.answers.forEach(ans => {
        if (ans.answer !== undefined && ans.answer !== null && ans.answer !== '') { 
            studentData.totalAnswered++;
            if (ans.isCorrect) {
                studentData.totalCorrect++;
            }
        }
      });

      const attemptDuration = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;
      studentData.totalTimeSpent += isNaN(attemptDuration) ? 0 : attemptDuration;

      studentMap.set(attempt.studentIdentifier, studentData);
    });

    return Array.from(studentMap.entries()).map(([identifier, data]) => ({
      studentIdentifier: identifier,
      totalAttempts: data.attemptCount,
      averageScore: data.attemptCount > 0 ? Math.round(data.totalScorePercentage / data.attemptCount) : 0,
      testsPassed: data.passedCount,
      redFlags: data.flagCount,
      averageTimePerAttemptSeconds: data.attemptCount > 0 ? Math.round(data.totalTimeSpent / data.attemptCount) : 0,
      totalCorrectAnswers: data.totalCorrect,
      totalAnsweredQuestions: data.totalAnswered,
    })).sort((a, b) => b.averageScore - a.averageScore);
  }, [teacherTests, allAttempts, user]);


  const overallStats = useMemo((): OverallStats => {
    const relevantAttempts = allAttempts.filter(attempt => teacherTests.some(tt => tt.id === attempt.testId));

    const totalCreatedTests = teacherTests.length;
    const totalSubmissions = relevantAttempts.length;
    const uniqueStudentIdentifiers = new Set(relevantAttempts.map(a => a.studentIdentifier));
    const uniqueStudentParticipants = uniqueStudentIdentifiers.size;

    const totalScoreSum = relevantAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    const averageClassScore = totalSubmissions > 0 ? Math.round(totalScoreSum / totalSubmissions) : 0;

    const totalRedFlaggedAttempts = relevantAttempts.filter(a => a.isSuspicious).length;

    const totalTimeForAllAttemptsSeconds = relevantAttempts.reduce((sum, attempt) => {
        const duration = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;
        return sum + (isNaN(duration) ? 0 : duration);
    }, 0);
    const averageTimePerAttemptOverallSeconds = totalSubmissions > 0 ? Math.round(totalTimeForAllAttemptsSeconds / totalSubmissions) : 0;
    
    const studentsFailedCount = studentPerformance.filter(s => s.averageScore < 50).length;
    const lowPerformersCount = studentPerformance.filter(s => s.averageScore < 30).length;

    const totalCorrectAnswersOverall = studentPerformance.reduce((sum, sp) => sum + sp.totalCorrectAnswers, 0);
    const totalAnsweredQuestionsOverall = studentPerformance.reduce((sum, sp) => sum + sp.totalAnsweredQuestions, 0);
    const overallClassAccuracy = totalAnsweredQuestionsOverall > 0 ? Math.round((totalCorrectAnswersOverall / totalAnsweredQuestionsOverall) * 100) : 0;


    return {
      totalCreatedTests,
      totalSubmissions,
      averageClassScore,
      uniqueStudentParticipants,
      totalRedFlaggedAttempts,
      averageTimePerAttemptOverallSeconds,
      studentsFailedCount,
      lowPerformersCount,
      overallClassAccuracy,
    };
  }, [teacherTests, allAttempts, studentPerformance]);

  const topPerformers = useMemo((): TopperStudent[] => {
    if (!user || teacherTests.length === 0 || allAttempts.length === 0) return [];

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (topperTimeFrame === 'weekly') {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else { // monthly
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }
    
    const teacherTestIds = new Set(teacherTests.map(t => t.id));
    
    // Filter attempts for the selected time frame and relevant tests
    const periodAttempts = allAttempts.filter(attempt =>
        teacherTestIds.has(attempt.testId) &&
        isWithinInterval(new Date(attempt.submittedAt), { start: startDate, end: endDate })
    );

    if (periodAttempts.length === 0) return [];

    // Determine toppers for each test within the period
    const testToppersMap = new Map<string, Set<string>>(); // testId -> Set of studentIdentifiers who topped
    teacherTests.forEach(test => {
        const attemptsForThisTestInPeriod = periodAttempts.filter(att => att.testId === test.id);
        if (attemptsForThisTestInPeriod.length > 0) {
            const maxScore = Math.max(...attemptsForThisTestInPeriod.map(att => att.scorePercentage || 0));
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
    });

    // Aggregate stats for students who topped at least one test
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
        if (stats.testsTopped > 0) { // Only include students who topped at least one test
            processedStudents.push({
                studentIdentifier: studentId,
                averageScore: stats.testCount > 0 ? Math.round(stats.totalScore / stats.testCount) : 0,
                testsAttempted: stats.testCount,
                averageTimeSeconds: stats.testCount > 0 ? Math.round(stats.totalTime / stats.testCount) : 0,
                testsToppedCount: stats.testsTopped,
            });
        }
    });
    
    // Sort by number of tests topped, then average score, then average time (lower is better)
    processedStudents.sort((a, b) => {
        if (b.testsToppedCount !== a.testsToppedCount) return b.testsToppedCount - a.testsToppedCount;
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        return (a.averageTimeSeconds || Infinity) - (b.averageTimeSeconds || Infinity);
    });

    // Assign ranks
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

    return rankedStudents.slice(0, 5); // Return top 5

  }, [teacherTests, allAttempts, user, topperTimeFrame]);

  const getStatsForTest = useMemo(() => (testId: string): PerTestStats => {
    const attemptsForTest = allAttempts.filter(attempt => attempt.testId === testId);
    const numberOfAttempts = attemptsForTest.length;
    const averageScore = numberOfAttempts > 0
      ? Math.round(attemptsForTest.reduce((sum, att) => sum + (att.scorePercentage || 0), 0) / numberOfAttempts)
      : 0;
    const redFlaggedAttemptsCount = attemptsForTest.filter(a => a.isSuspicious).length;
    return { testId, numberOfAttempts, averageScore, redFlaggedAttemptsCount };
  }, [allAttempts]);


  if (isLoadingData || isAuthLoading) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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
              <BarChartBig className="mr-3 h-8 w-8 text-primary sm:hidden" /> Student Performance
            </h1>
            <p className="text-muted-foreground">
              Overview of student performance across your tests.
            </p>
          </div>
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Tests Created" value={overallStats.totalCreatedTests} icon={FileText} description="All tests designed by you" animate={true} formatTimeFn={formatTime} />
        <StatCard title="Total Submissions" value={overallStats.totalSubmissions} icon={ListChecks} description="Across all your published tests" animate={true} formatTimeFn={formatTime} />
        <StatCard title="Unique Participants" value={overallStats.uniqueStudentParticipants} icon={Users} description="Students who took your tests" formatTimeFn={formatTime} />
        <StatCard title="Overall Avg. Score" value={`${overallStats.averageClassScore}%`} icon={Percent} description="Avg. score on your tests" animate={true} formatTimeFn={formatTime} />
        <StatCard title="Avg. Time / Attempt" value={formatTime(overallStats.averageTimePerAttemptOverallSeconds)} icon={Clock} description="Avg. duration of attempts" animate={true} formatTimeFn={formatTime} />
        
        <Dialog open={isFlaggedAttemptsModalOpen} onOpenChange={setIsFlaggedAttemptsModalOpen}>
          <DialogTrigger asChild>
             <div className="cursor-pointer">
                <StatCard 
                    title="Flagged Attempts" 
                    value={overallStats.totalRedFlaggedAttempts} 
                    icon={ShieldAlert} 
                    description="Attempts marked for review" 
                    colorClass="text-destructive"
                    onClick={() => setIsFlaggedAttemptsModalOpen(true)}
                    animate={true}
                    formatTimeFn={formatTime}
                />
             </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-destructive"/>Red-Flagged Attempts (All Tests)</DialogTitle>
              <DialogDescription>
                List of all attempts across your tests that were flagged for suspicious activity.
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
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsFlaggedAttemptsModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <StatCard title="Students Below Passing" value={overallStats.studentsFailedCount} icon={Users} colorClass="text-orange-500" description="Avg. score &lt; 50%" animate={true} formatTimeFn={formatTime}/>
        <StatCard title="Needs Attention" value={overallStats.lowPerformersCount} icon={AlertTriangle} colorClass="text-red-600" description="Avg. score &lt; 30%" animate={true} formatTimeFn={formatTime}/>
      </div>

      <Separator className="my-8" />

      {/* Top Performers Section */}
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
                Weekly
              </Button>
              <Button 
                variant={topperTimeFrame === 'monthly' ? 'default' : 'outline'}
                onClick={() => setTopperTimeFrame('monthly')}
                size="sm"
              >
                Monthly
              </Button>
            </div>
          </div>
          <CardDescription>
            Students who achieved Rank #1 in at least one test during the current {topperTimeFrame}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topPerformers.length === 0 ? (
            <div className="text-center py-6">
              <CalendarRange className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
              <p className="text-muted-foreground">No students achieved Rank #1 in any test for the selected period.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((topper, index) => (
                <div key={topper.studentIdentifier} className={`flex items-center justify-between p-3 rounded-md ${index < 3 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50 border'}`}>
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : (index === 1 ? "secondary" : (index === 2 ? "outline" : "secondary"))} className="text-sm w-8 h-8 flex items-center justify-center rounded-full">
                      {topper.rank || index + 1}
                    </Badge>
                    <span className="font-medium text-foreground">{topper.studentIdentifier}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{topper.averageScore}% <span className="text-xs text-muted-foreground">avg. ({topper.testsAttempted} tests)</span></p>
                    <p className="text-xs text-muted-foreground">Topped in: {topper.testsToppedCount} test(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />
      
      <h2 className="text-2xl font-semibold font-headline mb-6">Per-Test Analytics</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teacherTests.map(test => {
            const stats = getStatsForTest(test.id);
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
                        <span className="text-muted-foreground">Attempts:</span>
                        <span className="font-medium">{stats.numberOfAttempts}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg. Score:</span>
                        <span className={`font-medium ${stats.averageScore >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.numberOfAttempts > 0 ? `${stats.averageScore}%` : 'N/A'}
                        </span>
                    </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Flagged Attempts:</span>
                        <span className={`font-medium ${stats.redFlaggedAttemptsCount > 0 ? 'text-destructive' : ''}`}>
                            {stats.redFlaggedAttemptsCount}
                        </span>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/test/${test.id}/leaderboard`}>
                      View Leaderboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
       <Separator className="my-8" />
        <Card className="shadow-lg mt-8">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Overall Student Leaderboard</CardTitle>
                <CardDescription>Aggregated performance of all students across all your tests.</CardDescription>
            </CardHeader>
            <CardContent>
                {studentPerformance.length === 0 ? (
                    <div className="text-center py-10">
                        <Users className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
                        <p className="text-muted-foreground">No student performance data available yet.</p>
                    </div>
                ) : (
                <ScrollArea className="max-h-[70vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px] text-center">Rank</TableHead>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="text-center w-[120px] sm:w-auto">Tests Attempted</TableHead>
                                <TableHead className="text-center w-[180px] sm:w-auto">Avg. Score</TableHead>
                                <TableHead className="text-center hidden md:table-cell w-[140px] sm:w-auto">Avg. Time / Test</TableHead>
                                <TableHead className="text-center w-[100px] sm:w-auto">Flags</TableHead>
                                <TableHead className="text-right w-[100px] sm:w-auto"></TableHead> 
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentPerformance.map((student, index) => (
                                <TableRow key={student.studentIdentifier} className={student.redFlags > 0 ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                                    <TableCell className="font-medium text-center">{index + 1}</TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="font-medium">{student.studentIdentifier}</span>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{student.studentIdentifier}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-center">{student.totalAttempts}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`font-semibold ${student.averageScore >= 70 ? 'text-green-600' : student.averageScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {student.averageScore}%
                                            </span>
                                            <Progress value={student.averageScore} className="w-16 sm:w-20 h-2 mt-1 [&>div]:bg-primary" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center hidden md:table-cell">{formatTime(student.averageTimePerAttemptSeconds)}</TableCell>
                                    <TableCell className="text-center">
                                        {student.redFlags > 0 ? (
                                            <Badge variant="destructive" className="flex items-center justify-center gap-1">
                                                <AlertTriangle className="h-3.5 w-3.5" /> {student.redFlags}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">0</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/dashboard/student-analytics/${encodeURIComponent(student.studentIdentifier)}`}>
                                                View Details <ArrowRight className="ml-1 h-4 w-4" />
                                            </Link>
                                        </Button>
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
  const [animatedValue, setAnimatedValue] = useState<string | number>(animate ? 0 : value);

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
      requestAnimationFrame(step);
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

    