
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Library, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import type { Test, Batch as Group, User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

async function getPublishedTestsForGroup(groupId: string): Promise<Test[]> {
    const response = await fetch(`/api/tests?cb=${new Date().getTime()}`, { cache: 'no-store' });
    if (!response.ok) return [];
    const allTests: Test[] = await response.json();
    return allTests.filter(test => test.batchId === groupId && test.published && !test.deletedAt);
}

async function getGroupDetails(groupId: string, studentIdentifier: string): Promise<Group | null> {
    const response = await fetch(`/api/groups?studentIdentifier=${encodeURIComponent(studentIdentifier)}`);
    if (!response.ok) return null;
    const allStudentGroups: Group[] = await response.json();
    return allStudentGroups.find(g => g.id === groupId) || null;
}

export default function StudentGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [assignedTests, setAssignedTests] = useState<Test[]>([]);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        if (!user || !user.displayName || !groupId) {
            if (!isAuthLoading) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const [groupDetails, testsInGroup, allUsersResponse] = await Promise.all([
                getGroupDetails(groupId, user.displayName),
                getPublishedTestsForGroup(groupId),
                fetch('/api/mock-users')
            ]);
            
            if (!groupDetails) {
                toast({ title: "Access Denied", description: "You are not a member of this group or the group does not exist.", variant: "destructive"});
                router.push('/dashboard/my-groups');
                return;
            }
            
            setGroup(groupDetails);
            setAssignedTests(testsInGroup);

            if (allUsersResponse.ok) {
                const allUsers: User[] = await allUsersResponse.json();
                const groupTeacher = allUsers.find(u => u.id === groupDetails.teacherId) || null;
                setTeacher(groupTeacher);
            }

        } catch (error) {
            console.error("Error fetching group details for student:", error);
            toast({ title: "Error", description: "Could not load group details.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }
    
    if(!isAuthLoading) {
      fetchData();
    }
  }, [user, groupId, isAuthLoading, router, toast]);
  
  const getTeacherInitials = (teacherName?: string) => {
    if (teacherName) {
      const names = teacherName.split(' ');
      if (names.length > 1 && names[0] && names[names.length - 1]) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return teacherName.substring(0, 2).toUpperCase();
    }
    return "T";
  };


  if (isLoading || isAuthLoading) {
    return (
        <div className="container mx-auto py-2">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-10 w-1/2 mb-8" />
            <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
        </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Group not found or you do not have access.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/my-groups"><ArrowLeft className="mr-2 h-4 w-4"/>Back to My Groups</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <Button variant="ghost" asChild className="mb-2 -ml-4">
              <Link href="/dashboard/my-groups">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Groups
              </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">{group.name}</h1>
            {teacher && (
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback>{getTeacherInitials(teacher.displayName)}</AvatarFallback>
                    </Avatar>
                    <span>Taught by {teacher.displayName}</span>
                 </div>
            )}
          </div>
        </div>
        
        <Separator className="my-6"/>

        <h2 className="text-2xl font-semibold font-headline mb-4">Assigned Tests</h2>

         {assignedTests.length === 0 ? (
          <Card className="text-center py-12 shadow-md">
            <CardContent className="flex flex-col items-center gap-3">
              <Library className="w-12 h-12 text-muted-foreground/70" />
              <p className="text-muted-foreground">There are no published tests assigned to this group yet.</p>
            </CardContent>
          </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignedTests.map(test => (
                    <Card key={test.id} className="flex flex-col shadow-sm hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">{test.title}</CardTitle>
                             <CardDescription>
                                {test.subject} | {test.questions.length} Questions | {test.duration} min
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <Badge variant="secondary">Ready to Take</Badge>
                        </CardContent>
                        <CardFooter className="border-t pt-4">
                            <Button asChild className="w-full">
                                <Link href={`/test/${test.id}`}>
                                Take Test <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </>
  );
}
