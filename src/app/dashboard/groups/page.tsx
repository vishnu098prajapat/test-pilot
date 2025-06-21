"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Users, PlusCircle, ArrowRight, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { Batch as Group } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import CreateGroupDialog from '@/components/groups/create-group-dialog';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/groups?teacherId=${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch groups');
        }
        const data: Group[] = await response.json();
        setGroups(data);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGroups();
  }, [user?.id]);

  const handleGroupCreated = (newGroup: Group) => {
    setGroups(prev => [newGroup, ...prev]);
  };

  return (
    <>
      <div className="container mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center">
            <Users className="w-10 h-10 text-primary mr-3 hidden sm:block" />
            <div>
              <h1 className="text-3xl font-bold font-headline flex items-center">
                <Users className="mr-3 h-8 w-8 text-primary sm:hidden" /> Manage Groups
              </h1>
              <p className="text-muted-foreground">Create and manage your student groups.</p>
            </div>
          </div>
           <Button onClick={() => setIsCreateGroupOpen(true)} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Group
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
                <Users className="mr-2 h-6 w-6 text-primary" /> No Groups Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You haven&apos;t created any groups yet. Get started by creating your first group.
              </p>
            </CardContent>
             <CardFooter className="flex justify-center">
               <Button onClick={() => setIsCreateGroupOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create First Group
                </Button>
             </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <Card key={group.id} className="flex flex-col shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">{group.name}</CardTitle>
                  <CardDescription>
                    {group.studentIdentifiers.length} Student(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   <div className="flex -space-x-2 overflow-hidden">
                      {group.studentIdentifiers.slice(0, 5).map((student, index) => (
                          <div key={index} className="inline-block h-8 w-8 rounded-full ring-2 ring-background flex items-center justify-center bg-muted text-muted-foreground text-xs font-bold">
                              {student.substring(0, 2).toUpperCase()}
                          </div>
                      ))}
                      {group.studentIdentifiers.length > 5 && (
                          <div className="h-8 w-8 rounded-full ring-2 ring-background flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold">
                              +{group.studentIdentifiers.length - 5}
                          </div>
                      )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/dashboard/groups/${group.id}`}>
                      Manage Group <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
       <CreateGroupDialog 
        isOpen={isCreateGroupOpen} 
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
}
