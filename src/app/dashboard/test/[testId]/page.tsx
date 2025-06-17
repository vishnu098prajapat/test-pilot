
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Share2, BarChart3, Trash2, Clock, ListChecks, Users, ShieldCheck, AlertTriangle, Settings2, MessageCircle, QrCode, Eye } from "lucide-react";
import { getTestById, deleteTest as deleteTestAction } from "@/lib/store";
import type { Test, TestAttempt } from "@/lib/types";
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
import QrCodeModal from "@/components/common/qr-code-modal"; 

export default function TestManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [test, setTest] = useState<Test | null>(null);
  const [isFetchingTest, setIsFetchingTest] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const testId = params.testId as string;

  useEffect(() => {
    let isActive = true;
    setFetchError(null); 

    if (isAuthLoading) {
      setIsFetchingTest(true); 
      return;
    }

    if (!user) {
      setIsFetchingTest(false); 
      return;
    }

    async function fetchTestDetails() {
      if (!isActive) return;
      setIsFetchingTest(true);
      setTest(null); 

      if (!testId) {
        if (isActive) {
          toast({ title: "Error", description: "Test ID is missing.", variant: "destructive", duration: 2000 });
          router.push("/dashboard"); 
          setIsFetchingTest(false);
        }
        return;
      }

      try {
        const fetchedTest = await getTestById(testId);
        if (!isActive) return;

        if (fetchedTest && fetchedTest.teacherId === user.id) {
          setTest(fetchedTest);
          if (typeof window !== "undefined") {
            setQrCodeUrl(`${window.location.origin}/test/${fetchedTest.id}`);
          }
          setFetchError(null);
        } else if (fetchedTest) {
          setFetchError("You are not authorized to view this test.");
          toast({ title: "Unauthorized", description: "You are not authorized to view this test.", variant: "destructive", duration: 2000 });
        } else {
          setFetchError("Test not found.");
          toast({ title: "Not Found", description: "Test not found.", variant: "destructive", duration: 2000 });
        }
      } catch (error) {
        if (!isActive) return;
        console.error("Failed to load test details:", error);
        setFetchError("Failed to load test details. Please try again.");
        toast({ title: "Error", description: "Failed to load test details.", variant: "destructive", duration: 2000 });
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
  }, [testId, user, isAuthLoading, router, toast]);

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

  const handleCopyLink = () => {
    if (qrCodeUrl) {
      navigator.clipboard.writeText(qrCodeUrl);
      toast({ title: "Link Copied!", description: "Test link copied to clipboard.", duration: 2000 });
    }
  };

  const handleWhatsAppShare = () => {
    if (test && qrCodeUrl) {
      const message = encodeURIComponent(`Check out this test: "${test.title}". Take it here: ${qrCodeUrl}`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const handleShowQrCode = () => {
    if (qrCodeUrl) {
      setIsQrModalOpen(true);
    }
  };

  if (isAuthLoading || (isFetchingTest && !fetchError)) {
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

  if (!isAuthLoading && !user) {
    return (
      <div className="container mx-auto py-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-xl text-muted-foreground">Authentication issue.</p>
        <p className="text-sm text-muted-foreground">You might be redirected to the login page.</p>
      </div>
    );
  }
  
  if (fetchError) {
     return (
      <div className="container mx-auto py-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Test</h2>
        <p className="text-muted-foreground mb-6">{fetchError}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl text-muted-foreground">Test data is not available.</p>
        <Button asChild className="mt-4"><Link href="/dashboard">Go to Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <>
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
            <Button variant="default" disabled={!test.published || !qrCodeUrl} onClick={handleCopyLink}>
              <Share2 className="mr-2 h-4 w-4" /> Copy Link
            </Button>
             <Button variant="outline" disabled={!test.published || !qrCodeUrl} onClick={handleShowQrCode}>
                <QrCode className="mr-2 h-4 w-4" /> Show QR
            </Button>
             <Button variant="outline" disabled={!test.published || !qrCodeUrl} onClick={handleWhatsAppShare}>
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
             <Button variant="outline" asChild>
                  <Link href={`/test/${test.id}/leaderboard`}>
                    <BarChart3 className="mr-2 h-4 w-4" /> View Leaderboard
                  </Link>
              </Button>
          </div>
        </div>

        {test.published && qrCodeUrl && (
          <Card className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-400">Test is Live!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-600 dark:text-green-300">Students can access this test using the link:</p>
              <Input type="text" readOnly value={qrCodeUrl} className="mt-2 bg-green-100 dark:bg-green-800/50" />
              <Button size="sm" variant="ghost" className="mt-2 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-700" onClick={handleCopyLink}>
                Copy Link
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <InfoCard icon={<ListChecks />} label="Questions" value={`${test.questions.length} Questions`} />
          <InfoCard icon={<Clock />} label="Duration" value={`${test.duration} Minutes`} />
          <InfoCard icon={<Users />} label="Attempts Allowed" value={test.attemptsAllowed === 0 ? "Unlimited" : test.attemptsAllowed.toString()} />
          <InfoCard icon={<ShieldCheck />} label="Tab Switch Detection" value={test.enableTabSwitchDetection ? "Enabled" : "Disabled"} />
          <InfoCard icon={<ShieldCheck />} label="Copy/Paste Disabled" value={test.enableCopyPasteDisable ? "Enabled" : "Disabled"} />
        </div>
        
        <Separator className="my-8" />

        <div className="space-y-6">
          <Card className="border-orange-400 dark:border-orange-600">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center text-orange-600 dark:text-orange-400"><Settings2 className="mr-2 h-5 w-5" /> Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Deleting this test is permanent and cannot be undone. All associated data, including student attempts, will be lost.</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                   <Trash2 className="mr-2 h-4 w-4" /> Delete This Test
                  </Button>
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
      {qrCodeUrl && (
        <QrCodeModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          url={qrCodeUrl}
          title={`QR Code for: ${test.title}`}
        />
      )}
    </>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}
const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value }) => (
  <Card className="shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out cursor-pointer">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{label}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);
