
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Share2, BarChart3, Trash2, Clock, ListChecks, Users, ShieldCheck } from "lucide-react"; // Removed Eye as it's not used directly here
import { getTestById, deleteTest as deleteTestAction } from "@/lib/store";
import type { Test } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
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
import Image from "next/image";


export default function TestManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth(); // Use auth loading state
  const { toast } = useToast();
  const [test, setTest] = useState<Test | null>(null);
  const [isFetchingTest, setIsFetchingTest] = useState(true); // Renamed for clarity

  const testId = params.testId as string;

  useEffect(() => {
    let isActive = true;
    // Don't proceed if auth is still loading or user is not available.
    // DashboardLayout should handle redirecting to login if user is null after auth loading.
    if (isAuthLoading) {
      setIsFetchingTest(true); // Keep showing local loading state if auth is not ready
      return;
    }

    // If DashboardLayout has done its job, user should be available here.
    // If user is null here, DashboardLayout should have redirected.
    // We proceed only if user is definitively available.
    if (!user) {
        // This case should ideally be caught by DashboardLayout.
        // If somehow reached, push to login to be safe, though DashboardLayout is primary.
        if (isActive) router.push('/auth/login');
        return;
    }

    async function fetchTestDetails() {
      if (!isActive) return;
      setIsFetchingTest(true);
      setTest(null);

      if (!testId) {
        toast({ title: "Error", description: "Test ID is missing.", variant: "destructive", duration: 2000 });
        if (isActive) router.push("/dashboard");
        setIsFetchingTest(false);
        return;
      }

      try {
        const fetchedTest = await getTestById(testId);
        if (!isActive) return;

        if (fetchedTest && fetchedTest.teacherId === user.id) {
          setTest(fetchedTest);
        } else if (fetchedTest) {
          // Teacher ID mismatch
          toast({ title: "Unauthorized", description: "You are not authorized to view this test.", variant: "destructive", duration: 2000 });
          if (isActive) router.push("/dashboard");
        } else {
          // Test not found
          toast({ title: "Not Found", description: "Test not found.", variant: "destructive", duration: 2000 });
          if (isActive) router.push("/dashboard");
        }
      } catch (error) {
        if (!isActive) return;
        console.error("Failed to load test details:", error);
        toast({ title: "Error", description: "Failed to load test details.", variant: "destructive", duration: 2000 });
        // Optionally redirect to dashboard on critical fetch error
        // if (isActive) router.push("/dashboard");
      } finally {
        if (isActive) {
          setIsFetchingTest(false);
        }
      }
    }

    fetchTestDetails();

    return () => {
      isActive = false;
    };
  }, [testId, user, isAuthLoading, router, toast]); // Added isAuthLoading and user itself


  const handleDeleteTest = async () => {
    if (!test) return;
    try {
      const success = await deleteTestAction(test.id);
      if (success) {
        toast({ title: "Success", description: "Test deleted successfully.", duration: 2000 });
        router.push("/dashboard");
      } else {
        toast({ title: "Error", description: "Failed to delete test.", variant: "destructive", duration: 2000 });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred while deleting the test.", variant: "destructive", duration: 2000 });
    }
  };

  const shareLink = test && typeof window !== 'undefined' ? `${window.location.origin}/test/${test.id}` : "";

  // Show skeleton if auth is loading OR if test data is fetching
  if (isAuthLoading || isFetchingTest) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-3/4" />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If after loading, test is still null, it means fetching failed or test was not found/unauthorized.
  // The useEffect should have handled redirection in those cases.
  // This is a fallback or for cases where redirect hasn't happened yet.
  if (!test) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl text-muted-foreground">Could not load test details or test not found.</p>
        <Button asChild className="mt-4"><Link href="/dashboard">Go to Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            {test.title}
            <Badge variant={test.published ? "default" : "secondary"} className="ml-3 text-sm">
              {test.published ? "Published" : "Draft"}
            </Badge>
          </h1>
          <p className="text-muted-foreground">{test.subject}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
           <Button variant="outline" asChild>
            <Link href={`/dashboard/create-test?edit=${test.id}`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Test
            </Link>
          </Button>
           <Button variant="default" disabled={!test.published} onClick={() => {
              if(shareLink) {
                navigator.clipboard.writeText(shareLink);
                toast({ title: "Link Copied!", description: "Test link copied to clipboard.", duration: 2000 });
              }
           }}>
            <Share2 className="mr-2 h-4 w-4" /> Share Test
          </Button>
        </div>
      </div>

      {test.published && shareLink && (
        <Card className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">Test is Live!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 dark:text-green-300">Students can access this test using the link:</p>
            <Input type="text" readOnly value={shareLink} className="mt-2 bg-green-100 dark:bg-green-800/50" />
            <Button size="sm" variant="ghost" className="mt-2 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-700" onClick={() => {
              navigator.clipboard.writeText(shareLink);
              toast({ title: "Link Copied!", description: "Test link copied to clipboard.", duration: 2000 });
            }}>
              Copy Link
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <InfoCard icon={<ListChecks />} label="Questions" value={`${test.questions.length} Questions`} />
        <InfoCard icon={<Clock />} label="Duration" value={`${test.duration} Minutes`} />
        <InfoCard icon={<Users />} label="Attempts Allowed" value={test.attemptsAllowed === 0 ? "Unlimited" : test.attemptsAllowed.toString()} />
        <InfoCard icon={<ShieldCheck />} label="Tab Switch Detection" value={test.enableTabSwitchDetection ? "Enabled" : "Disabled"} />
        <InfoCard icon={<ShieldCheck />} label="Copy/Paste Disabled" value={test.enableCopyPasteDisable ? "Enabled" : "Disabled"} />
        <InfoCard icon={<ShieldCheck />} label="Fullscreen Enforced" value={test.enforceFullScreen ? "Enabled" : "Disabled"} />
      </div>

      <Separator className="my-8" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center"><BarChart3 className="mr-2 h-5 w-5" /> Results & Analytics</CardTitle>
            <CardDescription>View student submissions and performance (Placeholder).</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Results analysis features are coming soon.</p>
             <Image src="https://placehold.co/600x300.png" alt="Placeholder chart" width={600} height={300} className="mt-4 rounded-md" data-ai-hint="chart analytics" />
          </CardContent>
           <CardFooter>
            <Button variant="outline" disabled>Export Results (PDF/CSV)</Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center text-destructive"><Trash2 className="mr-2 h-5 w-5" /> Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Deleting this test is permanent and cannot be undone. All associated data will be lost.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete This Test</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the test &quot;{test.title}&quot; and all its data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTest} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Yes, delete test
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}
const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value }) => (
  <Card className="shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{label}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);
    
    