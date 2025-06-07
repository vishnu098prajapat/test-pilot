
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Test, Question, StudentAnswer, TestAttempt } from '@/lib/types';
import QuestionDisplay from './question-display';
import Timer from './timer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeStudentBehavior, AnalyzeStudentBehaviorInput } from '@/ai/flows/analyze-student-behavior';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

interface StudentTestAreaProps {
  testData: Test;
  studentIdentifier: string; // Student's name or ID
}

const STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX = "studentTestResults_";

export default function StudentTestArea({ testData, studentIdentifier }: StudentTestAreaProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({}); 
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const startTimeRef = useRef<Date>(new Date());

  const logActivity = useCallback((action: string) => {
    const timestamp = new Date().toISOString();
    setActivityLog(prevLog => [...prevLog, `[${timestamp}] ${action}`]);
  }, []);

  useEffect(() => {
    if (!testData.enableTabSwitchDetection && !testData.enableCopyPasteDisable && !testData.enforceFullScreen) return;

    const handleVisibilityChange = () => {
      if (document.hidden && testData.enableTabSwitchDetection) {
        logActivity("Tab switched / minimized.");
        toast({ title: "Warning", description: "Leaving the test tab has been logged.", variant: "destructive", duration: 2000 });
      }
    };

    const preventDefaultHandler = (e: Event) => e.preventDefault();

    if (testData.enableTabSwitchDetection) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (testData.enableCopyPasteDisable) {
      document.addEventListener('copy', preventDefaultHandler);
      document.addEventListener('paste', preventDefaultHandler);
      document.addEventListener('cut', preventDefaultHandler);
    }
    if (testData.enforceFullScreen) {
      try {
        document.documentElement.requestFullscreen?.().catch(err => logActivity(`Fullscreen request failed: ${err.message}`));
      } catch (e) {
        logActivity(`Fullscreen not supported or error: ${(e as Error).message}`);
      }
    }

    logActivity(`Test started by ${studentIdentifier}. Anti-cheat measures active based on test settings.`);

    return () => {
      if (testData.enableTabSwitchDetection) document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (testData.enableCopyPasteDisable) {
        document.removeEventListener('copy', preventDefaultHandler);
        document.removeEventListener('paste', preventDefaultHandler);
        document.removeEventListener('cut', preventDefaultHandler);
      }
      if (testData.enforceFullScreen && document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    };
  }, [logActivity, testData, toast, studentIdentifier]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    logActivity(`Answer changed for question ID ${questionId}.`);
  };

  const handleSubmitTest = useCallback(async (autoSubmit: boolean = false) => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    logActivity(autoSubmit ? "Test auto-submitted due to time up." : `Test submitted by ${studentIdentifier}.`);
    const endTime = new Date();

    const studentAnswersForStorage: StudentAnswer[] = testData.questions.map(q => {
      const studentAnswerValue = answers[q.id];
      let isQCorrect = false;
      let pointsForQ = 0;

      if (studentAnswerValue !== undefined && studentAnswerValue !== null) {
        if (q.type === 'mcq') {
          if (studentAnswerValue === q.correctOptionId) isQCorrect = true;
        } else if (q.type === 'true-false') {
          if (studentAnswerValue === q.correctAnswer) isQCorrect = true;
        } else if (q.type === 'short-answer') {
          if (String(studentAnswerValue).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) isQCorrect = true;
        }
      }
      if (isQCorrect) {
        pointsForQ = q.points;
      }
      return {
        questionId: q.id,
        answer: studentAnswerValue,
        isCorrect: isQCorrect,
        pointsScored: pointsForQ,
      };
    });

    let correctQuestionsCount = 0;
    let totalPointsAchieved = 0;
    let totalPossiblePoints = 0;

    studentAnswersForStorage.forEach(sa => {
      const question = testData.questions.find(q => q.id === sa.questionId);
      if (question) {
        totalPossiblePoints += question.points;
        if (sa.isCorrect) {
          correctQuestionsCount++;
          totalPointsAchieved += sa.pointsScored || 0;
        }
      }
    });
    
    const scorePercentage = totalPossiblePoints > 0 ? Math.round((totalPointsAchieved / totalPossiblePoints) * 100) : 0;
    const totalQuestionsInTest = testData.questions.length;
    const incorrectOrUnansweredQuestionsCount = totalQuestionsInTest - correctQuestionsCount;

    // For student's immediate results page (localStorage)
    const resultsForStudentPage = {
      testId: testData.id,
      testTitle: testData.title,
      totalQuestions: totalQuestionsInTest,
      correctAnswersCount: correctQuestionsCount,
      incorrectOrUnansweredCount: incorrectOrUnansweredQuestionsCount,
      totalPointsScored: totalPointsAchieved,
      maxPossiblePoints: totalPossiblePoints,
      scorePercentage: scorePercentage,
      // For review feature:
      questions: testData.questions, // Send original questions
      studentRawAnswers: answers, // Send the map of answers {qid: answerValue}
    };

    try {
      localStorage.setItem(`${STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX}${testData.id}`, JSON.stringify(resultsForStudentPage));
    } catch (e) {
      console.error("Failed to save results to localStorage", e);
      toast({ title: "Storage Error", description: "Could not save your test results locally.", variant: "destructive", duration: 2000 });
    }
    
    // For centralized teacher leaderboard (API)
    const attemptDataForApi: Omit<TestAttempt, 'id' | 'submittedAt'> = {
      testId: testData.id,
      testTitle: testData.title,
      studentIdentifier: studentIdentifier,
      startTime: startTimeRef.current.toISOString(),
      endTime: endTime.toISOString(),
      answers: studentAnswersForStorage, // Detailed answers with correctness
      score: totalPointsAchieved,
      maxPossiblePoints: totalPossiblePoints,
      scorePercentage: scorePercentage,
      activityLog: activityLog.join('\n'), // Keep activity log here as well
      isSuspicious: false, // Placeholder, AI proctoring will update this
      suspiciousReason: "", // Placeholder
    };

    // AI Proctoring (can run in parallel or before API submission)
    const proctorInput: AnalyzeStudentBehaviorInput = {
      studentId: studentIdentifier, 
      testId: testData.id,
      activityLog: activityLog.join('\n'),
    };
    
    let proctoringSucceeded = false;
    try {
      const proctoringResult = await analyzeStudentBehavior(proctorInput);
      attemptDataForApi.isSuspicious = proctoringResult.isSuspicious;
      attemptDataForApi.suspiciousReason = proctoringResult.suspiciousReason;
      logActivity(`AI Proctoring result: Suspicious - ${proctoringResult.isSuspicious}, Reason - ${proctoringResult.suspiciousReason}, Severity - ${proctoringResult.severityScore}`);
      proctoringSucceeded = true;
    } catch (proctorError) {
      console.error("AI Proctoring Error:", proctorError);
      logActivity(`AI Proctoring failed: ${(proctorError as Error).message}`);
      toast({ title: "AI Proctoring Issue", description: "Could not analyze behavior, but test will still be submitted.", variant: "destructive", duration: 2000 });
      // Default isSuspicious to false or handle as needed
      attemptDataForApi.isSuspicious = false;
      attemptDataForApi.suspiciousReason = "Proctoring analysis failed.";
    }

    // Submit attempt to central API
    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptDataForApi),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }
      const responseData = await response.json();
      console.log("Attempt submitted to API:", responseData);
      toast({
        title: "Test Submitted!",
        description: `Your test has been successfully ${autoSubmit ? 'auto-' : ''}submitted. ${attemptDataForApi.isSuspicious ? 'Suspicious activity was flagged.' : ''}`,
        duration: proctoringSucceeded ? 2000 : 3000,
      });
      setIsSubmitted(true);
      setTimeout(() => router.push(`/test/${testData.id}/results`), proctoringSucceeded ? 2000 : 3000);

    } catch (error) {
      console.error("Error submitting test attempt to API:", error);
      toast({
        title: "Submission Error",
        description: "There was an error recording your test attempt centrally. Please contact support if this persists.",
        variant: "destructive",
        duration: 3000,
      });
      // Even if API submission fails, redirect to student's local results page
      setIsSubmitted(true); 
      setTimeout(() => router.push(`/test/${testData.id}/results`), 3500); 
    }
    // No finally setIsSubmitting(false) here, because once submitted, it should stay submitted.
  }, [answers, testData, activityLog, toast, isSubmitting, isSubmitted, router, logActivity, studentIdentifier, startTimeRef]);

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-lg w-full">
        <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
        <h2 className="text-3xl font-bold font-headline mb-4">Test Submitted!</h2>
        <p className="text-muted-foreground mb-8">
          Your responses have been recorded. Thank you for taking the test.
          You will be redirected to your results shortly.
        </p>
        <Progress value={100} className="w-full" />
      </div>
    );
  }
  
  const currentQuestion = testData.questions[currentQuestionIndex];
  const totalQuestions = testData.questions.length;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl p-2 md:p-0">
      <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="w-full md:w-1/3 order-2 md:order-1">
           <Timer 
            initialDuration={testData.duration * 60} 
            onTimeUp={() => handleSubmitTest(true)}
            onAlmostTimeUp={() => toast({ title: "Time Warning!", description: "Less than a minute remaining!", variant: "destructive", duration: 2000})}
            warningThreshold={60} // 1 minute
          />
           <Card className="mt-6 shadow-lg">
            <CardHeader><CardTitle className="text-lg font-headline">Navigation</CardTitle></CardHeader>
            <CardContent className="max-h-60 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                {testData.questions.map((q, index) => (
                  <Button
                    key={q.id}
                    variant={index === currentQuestionIndex ? 'default' : (answers[q.id] !== undefined ? 'secondary' : 'outline')}
                    size="sm"
                    className="aspect-square"
                    onClick={() => setCurrentQuestionIndex(index)}
                    disabled={isSubmitting || isSubmitted}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3 order-1 md:order-2">
           <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
            currentAnswer={answers[currentQuestion.id]}
            onAnswerChange={handleAnswerChange}
            isReviewMode={false} 
          />
        </div>
      </div>

      <div className="mt-8 w-full flex justify-between items-center border-t pt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0 || isSubmitting || isSubmitted}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
        {currentQuestionIndex === totalQuestions - 1 ? (
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" disabled={isSubmitting || isSubmitted} className="bg-green-600 hover:bg-green-700 text-white">
                <Send className="mr-2 h-4 w-4" /> Submit Test
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to submit your test? You cannot make changes after submission.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleSubmitTest(false)} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Yes, Submit"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            variant="default"
            onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
            disabled={isSubmitting || isSubmitted}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
