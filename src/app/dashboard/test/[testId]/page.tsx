"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Share2, BarChart3, Trash2, Clock, ListChecks, Users, ShieldCheck, Eye } from "lucide-react";
import { getTestById, deleteTest as deleteTestAction } from "@/lib/store"; // Mock store
import type { Test } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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

export default function TestManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const testId = params.testId as string;

  useEffect(() => {
    async function fetchTest() {
      if (testId && user?.id) {
        setIsLoading(true);
        try {
          const fetchedTest = await getTestById(testId);
          if (fetchedTest && fetchedTest.teacherId === user.id) {
            setTest(fetchedTest);
          } else if (fetchedTest) {
             toast({ title: "Unauthorized", description: "You are not authorized to view this test.", variant: "destructive" });
            router.push("/dashboard");
          } else {
            toast({ title: "Not Found", description: "Test not found.", variant: "destructive" });
            router.push("/dashboard");
          }
        } catch (error) {
          toast({ title: "Error", description: "Failed to load test details.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      } else if (!user?.id && !isLoading) { // if user is not loaded yet but not loading, wait
         router.push("/auth/login");
      }
    }
    fetchTest();
  }, [testId, user?.id, router, toast, isLoading]);

  const handleDeleteTest = async () => {
    if (!test) return;
    try {
      const success = await deleteTestAction(test.id);
      if (success) {
        toast({ title: "Success", description: "Test deleted successfully." });
        router.push("/dashboard");
      } else {
        toast({ title: "Error", description: "Failed to delete test.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred while deleting the test.", variant: "destructive" });
    }
  };

  const shareLink = test ? `${window.location.origin}/test/${test.id}` : "";

  if (isLoading) {
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

  if (!test) {
    return ( // This case should ideally be handled by redirection in useEffect
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl text-muted-foreground">Test not found or you do not have permission to view it.</p>
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
              navigator.clipboard.writeText(shareLink);
              toast({ title: "Link Copied!", description: "Test link copied to clipboard." });
           }}>
            <Share2 className="mr-2 h-4 w-4" /> Share Test
          </Button>
        </div>
      </div>

      {test.published && (
        <Card className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">Test is Live!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 dark:text-green-300">Students can access this test using the link:</p>
            <Input type="text" readOnly value={shareLink} className="mt-2 bg-green-100 dark:bg-green-800/50" />
            <Button size="sm" variant="ghost" className="mt-2 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-700" onClick={() => {
              navigator.clipboard.writeText(shareLink);
              toast({ title: "Link Copied!", description: "Test link copied to clipboard." });
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
            {/* Placeholder for results list or charts */}
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

