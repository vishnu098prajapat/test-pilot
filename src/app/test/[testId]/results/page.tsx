
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Award, CheckCircle, XCircle, AlertTriangle } from "lucide-react"; // Added AlertTriangle
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton

const STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX = "studentTestResults_";

interface DisplayResults {
  testTitle: string;
  totalQuestions: number;
  correctAnswersCount: number;
  incorrectOrUnansweredCount: number;
  scorePercentage: number;
  maxPossiblePoints: number;
  totalPointsScored: number;
}

export default function StudentResultsPage() {
  const params = useParams();
  const router = useRouter(); // For redirecting if no data
  const testId = params.testId as string;
  const [results, setResults] = useState<DisplayResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    if (!testId) {
      setError("Test ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      const storedResultsString = localStorage.getItem(`${STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX}${testId}`);
      if (storedResultsString) {
        const parsedResults = JSON.parse(storedResultsString);
        // Basic validation of parsed results
        if (
          typeof parsedResults.testTitle === 'string' &&
          typeof parsedResults.totalQuestions === 'number' &&
          typeof parsedResults.correctAnswersCount === 'number' &&
          typeof parsedResults.incorrectOrUnansweredCount === 'number' &&
          typeof parsedResults.scorePercentage === 'number'
        ) {
          setResults(parsedResults as DisplayResults);
        } else {
          setError("Test result data is invalid or incomplete. Please try taking the test again.");
          console.warn("Invalid results structure in localStorage:", parsedResults);
        }
      } else {
        setError("No results found for this test. You might need to complete the test first.");
      }
    } catch (e) {
      console.error("Error reading or parsing results from localStorage:", e);
      setError("Could not load your test results. Please try again or contact support.");
    } finally {
      setIsLoading(false);
      // Optional: Clean up localStorage item after reading if desired
      // localStorage.removeItem(`${STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX}${testId}`);
    }
  }, [testId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Skeleton className="h-4 w-1/4 mx-auto mb-1" />
              <Skeleton className="h-16 w-1/3 mx-auto" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[1,2,3].map(i => (
                <div key={i}>
                  <Skeleton className="h-8 w-1/2 mx-auto mb-1" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error || !results) {
    return (
       <div className="container mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Could Not Load Results</h2>
        <p className="text-muted-foreground mb-6">{error || "Results data is unavailable."}</p>
        <Button asChild variant="outline">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <Award className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold font-headline">Test Results</CardTitle>
          <CardDescription>Your performance for: {results.testTitle} (ID: {testId})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Your Score</p>
            <p className="text-6xl font-bold text-primary">{results.scorePercentage}%</p>
            <p className="text-xs text-muted-foreground mt-1">({results.totalPointsScored} / {results.maxPossiblePoints} Points)</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">{results.totalQuestions}</p>
              <p className="text-sm text-muted-foreground">Total Questions</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-green-600 flex items-center justify-center gap-1">
                <CheckCircle className="h-6 w-6" /> {results.correctAnswersCount}
              </p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-600 flex items-center justify-center gap-1">
                 <XCircle className="h-6 w-6" /> {results.incorrectOrUnansweredCount}
              </p>
              <p className="text-sm text-muted-foreground">Incorrect/Unanswered</p>
            </div>
          </div>

          <div className="text-center mt-6">
             <p className="text-muted-foreground">Detailed question review feature is coming soon!</p>
             <Button variant="outline" className="mt-2" disabled>
              Review Answers (Coming Soon)
            </Button>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
           <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
           <Button asChild variant="outline" onClick={() => router.push('/')}>
             <Link href="/">Go to Homepage</Link>
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
