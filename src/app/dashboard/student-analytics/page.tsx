
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BarChartBig, AlertTriangle, Info, TrendingUp, FileText, BookOpen, Award, Percent, Download, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Test, TestAttempt } from "@/lib/types";
import { getTestsByTeacher } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress"; 

interface StudentPerformanceData {
  studentIdentifier: string;
  testsAttemptedCount: number;
  averageScorePercentage: number;
  totalPointsScored: number;
  totalMaxPointsPossible: number;
}

export default function StudentPerformancePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [teacherTests, setTeacherTests] = useState<Test[]>([]);
  const [allAttempts, setAllAttempts] = useState<TestAttempt[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformanceData[]>([]);
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

      const performanceMap = new Map<string, { totalScorePercentageSum: number, attemptsCount: number, totalPointsScoredSum: number, totalMaxPointsPossibleSum: number }>();

      relevantAttempts.forEach(attempt => {
        const studentId = attempt.studentIdentifier;
        const currentData = performanceMap.get(studentId) || { totalScorePercentageSum: 0, attemptsCount: 0, totalPointsScoredSum: 0, totalMaxPointsPossibleSum: 0 };
        
        currentData.totalScorePercentageSum += attempt.scorePercentage || 0;
        currentData.attemptsCount += 1;
        currentData.totalPointsScoredSum += attempt.score || 0;
        currentData.totalMaxPointsPossibleSum += attempt.maxPossiblePoints || 0;
        
        performanceMap.set(studentId, currentData);
      });
      
      const calculatedPerformance: StudentPerformanceData[] = Array.from(performanceMap.entries()).map(([identifier, data]) => ({
        studentIdentifier: identifier,
        testsAttemptedCount: data.attemptsCount,
        averageScorePercentage: data.attemptsCount > 0 ? Math.round(data.totalScorePercentageSum / data.attemptsCount) : 0,
        totalPointsScored: data.totalPointsScoredSum,
        totalMaxPointsPossible: data.totalMaxPointsPossibleSum,
      }));

      calculatedPerformance.sort((a, b) => b.averageScorePercentage - a.averageScorePercentage || b.totalPointsScored - a.totalPointsScored);
      setStudentPerformance(calculatedPerformance);
    } else {
      setStudentPerformance([]);
    }
  }, [teacherTests, allAttempts]);

  const overallClassStats = useMemo(() => {
    if (studentPerformance.length === 0) {
      return { averageClassScore: 0, totalSubmissions: 0, uniqueStudents: 0 };
    }
    const totalSubmissions = studentPerformance.reduce((sum, s) => sum + s.testsAttemptedCount, 0);
    const teacherTestIds = new Set(teacherTests.map(t => t.id));
    const relevantAttempts = allAttempts.filter(attempt => teacherTestIds.has(attempt.testId));
    const totalScoreSum = relevantAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    const averageClassScore = relevantAttempts.length > 0 ? Math.round(totalScoreSum / relevantAttempts.length) : 0;

    const uniqueStudents = studentPerformance.length;
    return { averageClassScore, totalSubmissions, uniqueStudents };
  }, [studentPerformance, teacherTests, allAttempts]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Award className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-400" />;
    return null;
  };

  const handleExportData = () => {
    toast({
      title: "Export Data (Coming Soon)",
      description: "This feature will allow exporting student performance data. It's currently under development.",
      duration: 3000,
    });
  };

  if (isLoadingData || isAuthLoading) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => <Card key={i} className="p-4"><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-8 w-1/4" /></Card>)}
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

  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
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
        <Button variant="outline" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" /> Export Data (Coming Soon)
        </Button>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Submissions</CardTitle><FileText className="h-5 w-5 text-primary" /></CardHeader>
          <CardContent><div className="text-3xl font-bold">{overallClassStats.totalSubmissions}</div></CardContent>
        </Card>
        <Card className="bg-card shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Unique Students</CardTitle><Users className="h-5 w-5 text-primary" /></CardHeader>
          <CardContent><div className="text-3xl font-bold">{overallClassStats.uniqueStudents}</div></CardContent>
        </Card>
        <Card className="bg-card shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. Class Score</CardTitle><Percent className="h-5 w-5 text-primary" /></CardHeader>
          <CardContent><div className="text-3xl font-bold">{overallClassStats.averageClassScore}%</div></CardContent>
        </Card>
      </div>


      {teacherTests.length === 0 ? (
         <Card className="text-center py-12 shadow-md">
          <CardContent className="flex flex-col items-center gap-3">
            <BookOpen className="w-12 h-12 text-muted-foreground/70" />
            <p className="text-muted-foreground">You haven't created any tests yet.</p>
          </CardContent>
        </Card>
      ) : studentPerformance.length === 0 ? (
        <Card className="text-center py-12 shadow-md">
          <CardContent className="flex flex-col items-center gap-3">
             <Info className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">No students have attempted your tests yet.</p>
            <p className="text-sm text-muted-foreground">Share your tests to see performance data here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Student Leaderboard</CardTitle>
            <CardDescription>Overall performance of students on tests you've created.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Tests Attempted</TableHead>
                  <TableHead className="text-center">Total Score (Points)</TableHead>
                  <TableHead className="text-center w-[150px]">Average Score</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentPerformance.map((student, index) => (
                  <TableRow key={student.studentIdentifier} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-center flex items-center justify-center">
                        {getRankBadge(index + 1)}
                        <span className="ml-1">{index + 1}</span>
                    </TableCell>
                    <TableCell className="font-medium">{student.studentIdentifier}</TableCell>
                    <TableCell className="text-center">{student.testsAttemptedCount}</TableCell>
                    <TableCell className="text-center">{student.totalPointsScored} / {student.totalMaxPointsPossible}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <span className="mr-2">{student.averageScorePercentage}%</span>
                        <Progress value={student.averageScorePercentage} className="w-20 h-2 [&>div]:bg-primary" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => toast({ title: "Coming Soon!", description: `Detailed view for ${student.studentIdentifier} is under development.`, duration: 2000 })}>
                        <Eye className="h-4 w-4 mr-1" /> Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
