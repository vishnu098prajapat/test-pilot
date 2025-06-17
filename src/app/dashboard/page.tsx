
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, ClipboardList, BarChart3, Users, Clock, Edit, Trash2, Share2, Eye, Activity, MessageCircle, QrCode, MoreVertical, ListFilter, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Test, TestAttempt } from "@/lib/types";
import { getTestsByTeacher, deleteTest as deleteTestAction } from "@/lib/store"; 
import { Separator } from "@/components/ui/separator";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import QrCodeModal from "@/components/common/qr-code-modal";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

export default function DashboardPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [allAttempts, setAllAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrCodeTitle, setQrCodeTitle] = useState("");

  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (user?.id) {
        setIsLoading(true);
        try {
          const [teacherTests, fetchedAttempts] = await Promise.all([
            getTestsByTeacher(user.id),
            fetch('/api/attempts').then(res => res.ok ? res.json() : [])
          ]);
          setTests(teacherTests);
          setAllAttempts(fetchedAttempts);
        } catch (error) {
          toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive", duration: 2000 });
          console.error("Dashboard fetch error:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchData();
  }, [user?.id, toast]);

  const toggleSelectionMode = () => {
    setIsSelectionModeActive(!isSelectionModeActive);
    setSelectedTests([]); // Clear selections when toggling mode
  };

  const handleTestSelection = (testId: string) => {
    setSelectedTests(prevSelected =>
      prevSelected.includes(testId)
        ? prevSelected.filter(id => id !== testId)
        : [...prevSelected, testId]
    );
  };

  const handleBulkDeleteTests = async () => {
    if (selectedTests.length === 0) {
      toast({ title: "No Tests Selected", description: "Please select at least one test to delete.", variant: "destructive", duration: 2000 });
      return;
    }

    try {
      let successCount = 0;
      for (const testId of selectedTests) {
        const success = await deleteTestAction(testId);
        if (success) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        setTests(prevTests => prevTests.filter(test => !selectedTests.includes(test.id)));
        setAllAttempts(prevAttempts => prevAttempts.filter(attempt => !selectedTests.includes(attempt.testId)));
        toast({ title: "Success", description: `${successCount} test(s) deleted successfully.`, duration: 2000 });
      }
      
      if (successCount < selectedTests.length) {
        toast({ title: "Partial Deletion", description: `${selectedTests.length - successCount} test(s) could not be deleted.`, variant: "destructive", duration: 2000 });
      }

    } catch (error) {
      toast({ title: "Error", description: "An error occurred while deleting tests.", variant: "destructive", duration: 2000 });
    } finally {
      setSelectedTests([]);
      setIsSelectionModeActive(false);
    }
  };
  
  const dashboardStats = useMemo(() => {
    if (!user || tests.length === 0) {
      return { totalSubmissions: 0, averageScore: 0, publishedTests: 0 };
    }
    const teacherTestIds = new Set(tests.map(t => t.id));
    const relevantAttempts = allAttempts.filter(attempt => teacherTestIds.has(attempt.testId));
    
    const totalSubmissions = relevantAttempts.length;
    const totalScoreSum = relevantAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    const averageScore = totalSubmissions > 0 ? Math.round(totalScoreSum / totalSubmissions) : 0;
    const publishedTests = tests.filter(t => t.published).length;

    return { totalSubmissions, averageScore, publishedTests };
  }, [tests, allAttempts, user]);


  const getTestStats = (testId: string) => {
    const attemptsForTest = allAttempts.filter(attempt => attempt.testId === testId);
    const numberOfAttempts = attemptsForTest.length;
    const averageScore = numberOfAttempts > 0 
      ? Math.round(attemptsForTest.reduce((sum, att) => sum + (att.scorePercentage || 0), 0) / numberOfAttempts)
      : 0;
    return { numberOfAttempts, averageScore };
  };

  const handleShareLink = (testLink: string) => {
    navigator.clipboard.writeText(testLink);
    toast({ title: "Link Copied!", description: "Test link copied to clipboard.", duration: 2000 });
  };

  const handleWhatsAppShare = (test: Test) => {
    if (typeof window !== "undefined") {
      const testLink = `${window.location.origin}/test/${test.id}`;
      const message = encodeURIComponent(`Check out this test: "${test.title}". Take it here: ${testLink}`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const handleShowQrCode = (test: Test) => {
    if (typeof window !== "undefined") {
      const testLink = `${window.location.origin}/test/${test.id}`;
      setQrCodeUrl(testLink);
      setQrCodeTitle(`QR Code for: ${test.title}`);
      setIsQrModalOpen(true);
    }
  };

  const SummaryCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) => (
    <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="container mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
          </div>
          {!isSelectionModeActive && (
            <Button asChild size="lg">
              <Link href="/dashboard/create-test">
                <PlusCircle className="mr-2 h-5 w-5" /> Create New Test
              </Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard title="Total Tests" value={isLoading ? <Skeleton className="h-8 w-12" /> : tests.length} icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} description="Number of tests you've created" />
          <SummaryCard title="Published Tests" value={isLoading ? <Skeleton className="h-8 w-12" /> : dashboardStats.publishedTests} icon={<Eye className="h-4 w-4 text-muted-foreground" />} description="Tests available to students" />
          <SummaryCard title="Total Submissions" value={isLoading ? <Skeleton className="h-8 w-12" /> : dashboardStats.totalSubmissions} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Across all your published tests" />
          <SummaryCard title="Average Score" value={isLoading ? <Skeleton className="h-8 w-12" /> : `${dashboardStats.averageScore}%`} icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} description="Avg. score on your tests" />
        </div>
        
        <Separator className="my-8" />

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold font-headline">My Tests</h2>
            <div className="flex gap-2">
              {!isSelectionModeActive ? (
                <Button variant="outline" onClick={toggleSelectionMode} disabled={isLoading || tests.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" /> Select to Delete
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={toggleSelectionMode}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={selectedTests.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedTests.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedTests.length} test(s)? This action cannot be undone and will remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDeleteTests} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                          Yes, Delete Selected
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <Card key={i} className="flex items-center p-4">
                  {isSelectionModeActive && <Skeleton className="h-5 w-5 mr-4" />}
                  <div className="flex-grow">
                    <CardHeader className="p-0">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-1" />
                      <div className="flex gap-4 mt-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 mt-2">
                      <Skeleton className="h-4 w-1/4" />
                    </CardContent>
                  </div>
                  <div className="flex justify-end gap-2 ml-auto">
                     <Skeleton className="h-9 w-24" />
                     <Skeleton className="h-9 w-9" />
                  </div>
                </Card>
              ))}
            </div>
          ) : tests.length > 0 ? (
            <div className="space-y-4">
              {tests.map((test) => {
                const { numberOfAttempts, averageScore } = getTestStats(test.id);
                const testLink = typeof window !== "undefined" ? `${window.location.origin}/test/${test.id}` : "";
                return (
                <Card key={test.id} className={`flex items-center p-4 shadow-sm hover:shadow-md transition-shadow ${selectedTests.includes(test.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                  {isSelectionModeActive && (
                    <Checkbox
                      id={`select-${test.id}`}
                      checked={selectedTests.includes(test.id)}
                      onCheckedChange={() => handleTestSelection(test.id)}
                      className="mr-4 h-5 w-5"
                      aria-label={`Select test ${test.title}`}
                    />
                  )}
                  <div className="flex-grow">
                    <CardHeader className="p-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="font-headline text-xl">{test.title}</CardTitle>
                          <CardDescription>{test.subject} - {test.questions.length} questions - {test.duration} mins</CardDescription>
                        </div>
                         <Badge variant={test.published ? "default" : "secondary"} className="hidden sm:inline-flex">
                            {test.published ? "Published" : "Draft"}
                          </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 flex flex-wrap gap-x-4 gap-y-1 items-center">
                          <span>
                            <Users className="inline h-3 w-3 mr-1"/> Attempts: {numberOfAttempts}
                          </span>
                          <span>
                            <BarChart3 className="inline h-3 w-3 mr-1"/> Avg. Score: {numberOfAttempts > 0 ? `${averageScore}%` : 'N/A'}
                          </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 mt-2">
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(test.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </div>
                  <CardFooter className="p-0 pl-4 flex justify-end gap-2 ml-auto items-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/test/${test.id}`}>
                        <Activity className="mr-1 h-4 w-4" /> Manage
                      </Link>
                    </Button>
                    {!isSelectionModeActive && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/create-test?edit=${test.id}`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => testLink && handleShareLink(testLink)} disabled={!test.published || !testLink}>
                            <Share2 className="mr-2 h-4 w-4" /> Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShowQrCode(test)} disabled={!test.published}>
                            <QrCode className="mr-2 h-4 w-4" /> Show QR
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleWhatsAppShare(test)} disabled={!test.published}>
                            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent className="flex flex-col items-center gap-4">
                <ClipboardList className="w-16 h-16 text-muted-foreground/50" />
                <p className="text-muted-foreground text-lg">No tests created yet.</p>
                <p className="text-sm text-muted-foreground">Get started by creating your first test!</p>
                <Button asChild className="mt-2">
                  <Link href="/dashboard/create-test">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Test
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {qrCodeUrl && (
        <QrCodeModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          url={qrCodeUrl}
          title={qrCodeTitle}
        />
      )}
    </>
  );
}

