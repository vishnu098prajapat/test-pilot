
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Test, Question, StudentAnswer } from '@/lib/types';
import QuestionDisplay from './question-display';
import Timer from './timer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
import { useRouter } from 'next/navigation'; // For redirecting after submission

interface StudentTestAreaProps {
  testData: Test;
}

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

  // Anti-cheat basic listeners
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
        // This is a request, user can deny.
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

    const proctorInput: AnalyzeStudentBehaviorInput = {
      studentId: `student-${Date.now()}`, // Using a mock student ID
      testId: testData.id,
      activityLog: activityLog.join('\n'),
    };

    try {
      const proctoringResult = await analyzeStudentBehavior(proctorInput);
      logActivity(`AI Proctoring result: Suspicious - ${proctoringResult.isSuspicious}, Reason - ${proctoringResult.suspiciousReason}, Severity - ${proctoringResult.severityScore}`);
      
      console.log("Test Submitted:", {
        testId: testData.id,
        answers,
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
      setTimeout(() => router.push(`/test/${testData.id}/results`), 2000); // Redirect after 2 seconds to allow toast viewing


    } catch (error) {
      console.error("Error submitting test or with AI proctoring:", error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your test or with proctoring. Please contact support.",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, testData, activityLog, toast, isSubmitting, isSubmitted, router]);


  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-lg w-full">
        <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
        <h2 className="text-3xl font-bold font-headline mb-4">Test Submitted!</h2>
        <p className="text-muted-foreground mb-8">
          Your responses have been recorded. Thank you for taking the test.
          You will be redirected shortly.
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
            warningThreshold={60} // 1 minute warning
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
          />
        </div>
      </div>

      <div className="mt-8 w-full flex justify-between items-center border-t pt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0 || isSubmitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
        {currentQuestionIndex === totalQuestions - 1 ? (
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
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
            disabled={isSubmitting}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

