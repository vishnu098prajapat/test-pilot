
"use client"; // Required for useParams and client-side data fetching/state

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentTestArea from '@/components/student/student-test-area';
import { getTestById } from '@/lib/store'; 
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
        console.error("StudentTestPage: No testId provided in URL parameters.");
        setError("Test ID is missing from the link.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      console.log(`StudentTestPage: Attempting to load test with ID: "${testId}"`);
      try {
        const fetchedTest = await getTestById(testId);
        console.log(`StudentTestPage: Fetched test data for ID "${testId}":`, fetchedTest);

        if (fetchedTest && fetchedTest.published) {
          setTestData(fetchedTest);
          setError(null); 
          console.log(`StudentTestPage: Test ID "${testId}" is published and loaded successfully.`);
        } else if (fetchedTest && !fetchedTest.published) {
          console.warn(`StudentTestPage: Test ID "${testId}" found but it is NOT PUBLISHED.`);
          setError(`This test (ID: ${testId}) is not currently active or published. Please ask your teacher to publish it.`);
        } else {
          console.warn(`StudentTestPage: Test ID "${testId}" NOT FOUND in store.`);
          setError(`Test with ID "${testId}" not found. Please check the link or contact your instructor.`);
        }
      } catch (err) {
        console.error(`StudentTestPage: Error loading test ID "${testId}":`, err);
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
         <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Test Not Available</h2>
        <p className="text-muted-foreground mb-6">The requested test (ID: {testId}) could not be loaded. It might not exist or is not published.</p>
         <Button asChild variant="outline">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }
  
  return <StudentTestArea testData={testData} />;
}
