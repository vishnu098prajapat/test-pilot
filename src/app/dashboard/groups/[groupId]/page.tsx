
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Settings, Users, BarChart3, ClipboardList, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getTestsByTeacher } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import type { Test, Batch as Group } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import QrCodeModal from '@/components/common/qr-code-modal';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [assignedTests, setAssignedTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrCodeTitle, setQrCodeTitle] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!user?.id || !groupId) return;
      setIsLoading(true);
      try {
        const [groupsResponse, testsResponse] = await Promise.all([
          fetch(`/api/groups?teacherId=${user.id}`),
          getTestsByTeacher(user.id)
        ]);
        
        if (!groupsResponse.ok) throw new Error("Failed to fetch groups");
        const allGroups: Group[] = await groupsResponse.json();
        const currentGroup = allGroups.find(g => g.id === groupId);
        
        if (currentGroup) {
          setGroup(currentGroup);
          const testsForGroup = testsResponse.filter(test => test.batchId === groupId);
          setAssignedTests(testsForGroup);
        } else {
           toast({ title: "Error", description: "Group not found or you don't have access.", variant: "destructive" });
           router.push('/dashboard/groups');
        }

      } catch (error) {
        console.error("Error fetching group details:", error);
        toast({ title: "Error", description: "Could not load group details.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user?.id, groupId, toast, router]);

  const groupStats = useMemo(() => {
    if (!group) return { totalStudents: 0, testsAssigned: 0, avgPerformance: "N/A" };
    return {
      totalStudents: group.studentIdentifiers.length,
      testsAssigned: assignedTests.length,
      avgPerformance: "N/A",
    };
  }, [group, assignedTests]);

  const handleShowJoinQr = () => {
    if (group && typeof window !== "undefined") {
      const joinLink = `${window.location.origin}/join?code=${group.groupCode}`;
      setQrCodeUrl(joinLink);
      setQrCodeTitle(`QR Code to Join: ${group.name}`);
      setIsQrModalOpen(true);
    }
  };
  
  if (isLoading || isAuthLoading) {
    return (
        <div className="container mx-auto py-2">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-10 w-1/2 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Separator className="my-8" />
            <Skeleton className="h-10 w-48 mb-4" />
            <Card><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto py-8 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-destructive">Group Not Found</h2>
        <p className="text-muted-foreground">The group you are looking for does not exist or you do not have permission to view it.</p>
        <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/groups"><ArrowLeft className="mr-2 h-4 w-4"/>Back to All Groups</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <Button variant="ghost" asChild className="mb-2 -ml-4">
              <Link href="/dashboard/groups">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Groups
              </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">{group.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Group Settings</Button>
            <Button asChild>
              <Link href="/dashboard">
                <PlusCircle className="mr-2 h-4 w-4" /> Assign Test
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{groupStats.totalStudents}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Tests Assigned</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{groupStats.testsAssigned}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Group Avg. Performance</CardTitle><BarChart3 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{groupStats.avgPerformance}</div></CardContent></Card>
        </div>

        <Separator />
        
        {/* Main Content with Tabs */}
        <Tabs defaultValue="tests" className="mt-8">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="tests">Assigned Tests</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={handleShowJoinQr}><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button>
          </div>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Student Roster</CardTitle><CardDescription>List of all students in this group.</CardDescription></CardHeader>
              <CardContent>
                  {group.studentIdentifiers.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">No students have joined this group yet. Use the 'Add Student' button to get a shareable QR code.</div>
                  ) : (
                      <Table>
                          <TableHeader><TableRow><TableHead>Student Identifier</TableHead><TableHead>Avg. Score</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                          <TableBody>
                          {group.studentIdentifiers.map(studentId => (
                              <TableRow key={studentId}>
                              <TableCell className="font-medium">{studentId}</TableCell>
                              <TableCell>N/A</TableCell>
                              <TableCell className="text-right"><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Assigned Tests</CardTitle><CardDescription>Click a test title to attempt it or view results for detailed analytics.</CardDescription></CardHeader>
              <CardContent>
                {assignedTests.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No tests have been assigned to this group yet.</div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Test Title</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {assignedTests.map(test => (
                        <TableRow key={test.id}>
                          <TableCell className="font-medium">
                            <Link href={`/test/${test.id}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                              {test.title}
                            </Link>
                          </TableCell>
                          <TableCell><Badge variant={test.published ? 'default' : 'secondary'}>{test.published ? "Published" : "Draft"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/test/${test.id}/leaderboard`}>View Results</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <QrCodeModal 
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={qrCodeUrl}
        title={qrCodeTitle}
      />
    </>
  );
}
