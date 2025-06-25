
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Award, CheckCircle, XCircle, AlertTriangle, BarChart3, Home, Eye, EyeOff } from "lucide-react"; 
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton'; 
import type { Question, MCQQuestion, TrueFalseQuestion, ShortAnswerQuestion, StudentAnswer } from '@/lib/types';
import QuestionDisplay from '@/components/student/question-display';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX = "studentTestResults_";

interface StoredTestResults {
  testId: string;
  testTitle: string;
  totalQuestions: number; 
  correctAnswersCount: number;
  incorrectOrUnansweredCount: number;
  totalPointsScored: number;
  maxPossiblePoints: number;
  scorePercentage: number;
  questions: Question[]; 
  studentRawAnswers: Record<string, any>; 
}

export default function StudentResultsPage() {
  const params = useParams();
  const router = useRouter(); 
  const testId = params.testId as string;
  const [results, setResults] = useState<StoredTestResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

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
        const parsedResults = JSON.parse(storedResultsString) as StoredTestResults;
        console.log("[ResultsPage] Loaded from localStorage:", parsedResults);

        if (
          typeof parsedResults.testTitle === 'string' &&
          typeof parsedResults.totalQuestions === 'number' && 
          typeof parsedResults.correctAnswersCount === 'number' &&
          typeof parsedResults.incorrectOrUnansweredCount === 'number' &&
          typeof parsedResults.scorePercentage === 'number' &&
          typeof parsedResults.totalPointsScored === 'number' &&
          typeof parsedResults.maxPossiblePoints === 'number' &&
          Array.isArray(parsedResults.questions) && 
          parsedResults.questions.length > 0 && 
          typeof parsedResults.studentRawAnswers === 'object' 
        ) {
          setResults(parsedResults);
        } else {
          setError("Test result data is invalid or incomplete. Please try taking the test again.");
          console.warn("[ResultsPage] Invalid results structure in localStorage:", parsedResults);
        }
      } else {
        setError("No results found for this test. You might need to complete the test first.");
      }
    } catch (e) {
      console.error("[ResultsPage] Error reading or parsing results from localStorage:", e);
      setError("Could not load your test results. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  const calculateCorrectness = (question: Question, studentAnswerValue: any): boolean => {
    if (studentAnswerValue === undefined || studentAnswerValue === null) return false;
    if (question.type === 'mcq') {
      return studentAnswerValue === (question as MCQQuestion).correctOptionId;
    } else if (question.type === 'true-false') {
      return studentAnswerValue === (question as TrueFalseQuestion).correctAnswer;
    } else if (question.type === 'short-answer') {
      return String(studentAnswerValue).trim().toLowerCase() === String((question as ShortAnswerQuestion).correctAnswer).trim().toLowerCase();
    }
    return false;
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center">
        <Card className="w-full max-w-xl shadow-xl">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {[1,2,3].map(i => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="h-8 w-1/2 mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 pt-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
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
  
  const displayTotalQuestions = results.questions.length;

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen flex flex-col items-center">
      <Card className="w-full max-w-xl shadow-xl">
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
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <p className="text-2xl font-semibold">{displayTotalQuestions}</p>
              <p className="text-sm text-muted-foreground">Total Questions</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-semibold text-green-600 flex items-center justify-center gap-1">
                <CheckCircle className="h-6 w-6" /> {results.correctAnswersCount}
              </p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-semibold text-red-600 flex items-center justify-center gap-1">
                 <XCircle className="h-6 w-6" /> {results.incorrectOrUnansweredCount}
              </p>
              <p className="text-sm text-muted-foreground">Incorrect/Unanswered</p>
            </div>
          </div>

          <div className="text-center mt-6">
             <Button variant="outline" className="mt-2" onClick={() => setShowReview(!showReview)}>
              {showReview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showReview ? 'Hide Review' : 'Review My Answers'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 pt-6">
           <Button asChild variant="default">
            <Link href={`/test/${testId}/leaderboard`}>
              <BarChart3 className="mr-2 h-4 w-4" /> View Leaderboard
            </Link>
          </Button>
           <Button asChild variant="secondary">
             <Link href="/"> 
               <Home className="mr-2 h-4 w-4" /> Go to Homepage
             </Link>
           </Button>
        </CardFooter>
      </Card>

      {showReview && results && (
        <div className="w-full max-w-3xl mt-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Answers Review</CardTitle>
                    <CardDescription>Review each question, your answer, and the correct answer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {results.questions.map((q, index) => {
                        const studentAnswerValue = results.studentRawAnswers[q.id];
                        const isActuallyCorrect = calculateCorrectness(q, studentAnswerValue);
                        const studentAttemptForDisplay: StudentAnswer = {
                            questionId: q.id,
                            answer: studentAnswerValue,
                            isCorrect: isActuallyCorrect,
                            pointsScored: isActuallyCorrect ? q.points : 0
                        };
                        
                        let correctAnswerText = "N/A";
                        if (q.type === 'mcq') {
                            const mcq = q as MCQQuestion;
                            // Robust check for correct answer text
                            let correctOption = mcq.options.find(opt => opt.id === mcq.correctOptionId);
                            if (!correctOption && mcq.correctAnswer) {
                                correctOption = mcq.options.find(opt => opt.text === mcq.correctAnswer);
                            }
                            correctAnswerText = correctOption ? correctOption.text : mcq.correctAnswer || "Not specified";
                        } else if (q.type === 'short-answer') {
                            correctAnswerText = (q as ShortAnswerQuestion).correctAnswer;
                        } else if (q.type === 'true-false') {
                            correctAnswerText = (q as TrueFalseQuestion).correctAnswer ? "True" : "False";
                        }


                        return (
                            <React.Fragment key={q.id}>
                                <QuestionDisplay
                                    question={q}
                                    questionNumber={index + 1}
                                    totalQuestions={results.questions.length}
                                    currentAnswer={studentAnswerValue} 
                                    onAnswerChange={() => {}} 
                                    isReviewMode={true}
                                    studentAttempt={studentAttemptForDisplay}
                                    isCorrect={isActuallyCorrect}
                                    correctAnswerForReview={correctAnswerText}
                                />
                                {index < results.questions.length - 1 && <Separator className="my-6" />}
                            </React.Fragment>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
