
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BarChartBig, AlertTriangle, Info, FileText, BookOpen, Percent, ShieldAlert, Download, Eye, Clock, Target, ListChecks, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Test, TestAttempt } from "@/lib/types";
import { getTestsByTeacher } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface OverallStats {
  totalCreatedTests: number;
  totalSubmissions: number;
  averageClassScore: number;
  uniqueStudentParticipants: number;
  totalRedFlaggedAttempts: number;
  averageTimePerAttemptOverallSeconds: number;
}

interface PerTestStats {
  numberOfAttempts: number;
  averageScore: number;
  redFlaggedAttemptsCount: number;
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


  const overallStats = useMemo((): OverallStats => {
    const teacherTestIds = new Set(teacherTests.map(t => t.id));
    const relevantAttempts = allAttempts.filter(attempt => teacherTestIds.has(attempt.testId));
    
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

    return { 
      totalCreatedTests,
      totalSubmissions, 
      averageClassScore, 
      uniqueStudentParticipants,
      totalRedFlaggedAttempts,
      averageTimePerAttemptOverallSeconds
    };
  }, [teacherTests, allAttempts]);

  const getStatsForTest = (testId: string): PerTestStats => {
    const attemptsForThisTest = allAttempts.filter(attempt => attempt.testId === testId);
    const numberOfAttempts = attemptsForThisTest.length;
    const averageScore = numberOfAttempts > 0 
      ? Math.round(attemptsForThisTest.reduce((sum, att) => sum + (att.scorePercentage || 0), 0) / numberOfAttempts)
      : 0;
    const redFlaggedAttemptsCount = attemptsForThisTest.filter(a => a.isSuspicious).length;
    return { numberOfAttempts, averageScore, redFlaggedAttemptsCount };
  };
  
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
  };


  if (isLoadingData || isAuthLoading) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => <Card key={i} className="p-4 h-32"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-full mt-2" /></Card>)}
        </div>
        <Separator className="my-8" />
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => (
            <Card key={i}><CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-5 w-2/3" /></CardContent><CardFooter><Skeleton className="h-9 w-28" /></CardFooter></Card>
          ))}
        </div>
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
      <div className="container mx-auto py-8 text-center">
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
        <Button variant="outline" onClick={() => toast({ title: "Export Feature", description: "Data export functionality is planned for a future update!"})}>
            <Download className="mr-2 h-4 w-4" /> Export Data
        </Button>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Tests Created" value={overallStats.totalCreatedTests} icon={FileText} description="All tests designed by you" />
        <StatCard title="Total Submissions" value={overallStats.totalSubmissions} icon={ListChecks} description="Across all your published tests" />
        <StatCard title="Unique Participants" value={overallStats.uniqueStudentParticipants} icon={Users} description="Students who took your tests" />
        <StatCard title="Overall Avg. Score" value={`${overallStats.averageClassScore}%`} icon={Percent} description="Average score across all attempts" />
        <StatCard title="Overall Avg. Time / Attempt" value={formatTime(overallStats.averageTimePerAttemptOverallSeconds)} icon={Clock} description="Average duration of all attempts" />
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
      </div>

      <Separator className="my-8" />
      
      <h2 className="text-2xl font-semibold font-headline mb-6">Per-Test Performance</h2>

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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, colorClass = "text-primary", onClick }) => {
  const IconComponent = icon;
  return (
    <Card className={`bg-card shadow-md hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
        <IconComponent className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
};

interface RedFlaggedAttemptDetails {
  studentIdentifier: string;
  testTitle: string;
  suspiciousReason?: string;
  attemptDate: string;
}
