
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BarChartBig, AlertTriangle, Info, TrendingUp, FileText, BookOpen, Award, Percent, UserX, UserMinus, ShieldAlert, Download, Eye, Clock, Target } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Test, TestAttempt } from "@/lib/types";
import { getTestsByTeacher } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StudentPerformanceData {
  studentIdentifier: string;
  testsAttemptedCount: number;
  averageScorePercentage: number;
  totalPointsScored: number;
  totalMaxPointsPossible: number;
  hasSuspiciousAttempt: boolean;
  totalTimeSpentSeconds: number; // New: Sum of durations of all attempts by this student
  averageTimePerAttemptSeconds: number; // New: Average time per attempt
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
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformanceData[]>([]);
  const [redFlaggedAttempts, setRedFlaggedAttempts] = useState<RedFlaggedAttemptDetails[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        setTeacherTests(fetchedTeacherTests);
        setAllAttempts(fetchedAllAttempts);

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

  useEffect(() => {
    if (teacherTests.length > 0 && allAttempts.length > 0) {
      const teacherTestIds = new Set(teacherTests.map(t => t.id));
      const relevantAttempts = allAttempts.filter(attempt => 
        teacherTestIds.has(attempt.testId) && attempt.studentIdentifier
      );

      const performanceMap = new Map<string, { 
        totalScorePercentageSum: number; 
        attemptsCount: number; 
        totalPointsScoredSum: number; 
        totalMaxPointsPossibleSum: number; 
        hasSuspicious: boolean;
        totalTimeSpent: number; // in seconds
      }>();
      const flagged: RedFlaggedAttemptDetails[] = [];

      relevantAttempts.forEach(attempt => {
        const studentId = attempt.studentIdentifier;
        const currentData = performanceMap.get(studentId) || { 
          totalScorePercentageSum: 0, 
          attemptsCount: 0, 
          totalPointsScoredSum: 0, 
          totalMaxPointsPossibleSum: 0, 
          hasSuspicious: false,
          totalTimeSpent: 0,
        };
        
        currentData.totalScorePercentageSum += attempt.scorePercentage || 0;
        currentData.attemptsCount += 1;
        currentData.totalPointsScoredSum += attempt.score || 0;
        currentData.totalMaxPointsPossibleSum += attempt.maxPossiblePoints || 0;

        const attemptDuration = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;
        currentData.totalTimeSpent += isNaN(attemptDuration) ? 0 : attemptDuration;

        if (attempt.isSuspicious) {
          currentData.hasSuspicious = true;
          flagged.push({
            studentIdentifier: attempt.studentIdentifier,
            testTitle: attempt.testTitle,
            suspiciousReason: attempt.suspiciousReason,
            attemptDate: new Date(attempt.submittedAt).toLocaleString()
          });
        }
        performanceMap.set(studentId, currentData);
      });
      
      const calculatedPerformance: StudentPerformanceData[] = Array.from(performanceMap.entries()).map(([identifier, data]) => ({
        studentIdentifier: identifier,
        testsAttemptedCount: data.attemptsCount,
        averageScorePercentage: data.attemptsCount > 0 ? Math.round(data.totalScorePercentageSum / data.attemptsCount) : 0,
        totalPointsScored: data.totalPointsScoredSum,
        totalMaxPointsPossible: data.totalMaxPointsPossibleSum,
        hasSuspiciousAttempt: data.hasSuspicious,
        totalTimeSpentSeconds: data.totalTimeSpent,
        averageTimePerAttemptSeconds: data.attemptsCount > 0 ? Math.round(data.totalTimeSpent / data.attemptsCount) : 0,
      }));

      calculatedPerformance.sort((a, b) => b.averageScorePercentage - a.averageScorePercentage || b.totalPointsScored - a.totalPointsScored);
      setStudentPerformance(calculatedPerformance);
      setRedFlaggedAttempts(flagged);
    } else {
      setStudentPerformance([]);
      setRedFlaggedAttempts([]);
    }
  }, [teacherTests, allAttempts]);

  const overallClassStats = useMemo(() => {
    const teacherTestIds = new Set(teacherTests.map(t => t.id));
    const relevantAttempts = allAttempts.filter(attempt => teacherTestIds.has(attempt.testId));
    
    const totalSubmissions = relevantAttempts.length;
    const uniqueStudents = studentPerformance.length;
    
    const totalScoreSum = relevantAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    const averageClassScore = totalSubmissions > 0 ? Math.round(totalScoreSum / totalSubmissions) : 0;

    const totalTimeForAllAttemptsSeconds = relevantAttempts.reduce((sum, attempt) => {
        const duration = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;
        return sum + (isNaN(duration) ? 0 : duration);
    }, 0);
    const averageTimePerAttemptOverallSeconds = totalSubmissions > 0 ? Math.round(totalTimeForAllAttemptsSeconds / totalSubmissions) : 0;
    
    const totalCorrectAnswers = relevantAttempts.reduce((sum, attempt) => sum + attempt.answers.filter(a => a.isCorrect).length, 0);
    const totalAnsweredQuestions = relevantAttempts.reduce((sum, attempt) => sum + attempt.answers.length, 0);
    const overallClassAccuracy = totalAnsweredQuestions > 0 ? Math.round((totalCorrectAnswers / totalAnsweredQuestions) * 100) : 0;


    const redFlaggedAttemptsCount = relevantAttempts.filter(a => a.isSuspicious).length;
    const studentsFailedCount = studentPerformance.filter(s => s.averageScorePercentage < 50).length;
    const lowPerformersCount = studentPerformance.filter(s => s.averageScorePercentage < 30).length;

    return { averageClassScore, totalSubmissions, uniqueStudents, redFlaggedAttemptsCount, studentsFailedCount, lowPerformersCount, averageTimePerAttemptOverallSeconds, overallClassAccuracy };
  }, [studentPerformance, teacherTests, allAttempts]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Award className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />;
    return null;
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };


  if (isLoadingData || isAuthLoading) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="p-4 h-28"><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-8 w-1/4" /></Card>)}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
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

  const StatCard = ({ title, value, icon, description, colorClass = "text-primary", onClick }: { title: string, value: string | number, icon: React.ElementType, description?: string, colorClass?: string, onClick?: () => void }) => {
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
              Track your students' progress across all your tests.
            </p>
          </div>
        </div>
         <Button variant="outline" onClick={() => toast({ title: "Export Feature", description: "Data export functionality is planned for a future update!"})}>
            <Download className="mr-2 h-4 w-4" /> Export Data (Coming Soon)
          </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Submissions" value={overallClassStats.totalSubmissions} icon={FileText} description="Across all your active tests" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div> 
                <StatCard title="Unique Student Participants" value={overallClassStats.uniqueStudents} icon={Users} description="Distinct students taking your tests" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of distinct students who have attempted one or more of your tests.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <StatCard title="Avg. Class Score" value={`${overallClassStats.averageClassScore}%`} icon={Percent} description="Average across all attempts" />
        <StatCard title="Avg. Time / Attempt" value={formatTime(overallClassStats.averageTimePerAttemptOverallSeconds)} icon={Clock} description="Average duration of test attempts" />
        <StatCard title="Overall Class Accuracy" value={`${overallClassStats.overallClassAccuracy}%`} icon={Target} description="Total correct answers / Total answered" />
        
        <Dialog>
          <DialogTrigger asChild>
            <div> 
              <StatCard 
                title="Flagged Attempts" 
                value={overallClassStats.redFlaggedAttemptsCount} 
                icon={ShieldAlert} 
                description="Attempts marked for review" 
                colorClass="text-destructive" 
              />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-destructive"/>Red-Flagged Attempts</DialogTitle>
              <DialogDescription>
                List of attempts flagged for suspicious activity. Review these attempts carefully.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2">
            {redFlaggedAttempts.length > 0 ? (
              <div className="space-y-3 py-2">
                {redFlaggedAttempts.map((attempt, idx) => (
                  <div key={idx} className="p-3 border rounded-md bg-muted/50">
                    <p className="font-semibold">{attempt.studentIdentifier}</p>
                    <p className="text-sm text-muted-foreground">Test: {attempt.testTitle}</p>
                    <p className="text-sm text-muted-foreground">Date: {attempt.attemptDate}</p>
                    <p className="text-xs text-destructive mt-1">Reason: {attempt.suspiciousReason || "No specific reason provided."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No attempts have been flagged as suspicious.</p>
            )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>


      {teacherTests.length === 0 ? (
         <Card className="text-center py-12 shadow-md mt-8">
          <CardContent className="flex flex-col items-center gap-3">
            <ClipboardList className="w-12 h-12 text-muted-foreground/70" />
            <p className="text-muted-foreground">You haven't created any tests yet.</p>
          </CardContent>
        </Card>
      ) : studentPerformance.length === 0 ? (
        <Card className="text-center py-12 shadow-md mt-8">
          <CardContent className="flex flex-col items-center gap-3">
             <Info className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">No students have attempted your tests yet.</p>
            <p className="text-sm text-muted-foreground">Share your tests to see performance data here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Overall Student Leaderboard</CardTitle>
            <CardDescription>Performance of students across all tests you've created, ranked by average score.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] text-center">Rank</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Tests Attempted</TableHead>
                    <TableHead className="text-center">Total Score (Points)</TableHead>
                    <TableHead className="text-center">Avg. Time / Test</TableHead>
                    <TableHead className="text-right w-[180px] sm:w-auto">Average Score</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentPerformance.map((student, index) => (
                    <TableRow key={student.studentIdentifier} className={`hover:bg-muted/50 ${student.hasSuspiciousAttempt ? 'bg-red-500/5 dark:bg-red-900/20 hover:bg-red-500/10' : ''}`}>
                      <TableCell className="font-medium text-center">
                        <div className="flex items-center justify-center">
                            {getRankBadge(index + 1)}
                            <span className="ml-1">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {student.studentIdentifier}
                          {student.hasSuspiciousAttempt && 
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ShieldAlert className="ml-2 h-4 w-4 text-destructive cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This student has one or more suspicious attempts.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{student.testsAttemptedCount}</TableCell>
                      <TableCell className="text-center">{student.totalPointsScored} / {student.totalMaxPointsPossible}</TableCell>
                      <TableCell className="text-center">{formatTime(student.averageTimePerAttemptSeconds)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{student.averageScorePercentage}%</span>
                          <Progress value={student.averageScorePercentage} className="w-16 sm:w-20 h-2 [&>div]:bg-primary" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/student-analytics/${encodeURIComponent(student.studentIdentifier)}`}>
                            <Eye className="mr-1 h-4 w-4" /> Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
