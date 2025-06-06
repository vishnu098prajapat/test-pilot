"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, ClipboardList, BarChart3, Users, Clock, Edit, Trash2, Share2, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Test } from "@/lib/types";
import { getTestsByTeacher, deleteTest as deleteTestAction } from "@/lib/store"; // Mock store functions
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTests() {
      if (user?.id) {
        setIsLoading(true);
        try {
          const teacherTests = await getTestsByTeacher(user.id);
          setTests(teacherTests);
        } catch (error) {
          toast({ title: "Error", description: "Failed to load tests.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchTests();
  }, [user?.id, toast]);

  const handleDeleteTest = async (testId: string) => {
    try {
      const success = await deleteTestAction(testId);
      if (success) {
        setTests(prevTests => prevTests.filter(test => test.id !== testId));
        toast({ title: "Success", description: "Test deleted successfully." });
      } else {
        toast({ title: "Error", description: "Failed to delete test.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred while deleting the test.", variant: "destructive" });
    }
  };
  
  const SummaryCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) => (
    <Card>
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
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.email || "Teacher"}!</p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/create-test">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Test
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <SummaryCard title="Total Tests" value={isLoading ? <Skeleton className="h-8 w-12" /> : tests.length} icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} description="Number of tests created" />
        <SummaryCard title="Published Tests" value={isLoading ? <Skeleton className="h-8 w-12" /> : tests.filter(t => t.published).length} icon={<Eye className="h-4 w-4 text-muted-foreground" />} description="Tests available to students" />
        <SummaryCard title="Total Submissions" value="0" icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Across all tests (placeholder)" />
        <SummaryCard title="Average Score" value="N/A" icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} description="Overall performance (placeholder)" />
      </div>
      
      <Separator className="my-8" />

      <div>
        <h2 className="text-2xl font-semibold font-headline mb-6">My Tests</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                   <Skeleton className="h-9 w-20" />
                   <Skeleton className="h-9 w-20" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : tests.length > 0 ? (
          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-headline text-xl">{test.title}</CardTitle>
                      <CardDescription>{test.subject} - {test.questions.length} questions - {test.duration} mins</CardDescription>
                    </div>
                     <Badge variant={test.published ? "default" : "secondary"}>
                        {test.published ? "Published" : "Draft"}
                      </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(test.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/test/${test.id}`}>
                      <Eye className="mr-1 h-4 w-4" /> View/Manage
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/create-test?edit=${test.id}`}>
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" disabled={!test.published} onClick={() => {
                    const testLink = `${window.location.origin}/test/${test.id}`;
                    navigator.clipboard.writeText(testLink);
                    toast({ title: "Link Copied!", description: "Test link copied to clipboard." });
                  }}>
                    <Share2 className="mr-1 h-4 w-4" /> Share
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the test
                          &quot;{test.title}&quot; and all its associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTest(test.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
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
  );
}
