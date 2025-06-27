
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Test, Question, StudentAnswer, TestAttempt, MCQQuestion } from '@/lib/types';
import QuestionDisplay from './question-display';
import Timer from './timer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Send, WifiOff, Languages, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeStudentBehavior, AnalyzeStudentBehaviorInput } from '@/ai/flows/analyze-student-behavior';
import { translateText, TranslateTextInput } from '@/ai/flows/translate-text-flow';
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
import { useOnlineStatus } from '@/hooks/use-online-status';

interface StudentTestAreaProps {
  testData: Test;
  studentIdentifier: string; 
  studentIp: string;
}

const STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX = "studentTestResults_";
const PENDING_SUBMISSIONS_STORAGE_KEY = "test_pilot_pending_submissions";

export default function StudentTestArea({ testData, studentIdentifier, studentIp }: StudentTestAreaProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({}); 
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const startTimeRef = useRef<Date>(new Date());
  const isOnline = useOnlineStatus();
  
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [displayQuestion, setDisplayQuestion] = useState<Question>(testData.questions[0]);
  const translationCache = useRef<Record<string, Question>>({});

  const originalQuestion = useMemo(() => testData.questions[currentQuestionIndex], [testData.questions, currentQuestionIndex]);
  
  useEffect(() => {
    const translateCurrentQuestion = async () => {
      if (language === 'en') {
        setDisplayQuestion(originalQuestion);
        return;
      }

      const cacheKey = `${originalQuestion.id}-${language}`;
      if (translationCache.current[cacheKey]) {
        setDisplayQuestion(translationCache.current[cacheKey]);
        return;
      }
      
      setIsTranslating(true);
      try {
        const textsToTranslate: string[] = [originalQuestion.text];
        if (originalQuestion.type === 'mcq') {
          originalQuestion.options.forEach(opt => textsToTranslate.push(opt.text));
        }

        const input: TranslateTextInput = {
          texts: textsToTranslate,
          targetLanguage: 'Hindi',
        };
        const result = await translateText(input);

        if (result.translations && result.translations.length === textsToTranslate.length) {
          const translatedQuestion: Question = JSON.parse(JSON.stringify(originalQuestion)); // Deep copy
          translatedQuestion.text = result.translations[0];
          if (translatedQuestion.type === 'mcq') {
            translatedQuestion.options.forEach((opt: any, index: number) => {
              opt.text = result.translations[index + 1];
            });
          }
          translationCache.current[cacheKey] = translatedQuestion;
          setDisplayQuestion(translatedQuestion);
        } else {
          toast({ title: "Translation Error", description: "Could not translate the question. Displaying original.", variant: "destructive" });
          setDisplayQuestion(originalQuestion);
        }
      } catch (e) {
        console.error("Translation failed:", e);
        toast({ title: "Translation Error", description: "An error occurred while translating.", variant: "destructive" });
        setDisplayQuestion(originalQuestion);
      } finally {
        setIsTranslating(false);
      }
    };
    
    translateCurrentQuestion();

  }, [currentQuestionIndex, language, originalQuestion, toast]);


  // Effect for syncing pending submissions when online
  useEffect(() => {
    async function syncPendingSubmissions() {
      if (isOnline) {
        try {
          const pending = JSON.parse(localStorage.getItem(PENDING_SUBMISSIONS_STORAGE_KEY) || '[]');
          if (pending.length > 0) {
            console.log(`[Sync] Found ${pending.length} pending submission(s). Attempting to sync.`);
            const successfulSyncs: string[] = [];
            for (const attempt of pending) {
              const response = await fetch('/api/attempts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attempt),
              });
              if (response.ok) {
                successfulSyncs.push(attempt.id);
                console.log(`[Sync] Successfully submitted pending attempt for test ${attempt.testId}`);
              } else {
                 console.error(`[Sync] Failed to submit pending attempt for test ${attempt.testId}. Status: ${response.status}`);
              }
            }
            if (successfulSyncs.length > 0) {
              const remaining = pending.filter((att: any) => !successfulSyncs.includes(att.id));
              localStorage.setItem(PENDING_SUBMISSIONS_STORAGE_KEY, JSON.stringify(remaining));
              toast({ title: "Data Synced", description: `${successfulSyncs.length} offline test attempt(s) have been successfully submitted.` });
            }
          }
        } catch (e) {
          console.error("[Sync] Error during sync process:", e);
        }
      }
    }
    syncPendingSubmissions();
  }, [isOnline, toast]);

  const logActivity = useCallback((action: string) => {
    const timestamp = new Date().toISOString();
    setActivityLog(prevLog => [...prevLog, `[${timestamp}] User: ${studentIdentifier} (IP: ${studentIp}) - ${action}`]);
  }, [studentIdentifier, studentIp]);

  useEffect(() => {
    try {
        localStorage.removeItem(`${STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX}${testData.id}`);
        toast({
          title: "Test Loaded Successfully",
          description: "You can now complete this test even if your connection drops.",
          duration: 3000,
        });
    } catch (e) {
        console.warn("Could not clear previous test results from localStorage:", e);
    }

    if (!testData.enableTabSwitchDetection && !testData.enableCopyPasteDisable) return;

    const handleVisibilityChange = () => {
      if (document.hidden && testData.enableTabSwitchDetection) {
        logActivity("Tab switched / minimized.");
        toast({ title: "Warning", description: "Leaving the test tab has been logged.", variant: "destructive", duration: 2000 });
      }
    };

    const preventDefaultHandler = (e: Event) => {
        logActivity(`Attempted action: ${e.type}`);
        e.preventDefault();
        toast({ title: "Action Blocked", description: `${e.type} action is disabled during the test.`, variant: "destructive", duration: 1500 });
    };

    if (testData.enableTabSwitchDetection) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (testData.enableCopyPasteDisable) {
      document.addEventListener('copy', preventDefaultHandler);
      document.addEventListener('paste', preventDefaultHandler);
      document.addEventListener('cut', preventDefaultHandler);
    }
    
    logActivity(`Test started. Anti-cheat measures active based on test settings.`);

    return () => {
      if (testData.enableTabSwitchDetection) document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (testData.enableCopyPasteDisable) {
        document.removeEventListener('copy', preventDefaultHandler);
        document.removeEventListener('paste', preventDefaultHandler);
        document.removeEventListener('cut', preventDefaultHandler);
      }
    };
  }, [logActivity, testData, toast]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    logActivity(`Answer changed for question ID ${questionId}.`);
  };
  
  const savePendingSubmission = (attemptData: Omit<TestAttempt, 'id' | 'submittedAt'>) => {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_SUBMISSIONS_STORAGE_KEY) || '[]');
      const newPendingAttempt = {
        ...attemptData,
        id: `offline-attempt-${Date.now()}`,
        submittedAt: new Date().toISOString()
      };
      pending.push(newPendingAttempt);
      localStorage.setItem(PENDING_SUBMISSIONS_STORAGE_KEY, JSON.stringify(pending));
      toast({
        title: "You are offline",
        description: "Your test has been saved locally and will be submitted automatically when you reconnect.",
        duration: 5000,
      });
    } catch(e) {
        console.error("Failed to save pending submission to localStorage", e);
        toast({ title: "Save Error", description: "Could not save your attempt for later submission.", variant: "destructive"});
    }
  };

  const handleSubmitTest = useCallback(async (autoSubmit: boolean = false) => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    logActivity(autoSubmit ? "Test auto-submitted due to time up." : `Test submitted.`);
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

    testData.questions.forEach(q => {
      totalPossiblePoints += q.points;
    });

    studentAnswersForStorage.forEach(sa => {
      if (sa.isCorrect) {
        correctQuestionsCount++;
        totalPointsAchieved += sa.pointsScored || 0;
      }
    });
    
    const scorePercentage = totalPossiblePoints > 0 ? Math.round((totalPointsAchieved / totalPossiblePoints) * 100) : 0;
    const totalQuestionsInTest = testData.questions.length; 
    const incorrectOrUnansweredQuestionsCount = totalQuestionsInTest - correctQuestionsCount;
    
    const resultsForStudentPage = {
      testId: testData.id,
      testTitle: testData.title,
      totalQuestions: totalQuestionsInTest, 
      correctAnswersCount: correctQuestionsCount,
      incorrectOrUnansweredCount: incorrectOrUnansweredQuestionsCount,
      totalPointsScored: totalPointsAchieved,
      maxPossiblePoints: totalPossiblePoints,
      scorePercentage: scorePercentage,
      questions: testData.questions, 
      studentRawAnswers: answers, 
    };

    try {
      localStorage.setItem(`${STUDENT_TEST_RESULTS_STORAGE_KEY_PREFIX}${testData.id}`, JSON.stringify(resultsForStudentPage));
    } catch (e) {
      console.error("Failed to save results to localStorage", e);
      toast({ title: "Storage Error", description: "Could not save your test results locally.", variant: "destructive", duration: 2000 });
    }
        
    const attemptDataForApi: Omit<TestAttempt, 'id' | 'submittedAt'> = {
      testId: testData.id,
      testTitle: testData.title,
      studentIdentifier: studentIdentifier,
      startTime: startTimeRef.current.toISOString(),
      endTime: endTime.toISOString(),
      answers: studentAnswersForStorage, 
      score: totalPointsAchieved,
      maxPossiblePoints: totalPossiblePoints,
      scorePercentage: scorePercentage,
      activityLog: activityLog.join('\n'),
      isSuspicious: false, 
      suspiciousReason: "", 
      ipAddress: studentIp, 
    };

    const proctorInput: AnalyzeStudentBehaviorInput = {
      studentId: studentIdentifier, 
      testId: testData.id,
      activityLog: activityLog.join('\n'),
    };
    
    try {
      const proctoringResult = await analyzeStudentBehavior(proctorInput);
      attemptDataForApi.isSuspicious = proctoringResult.isSuspicious;
      attemptDataForApi.suspiciousReason = proctoringResult.suspiciousReason;
      logActivity(`AI Proctoring result: Suspicious - ${proctoringResult.isSuspicious}, Reason - ${proctoringResult.suspiciousReason}, Severity - ${proctoringResult.severityScore}`);
    } catch (proctorError) {
      console.error("AI Proctoring Error:", proctorError);
      logActivity(`AI Proctoring failed: ${(proctorError as Error).message}`);
      toast({ title: "AI Proctoring Issue", description: "Could not analyze behavior, but test will still be submitted.", variant: "destructive", duration: 2000 });
      attemptDataForApi.isSuspicious = false;
      attemptDataForApi.suspiciousReason = `Proctoring analysis failed: ${(proctorError as Error).message}`;
    }

    const submitToServer = async () => {
       const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptDataForApi),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }
      return response.json();
    };
    
    if (isOnline) {
      try {
        const responseData = await submitToServer();
        console.log("[StudentTestArea] Attempt submitted to API:", responseData);
        toast({
          title: "Test Submitted!",
          description: `Your test has been successfully ${autoSubmit ? 'auto-' : ''}submitted.`,
          duration: 2000,
        });
      } catch(e) {
        console.error("[StudentTestArea] Network error during online submission, saving for later:", e);
        savePendingSubmission(attemptDataForApi);
      }
    } else {
      savePendingSubmission(attemptDataForApi);
    }
    
    setIsSubmitted(true);
    setTimeout(() => router.push(`/test/${testData.id}/results`), 1500); 

  }, [answers, testData, activityLog, toast, isSubmitting, isSubmitted, router, logActivity, studentIdentifier, studentIp, startTimeRef, isOnline]);

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
  
  const currentQuestion = displayQuestion;
  const totalQuestions = testData.questions.length;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl p-2 md:p-0">
      {!isOnline && (
        <div className="w-full p-2 mb-4 rounded-md bg-yellow-500/20 text-yellow-700 border border-yellow-500/30 text-center font-semibold flex items-center justify-center text-sm">
          <WifiOff className="mr-2 h-4 w-4" />
          You are currently offline. Your progress is being saved locally.
        </div>
      )}
      <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="w-full md:w-1/3 order-2 md:order-1">
          <div className="sticky top-4 z-20 space-y-4">
            <Timer 
              initialDuration={testData.duration * 60} 
              onTimeUp={() => handleSubmitTest(true)}
              onAlmostTimeUp={() => toast({ title: "Time Warning!", description: "Less than a minute remaining!", variant: "destructive", duration: 2000})}
              warningThreshold={60} 
            />
            <Card>
              <CardHeader className="p-3">
                  <CardTitle className="text-base flex items-center gap-2"><Languages className="h-5 w-5"/> Language</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                  <div className="flex gap-2">
                      <Button variant={language === 'en' ? 'default' : 'outline'} onClick={() => setLanguage('en')} className="w-full" disabled={isTranslating}>English</Button>
                      <Button variant={language === 'hi' ? 'default' : 'outline'} onClick={() => setLanguage('hi')} className="w-full" disabled={isTranslating}>
                          {isTranslating && language === 'hi' ? <Loader2 className="h-4 w-4 animate-spin"/> : 'हिन्दी'}
                      </Button>
                  </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="text-lg font-headline">Navigation</CardTitle></CardHeader>
              <CardContent className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
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
        </div>

        <div className="w-full md:w-2/3 order-1 md:order-2">
           <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
            currentAnswer={answers[originalQuestion.id]}
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
