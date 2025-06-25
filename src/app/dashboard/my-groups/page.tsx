
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Users, PlusCircle, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { Batch as Group } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import JoinGroupDialog from '@/components/groups/join-group-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function MyGroupsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  
  const fetchGroups = useCallback(async () => {
    if (!user?.displayName) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups?studentIdentifier=${encodeURIComponent(user.displayName)}`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data: Group[] = await response.json();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast({ title: "Error", description: "Could not load your groups.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user?.displayName, toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupJoined = () => {
    // Re-fetch groups after joining a new one
    fetchGroups();
  };
  
  const getTeacherInitials = (teacherId: string) => {
    return teacherId.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="container mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center">
            <Users className="w-10 h-10 text-primary mr-3 hidden sm:block" />
            <div>
              <h1 className="text-3xl font-bold font-headline flex items-center">
                <Users className="mr-3 h-8 w-8 text-primary sm:hidden" /> My Groups
              </h1>
              <p className="text-muted-foreground">All the groups you have joined.</p>
            </div>
          </div>
           <Button onClick={() => setIsJoinGroupOpen(true)} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Join New Group
            </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : groups.length === 0 ? (
          <Card className="text-center py-12 shadow-md col-span-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center justify-center">
                <BookOpen className="mr-2 h-6 w-6 text-primary" /> You Haven't Joined Any Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Join a group using the code from your teacher to see assigned tests and materials.
              </p>
            </CardContent>
             <CardFooter className="flex justify-center">
               <Button onClick={() => setIsJoinGroupOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Join a Group
                </Button>
             </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <Card key={group.id} className="flex flex-col shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                   <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getTeacherInitials(group.teacherId)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="font-headline text-xl">{group.name}</CardTitle>
                        <CardDescription>
                          {group.studentIdentifiers.length} Student(s)
                        </CardDescription>
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                   <p className="text-xs text-muted-foreground">Managed by Teacher ID: ...{group.teacherId.slice(-6)}</p>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button asChild variant="default" size="sm" className="w-full">
                    <Link href={`/dashboard/my-groups/${group.id}`}>
                      View Group <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
       <JoinGroupDialog 
        isOpen={isJoinGroupOpen} 
        onClose={() => setIsJoinGroupOpen(false)}
        onGroupJoined={handleGroupJoined}
      />
    </>
  );
}
