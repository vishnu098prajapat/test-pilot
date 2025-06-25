
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Copy, Settings, Users, BarChart3, ClipboardList, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getTestsByTeacher } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import type { Test, TestAttempt, Batch as Group, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import AssignTestDialog from '@/components/groups/assign-test-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

type EnrichedStudent = User & { avgScore: number | string; attemptsCount: number };

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [allTeacherTests, setAllTeacherTests] = useState<Test[]>([]);
  const [assignedTests, setAssignedTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);


  useEffect(() => {
    async function fetchData() {
      if (!user?.id || !groupId) return;
      setIsLoading(true);
      try {
        const [groupsResponse, testsResponse, usersResponse, attemptsResponse] = await Promise.all([
          fetch(`/api/groups?teacherId=${user.id}`),
          getTestsByTeacher(user.id),
          fetch('/api/mock-users'),
          fetch('/api/attempts')
        ]);
        
        if (!groupsResponse.ok) throw new Error("Failed to fetch groups");
        const allGroups: Group[] = await groupsResponse.json();
        const currentGroup = allGroups.find(g => g.id === groupId);

        const allUsers: User[] = await usersResponse.json();
        const allAttempts: TestAttempt[] = await attemptsResponse.json();
        
        if (currentGroup) {
          setGroup(currentGroup);
          setAllTeacherTests(testsResponse);
          const testsForGroup = testsResponse.filter(test => test.batchId === groupId);
          const assignedTestIds = new Set(testsForGroup.map(t => t.id));
          setAssignedTests(testsForGroup);
          
          const enrichedStudents = currentGroup.studentIdentifiers.map(identifier => {
              const studentUser = allUsers.find(u => u.displayName.toLowerCase() === identifier.toLowerCase()) || { displayName: identifier, id: identifier };
              const studentAttemptsInGroup = allAttempts.filter(
                  attempt => attempt.studentIdentifier.toLowerCase() === identifier.toLowerCase() && assignedTestIds.has(attempt.testId)
              );
              const avgScore = studentAttemptsInGroup.length > 0 
                  ? Math.round(studentAttemptsInGroup.reduce((sum, att) => sum + (att.scorePercentage || 0), 0) / studentAttemptsInGroup.length)
                  : 'N/A';
              return {
                  ...studentUser,
                  avgScore: avgScore,
                  attemptsCount: studentAttemptsInGroup.length,
              };
          });
          setStudents(enrichedStudents as EnrichedStudent[]);

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
      totalStudents: students.length,
      testsAssigned: assignedTests.length,
      avgPerformance: "N/A",
    };
  }, [group, assignedTests, students]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${type} copied to clipboard.`, duration: 2000 });
  };
  
  const handleTestAssigned = (updatedTest: Test) => {
    setAssignedTests(prev => [updatedTest, ...prev]);
    setAllTeacherTests(prev => prev.map(t => t.id === updatedTest.id ? updatedTest : t));
  };
  
  const handleRemoveStudent = async (studentIdentifier: string) => {
    if (!group) return;
    try {
        const response = await fetch('/api/groups/remove-student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId: group.id, studentIdentifier }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        toast({ title: "Success", description: `Student "${studentIdentifier}" removed from the group.` });
        
        setGroup(prev => prev ? ({ ...prev, studentIdentifiers: prev.studentIdentifiers.filter(id => id !== studentIdentifier) }) : null);
        setStudents(prev => prev.filter(s => s.displayName !== studentIdentifier));

    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: 'destructive' });
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
  
  const getInitials = (displayName?: string) => {
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length > 1 && names[0] && names[names.length - 1]) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    return "??"; 
  };


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
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              <ClipboardList className="mr-2 h-4 w-4" /> Assign Test
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Group Code:</span>
              <div className="flex items-center gap-1 rounded-md border bg-muted px-3 py-1.5">
                  <span className="font-mono text-lg tracking-widest text-primary">{group.groupCode}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(group.groupCode, 'Group Code')}>
                      <Copy className="h-4 w-4" />
                  </Button>
              </div>
            </div>
          </div>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Student Roster</CardTitle><CardDescription>List of all students in this group and their performance on assigned tests.</CardDescription></CardHeader>
              <CardContent>
                  {students.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">No students have joined this group yet. Use the group code to invite them.</div>
                  ) : (
                      <Table>
                          <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Attempts in Group</TableHead>
                                <TableHead>Average Score</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                          {students.map(student => (
                              <TableRow key={student.id || student.displayName}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={student.profileImageUrl} alt={student.displayName} />
                                            <AvatarFallback>{getInitials(student.displayName)}</AvatarFallback>
                                        </Avatar>
                                        <Link href={`/dashboard/student-analytics/${encodeURIComponent(student.displayName)}`} className="hover:underline">
                                            {student.displayName}
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell>{student.attemptsCount}</TableCell>
                                <TableCell>{typeof student.avgScore === 'number' ? `${student.avgScore}%` : student.avgScore}</TableCell>
                                <TableCell className="text-right">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Student?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove "{student.displayName}" from this group? They can rejoin later using the group code. This will not delete their test attempts.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveStudent(student.displayName)} className="bg-destructive hover:bg-destructive/90">
                                          Remove Student
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
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
      <AssignTestDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        groupId={group.id}
        allTeacherTests={allTeacherTests}
        onTestAssigned={handleTestAssigned}
      />
    </>
  );
}

    