
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter // Ensuring CardFooter is definitely here
} from "@/components/ui/card";
import { Award, CheckCircle, XCircle } from "lucide-react";
import Link from 'next/link';

// This is a placeholder. In a real app, you'd fetch student's specific attempt data.
// For now, we'll just acknowledge the test ID.

export default function StudentResultsPage() {
  const params = useParams();
  const testId = params.testId as string;

  // Mock data for demonstration - replace with actual data fetching
  const mockResults = {
    score: 85, // Percentage
    totalQuestions: 10,
    correctAnswers: 8,
    wrongAnswers: 1,
    unanswered: 1,
    testTitle: "Sample Test Title", // Fetch this from testData if available
  };


  return (
    <div className="container mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <Award className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold font-headline">Test Results</CardTitle>
          <CardDescription>Your performance for: {mockResults.testTitle} (ID: {testId})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Your Score</p>
            <p className="text-6xl font-bold text-primary">{mockResults.score}%</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">{mockResults.totalQuestions}</p>
              <p className="text-sm text-muted-foreground">Total Questions</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-green-600 flex items-center justify-center gap-1">
                <CheckCircle className="h-6 w-6" /> {mockResults.correctAnswers}
              </p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-600 flex items-center justify-center gap-1">
                 <XCircle className="h-6 w-6" /> {mockResults.wrongAnswers + mockResults.unanswered}
              </p>
              <p className="text-sm text-muted-foreground">Incorrect/Unanswered</p>
            </div>
          </div>

          {/* Placeholder for question-wise breakdown */}
          <div className="text-center mt-6">
             <p className="text-muted-foreground">Detailed question review feature is coming soon!</p>
             <Button variant="outline" className="mt-2" disabled>
              Review Answers (Coming Soon)
            </Button>
          </div>

        </CardContent>
        <CardFooter className="flex justify-center">
           <Button asChild>
            <Link href="/dashboard">Back to Dashboard (if teacher)</Link>
          </Button>
          {/* Or a link to student's own dashboard if they have one */}
          {/* <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button> */}
        </CardFooter>
      </Card>
    </div>
  );
}
