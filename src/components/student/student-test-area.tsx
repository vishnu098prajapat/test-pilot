
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Test, Question, StudentAnswer } from '@/lib/types';
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
}

const STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX = "studentTestResults_";

export default function StudentTestArea({ testData }: StudentTestAreaProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({}); // Store answers by questionId
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

    logActivity("Test started. Anti-cheat measures active based on test settings.");

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
  }, [logActivity, testData, toast]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    logActivity(`Answer changed for question ID ${questionId}.`);
  };

  const handleSubmitTest = useCallback(async (autoSubmit: boolean = false) => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    logActivity(autoSubmit ? "Test auto-submitted due to time up." : "Test submitted by student.");

    // Calculate results
    const studentAnswersForStorage: StudentAnswer[] = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    let correctQuestionsCount = 0;
    let totalPointsAchieved = 0;
    let totalPossiblePoints = 0;

    testData.questions.forEach(q => {
      totalPossiblePoints += q.points;
      const studentAnswerForQuestion = studentAnswersForStorage.find(sa => sa.questionId === q.id);
      const studentAnswerValue = studentAnswerForQuestion ? studentAnswerForQuestion.answer : undefined;
      let isQCorrect = false;

      if (studentAnswerValue !== undefined && studentAnswerValue !== null) { // Check for actual answers
        if (q.type === 'mcq') {
          if (studentAnswerValue === q.correctOptionId) isQCorrect = true;
        } else if (q.type === 'true-false') {
          if (studentAnswerValue === q.correctAnswer) isQCorrect = true; // answers[q.id] is already boolean
        } else if (q.type === 'short-answer') {
          if (String(studentAnswerValue).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) isQCorrect = true;
        }
      }

      if (isQCorrect) {
        correctQuestionsCount++;
        totalPointsAchieved += q.points;
      }
    });

    const scorePercentage = totalPossiblePoints > 0 ? (totalPointsAchieved / totalPossiblePoints) * 100 : 0;
    const totalQuestionsInTest = testData.questions.length;
    const incorrectOrUnansweredQuestionsCount = totalQuestionsInTest - correctQuestionsCount;

    const resultsToStore = {
      testId: testData.id,
      testTitle: testData.title,
      totalQuestions: totalQuestionsInTest,
      correctAnswersCount: correctQuestionsCount,
      incorrectOrUnansweredCount: incorrectOrUnansweredQuestionsCount,
      totalPointsScored: totalPointsAchieved,
      maxPossiblePoints: totalPossiblePoints,
      scorePercentage: Math.round(scorePercentage),
      // studentAnswers: studentAnswersForStorage, // Can be added later for detailed review
    };

    try {
      localStorage.setItem(`${STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX}${testData.id}`, JSON.stringify(resultsToStore));
    } catch (e) {
      console.error("Failed to save results to localStorage", e);
      toast({ title: "Storage Error", description: "Could not save your test results locally.", variant: "destructive", duration: 2000 });
      // Continue with submission even if localStorage fails for now
    }
    
    // AI Proctoring
    const proctorInput: AnalyzeStudentBehaviorInput = {
      studentId: `student-${Date.now()}`, 
      testId: testData.id,
      activityLog: activityLog.join('\n'),
    };

    try {
      const proctoringResult = await analyzeStudentBehavior(proctorInput);
      logActivity(`AI Proctoring result: Suspicious - ${proctoringResult.isSuspicious}, Reason - ${proctoringResult.suspiciousReason}, Severity - ${proctoringResult.severityScore}`);
      
      console.log("Test Submitted:", {
        testId: testData.id,
        calculatedResults: resultsToStore,
        activityLog: proctorInput.activityLog, 
        proctoringResult,
        startTime: startTimeRef.current,
        endTime: new Date(),
      });

      toast({
        title: "Test Submitted!",
        description: `Your test has been successfully ${autoSubmit ? 'auto-' : ''}submitted. ${proctoringResult.isSuspicious ? 'Suspicious activity was flagged.' : ''}`,
        duration: 2000,
      });
      setIsSubmitted(true);
      setTimeout(() => router.push(`/test/${testData.id}/results`), 2000);

    } catch (error) {
      console.error("Error submitting test or with AI proctoring:", error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your test or with proctoring. Please contact support.",
        variant: "destructive",
        duration: 2000,
      });
      // Even if AI proctoring fails, try to redirect to results if local storage save was attempted
      setIsSubmitted(true); // Mark as submitted to prevent re-submission
      setTimeout(() => router.push(`/test/${testData.id}/results`), 3000); // Redirect after a delay
    } finally {
      setIsSubmitting(false); // Only set to false if submission truly failed and needs retry
                               // For now, once submitted (or attempted), we move to results.
    }
  }, [answers, testData, activityLog, toast, isSubmitting, isSubmitted, router, logActivity]);

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
            warningThreshold={60}
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
            isReviewMode={isSubmitted} // Disable inputs if submitted
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
