
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BarChartBig, AlertTriangle, Info, TrendingUp, FileText, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Test, TestAttempt } from "@/lib/types";
import { getTestsByTeacher } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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

      const performanceMap = new Map<string, { totalScore: number, attemptsCount: number, totalMaxPoints: number }>();

      relevantAttempts.forEach(attempt => {
        const studentId = attempt.studentIdentifier;
        const currentData = performanceMap.get(studentId) || { totalScore: 0, attemptsCount: 0, totalMaxPoints: 0 };
        currentData.totalScore += attempt.scorePercentage || 0;
        currentData.attemptsCount += 1;
        currentData.totalMaxPoints += attempt.maxPossiblePoints || 0; // Assuming maxPossiblePoints is part of attempt
        performanceMap.set(studentId, currentData);
      });
      
      const calculatedPerformance: StudentPerformanceData[] = Array.from(performanceMap.entries()).map(([identifier, data]) => ({
        studentIdentifier: identifier,
        testsAttemptedCount: data.attemptsCount,
        averageScorePercentage: data.attemptsCount > 0 ? Math.round(data.totalScore / data.attemptsCount) : 0,
        totalPointsScored: relevantAttempts.filter(a => a.studentIdentifier === identifier).reduce((sum,a) => sum + (a.score || 0),0), // Recalculate raw points for accuracy
        totalMaxPointsPossible: data.totalMaxPoints,
      }));

      calculatedPerformance.sort((a, b) => b.averageScorePercentage - a.averageScorePercentage);
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
    const totalScoreSum = studentPerformance.reduce((sum, s) => sum + (s.averageScorePercentage * s.testsAttemptedCount), 0); // Weighted average
    const averageClassScore = totalSubmissions > 0 ? Math.round(totalScoreSum / totalSubmissions) : 0;
    const uniqueStudents = studentPerformance.length;
    return { averageClassScore, totalSubmissions, uniqueStudents };
  }, [studentPerformance]);

  if (isLoadingData || isAuthLoading) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
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
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Submissions</CardTitle><FileText className="h-4 w-4 text-sky-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{overallClassStats.totalSubmissions}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Unique Students</CardTitle><Users className="h-4 w-4 text-sky-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{overallClassStats.uniqueStudents}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Average Class Score</CardTitle><TrendingUp className="h-4 w-4 text-sky-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{overallClassStats.averageClassScore}%</div></CardContent>
        </Card>
      </div>


      {teacherTests.length === 0 ? (
         <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center gap-3">
            <BookOpen className="w-12 h-12 text-muted-foreground/70" />
            <p className="text-muted-foreground">You haven't created any tests yet.</p>
            <Button asChild variant="default"><Link href="/dashboard/create-test">Create a Test</Link></Button>
          </CardContent>
        </Card>
      ) : studentPerformance.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center gap-3">
             <Info className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">No students have attempted your tests yet.</p>
            <p className="text-sm text-muted-foreground">Share your tests to see performance data here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Student Leaderboard</CardTitle>
            <CardDescription>Overall performance of students on your tests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Tests Attempted</TableHead>
                  <TableHead className="text-right">Average Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentPerformance.map((student, index) => (
                  <TableRow key={student.studentIdentifier}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{student.studentIdentifier}</TableCell>
                    <TableCell className="text-center">{student.testsAttemptedCount}</TableCell>
                    <TableCell className="text-right">{student.averageScorePercentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Card className="mt-8 text-center py-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center justify-center">
            <Info className="mr-2 h-6 w-6 text-primary" /> Advanced Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground">
            Looking for more detailed insights, trends, and data export?
          </p>
          <p className="text-muted-foreground">
            Our **Teacher Premium** plan offers advanced analytics to help you dive deeper into student performance.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/plans">View Premium Features</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    