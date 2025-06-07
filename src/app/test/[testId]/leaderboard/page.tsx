
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import type { TestAttempt } from '@/lib/types';

interface RankedAttempt extends TestAttempt {
  rank: number | null;
  badge?: { name: string; color: string; icon: React.ElementType };
}

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [attempts, setAttempts] = useState<RankedAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState<string>('');

  useEffect(() => {
    if (!testId) {
      setError("Test ID is missing.");
      setIsLoading(false);
      return;
    }

    async function fetchAttempts() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/attempts?testId=${testId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch attempts: ${response.statusText}`);
        }
        const fetchedAttempts: TestAttempt[] = await response.json();

        if (fetchedAttempts.length > 0) {
          setTestTitle(fetchedAttempts[0].testTitle || 'Test Leaderboard');
          
          const sortedAttempts = [...fetchedAttempts].sort((a, b) => (b.scorePercentage ?? 0) - (a.scorePercentage ?? 0));
          
          const rankedAttempts: RankedAttempt[] = [];
          let currentRank = 0;
          let lastScore = -1;
          let tiedCount = 1;

          sortedAttempts.forEach((attempt, index) => {
            if (attempt.scorePercentage !== lastScore) {
              currentRank += tiedCount;
              tiedCount = 1;
              lastScore = attempt.scorePercentage ?? -1;
            } else {
              tiedCount++;
            }
            
            let badge;
            if (currentRank === 1) {
              badge = { name: 'Gold', color: 'text-yellow-500', icon: Award };
            } else if (currentRank === 2) {
              badge = { name: 'Silver', color: 'text-gray-400', icon: Award };
            } else if (currentRank === 3) {
              badge = { name: 'Bronze', color: 'text-orange-400', icon: Award };
            }

            rankedAttempts.push({ ...attempt, rank: currentRank, badge });
          });
          setAttempts(rankedAttempts);

        } else {
          setTestTitle('Test Leaderboard'); // Default title if no attempts
          setAttempts([]);
        }
      } catch (e: any) {
        console.error("Error fetching leaderboard data:", e);
        setError(e.message || "Could not load leaderboard data.");
        setTestTitle('Error Loading Leaderboard');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttempts();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <Skeleton className="h-10 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-6 w-1/2 mx-auto mb-8" />
        <Card className="w-full max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {[1,2,3,4].map(i => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    {[1,2,3,4].map(j => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           <CardFooter className="flex justify-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Leaderboard</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <Award className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold font-headline">{testTitle}</CardTitle>
          <CardDescription>Leaderboard of all participants</CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No attempts submitted for this test yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-center">Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium text-center">{attempt.rank}</TableCell>
                    <TableCell>{attempt.studentIdentifier}</TableCell>
                    <TableCell className="text-right">
                      {attempt.scorePercentage !== undefined ? `${attempt.scorePercentage}%` : 'N/A'}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({attempt.score}/{attempt.maxPossiblePoints})
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {attempt.badge && (
                        <span className={`flex items-center justify-center gap-1 ${attempt.badge.color}`}>
                          <attempt.badge.icon className="h-5 w-5" /> 
                          {attempt.badge.name}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 pt-6">
          <Button asChild variant="outline">
            <Link href={`/test/${testId}/results`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Result
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Go to Homepage
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
