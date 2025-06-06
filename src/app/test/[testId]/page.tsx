"use client"; // Required for useParams and client-side data fetching/state

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentTestArea from '@/components/student/student-test-area';
import { getTestById } from '@/lib/store'; // Mock store
import type { Test } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StudentTestPage() {
  const params = useParams();
  const router = useRouter();
  const [testData, setTestData] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testId = params.testId as string;

  useEffect(() => {
    async function fetchTest() {
      if (!testId) {
        setError("Test ID is missing.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTest = await getTestById(testId);
        if (fetchedTest && fetchedTest.published) {
          setTestData(fetchedTest);
        } else if (fetchedTest && !fetchedTest.published) {
          setError("This test is not currently active or published.");
        }
        else {
          setError("Test not found. Please check the link or contact your instructor.");
        }
      } catch (err) {
        console.error("Failed to load test:", err);
        setError("An error occurred while loading the test. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTest();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full max-w-4xl mx-auto">
        <div className="w-full flex flex-col md:flex-row gap-8">
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
        <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Test</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  if (!testData) {
     // This case should ideally be covered by error state, but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
         <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Test Not Available</h2>
        <p className="text-muted-foreground mb-6">The requested test could not be loaded.</p>
         <Button asChild variant="outline">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }
  
  // Check if student has already attempted (if attemptsAllowed is limited)
  // This logic would be more complex with a backend and user tracking
  // For now, we assume a fresh attempt.

  return <StudentTestArea testData={testData} />;
}
