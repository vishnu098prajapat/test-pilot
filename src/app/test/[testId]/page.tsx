
"use client"; 

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import StudentTestArea from '@/components/student/student-test-area';
import { getTestById } from '@/lib/store'; 
import type { Test, TestAttempt } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, User, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// TEMPORARY FLAG FOR TESTING: Set to false to re-enable IP-based attempt limits
const DISABLE_IP_BASED_ATTEMPT_LIMIT = true; // This remains true as per user request

export default function StudentTestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [testData, setTestData] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [studentName, setStudentName] = useState('');
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  
  const [studentIp, setStudentIp] = useState<string | null>(null);
  const [hasReachedAttemptLimit, setHasReachedAttemptLimit] = useState(false);
  const [checkingAttemptStatus, setCheckingAttemptStatus] = useState(true);

  const testId = params.testId as string;

  useEffect(() => {
    async function fetchInitialData() {
      if (!testId) {
        setError("Test ID is missing from the link. Please check the URL.");
        setIsLoading(false);
        setCheckingAttemptStatus(false);
        return;
      }

      setIsLoading(true);
      setCheckingAttemptStatus(true);
      setError(null);

      let currentIp: string | null = null;

      try {
        // 1. Fetch Test Data
        console.log(`[StudentTestPage] Fetching test data for ID: ${testId}`);
        const fetchedTest = await getTestById(testId);
        if (!fetchedTest) {
          setError(`Test not found. It might have been deleted or the ID is incorrect (ID: ${testId}).`);
          throw new Error("Test not found");
        }
        if (!fetchedTest.published) {
          setError(`This test (Title: "${fetchedTest.title}") is not currently published by the teacher. Please contact the teacher if you believe this is an error.`);
          throw new Error("Test not published");
        }
        setTestData(fetchedTest);
        console.log(`[StudentTestPage] Test data loaded: "${fetchedTest.title}", Attempts Allowed by Teacher: ${fetchedTest.attemptsAllowed}`);

        // 2. Fetch Student IP (conditionally, if IP check is *not* disabled AND attempts are limited)
        // For "unlimited attempts for all" (user's current request for testing):
        // We still fetch IP for logging/proctoring but don't use it to block attempts.
        
        if (DISABLE_IP_BASED_ATTEMPT_LIMIT) {
          currentIp = "IP_CHECK_DISABLED_FOR_TESTING"; // Placeholder IP
          setStudentIp(currentIp);
          console.log(`[StudentTestPage] IP-based attempt limit check is DISABLED by flag. Using placeholder IP: ${currentIp}`);
          setHasReachedAttemptLimit(false); // Always allow attempt if flag is true
        } else if (fetchedTest.attemptsAllowed === 0) { // Teacher set unlimited attempts
            currentIp = "IP_CHECK_NOT_NEEDED_UNLIMITED_ATTEMPTS_BY_TEACHER";
            setStudentIp(currentIp);
            console.log("[StudentTestPage] Teacher set unlimited attempts for this test. IP-based limit check skipped.");
            setHasReachedAttemptLimit(false);
        } else { // IP check is enabled by flag AND attempts are limited by teacher
          const ipResponse = await fetch('/api/get-ip');
          if (!ipResponse.ok) throw new Error('Failed to fetch your IP address. Please check your network connection.');
          const ipData = await ipResponse.json();
          currentIp = ipData.ip;
          setStudentIp(currentIp);
          console.log(`[StudentTestPage] Student IP fetched: ${currentIp}. Checking against teacher's attempt limit of ${fetchedTest.attemptsAllowed}.`);

          console.log(`[StudentTestPage] Checking existing attempts for testId: ${testId} and IP: ${currentIp}`);
          const attemptsResponse = await fetch(`/api/attempts?testId=${testId}&ipAddress=${currentIp}`);
          if (!attemptsResponse.ok) throw new Error('Failed to fetch existing attempts. Please try again.');
          const existingAttemptsForIp: TestAttempt[] = await attemptsResponse.json();
          
          console.log(`[StudentTestPage] Found ${existingAttemptsForIp.length} existing attempts from IP ${currentIp} for this test.`);

          if (existingAttemptsForIp.length >= fetchedTest.attemptsAllowed) {
            setHasReachedAttemptLimit(true);
            const message = `You have reached the maximum number of attempts (${fetchedTest.attemptsAllowed}) for this test from your current IP address.`;
            setError(message); // Set error to display block message
            toast({
              title: "Attempt Limit Reached",
              description: message,
              variant: "destructive",
              duration: 7000,
            });
          } else {
             setHasReachedAttemptLimit(false);
          }
        }
      } catch (err: any) {
        console.error(`[StudentTestPage] Error during initial data load for test ID "${testId}":`, err);
        if (!error) { 
            setError(err.message || "An error occurred while loading the test. Please ensure the link is correct and the test is active.");
        }
      } finally {
        setIsLoading(false);
        setCheckingAttemptStatus(false);
      }
    }
    fetchInitialData();
  }, [testId, toast, error]); // Removed studentIp from dependencies as it's set within the effect

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim() === "") {
      toast({
        title: "Name Required",
        description: "Please enter your name to start the test.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    setIsNameSubmitted(true);
  };

  if (isLoading || checkingAttemptStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full max-w-4xl mx-auto">
         <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-muted-foreground">
          {isLoading ? "Loading test data..." : "Checking your attempt status..."}
        </p>
        <div className="w-full flex flex-col md:flex-row gap-8 mt-6">
            <div className="w-full md:w-1/3 space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
            <div className="w-full md:w-2/3 space-y-4">
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
         <Skeleton className="h-10 w-full mt-8" />
      </div>
    );
  }

  if (error) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Could Not Start Test</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }
  
  if (!testData) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
         <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Test Not Available</h2>
        <p className="text-muted-foreground mb-6">The requested test could not be loaded. It may have been removed or the link is incorrect.</p>
         <Button asChild variant="outline">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  // This condition should now only trigger if IP check is enabled AND limit is reached.
  if (hasReachedAttemptLimit && !DISABLE_IP_BASED_ATTEMPT_LIMIT && testData.attemptsAllowed > 0) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Ban className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Attempt Limit Reached</h2>
        <p className="text-muted-foreground mb-2">You have already used all allowed attempts ({testData.attemptsAllowed}) for the test: "{testData.title}" from your current IP address ({studentIp || 'unknown'}).</p>
        <p className="text-sm text-muted-foreground mb-6">Multiple attempts beyond the set limit are not allowed.</p>
        <div className="flex space-x-4">
            <Button asChild variant="default">
                <Link href={`/test/${testId}/leaderboard`}>View Leaderboard</Link>
            </Button>
            <Button asChild variant="outline">
            <Link href="/">Go to Homepage</Link>
            </Button>
        </div>
      </div>
    );
  }

  if (!isNameSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">Welcome to: {testData.title}</CardTitle>
            <CardDescription className="text-center pt-2">Please enter your full name as it should appear on the leaderboard to begin the test.</CardDescription>
          </CardHeader>
          <form onSubmit={handleNameSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="studentName" className="mb-2 block">Your Name</Label>
                <Input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="text-base"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                <User className="mr-2 h-4 w-4" /> Start Test
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }
  
  if (!studentIp) { // Should only happen if IP fetch fails and IP_LIMIT is not disabled
     return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <AlertTriangle className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Preparing Test...</h2>
        <p className="text-muted-foreground mb-6">Could not verify your network details. Please refresh or try again.</p>
         <Button onClick={() => window.location.reload()} variant="outline">Refresh Page</Button>
      </div>
    );
  }

  return <StudentTestArea testData={testData} studentIdentifier={studentName.trim()} studentIp={studentIp} />;
}

