
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Users, Trash2, UserPlus as UserPlusIcon, ClipboardCopy, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Group } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import CreateGroupDialog from '@/components/groups/create-group-dialog';
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

export default function GroupsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingGroups(true);
    try {
      const response = await fetch(`/api/groups?teacherId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data: Group[] = await response.json();
      setGroups(data.map(g => ({ ...g, createdAt: new Date(g.createdAt) })));
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      toast({ title: "Error", description: "Could not load your groups.", variant: "destructive" });
    } finally {
      setIsLoadingGroups(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      fetchGroups();
    } else if (!isAuthLoading && !user) {
      setIsLoadingGroups(false); // Not loading if no user
    }
  }, [user, isAuthLoading, fetchGroups]);

  const handleGroupCreated = (newGroup: Group) => {
    setGroups(prev => [...prev, newGroup].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    fetchGroups(); // Re-fetch to ensure consistency, or just update state
  };
  
  const handleDeleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups?groupId=${groupId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete group');
      }
      toast({ title: "Success", description: "Group deleted successfully." });
      setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not delete group.", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: message, duration: 2000 });
    }).catch(err => {
      toast({ title: "Error", description: "Failed to copy.", variant: "destructive" });
    });
  };

  if (isAuthLoading || (isLoadingGroups && user)) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/3 mt-2" /></CardContent><CardFooter><Skeleton className="h-9 w-full" /></CardFooter></Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!user) {
     return (
      <div className="container mx-auto py-8 text-center">
        <Info className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Please Log In</h2>
        <p className="text-muted-foreground mb-4">You need to be logged in to manage groups.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" /> Manage Groups
          </h1>
          <p className="text-muted-foreground">Create and manage your student groups.</p>
        </div>
        <Button size="lg" onClick={() => setIsCreateGroupDialogOpen(true)}>
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Group
        </Button>
      </div>

      {groups.length === 0 && !isLoadingGroups ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <Users className="w-16 h-16 text-muted-foreground/50" />
            <p className="text-muted-foreground text-lg">No groups yet.</p>
            <p className="text-sm text-muted-foreground">Click "Create New Group" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="font-headline text-xl">{group.name}</CardTitle>
                <CardDescription>
                  Group Code: 
                  <Button 
                    variant="link" 
                    className="p-1 h-auto text-primary font-mono" 
                    onClick={() => copyToClipboard(group.groupCode, "Group code copied!")}
                    title="Copy group code"
                  >
                    {group.groupCode} <ClipboardCopy className="ml-2 h-3 w-3"/>
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Students: {group.studentIdentifiers.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created: {new Date(group.createdAt).toLocaleDateString()}
                </p>
                {/* Future: List a few student names or "Manage Members" button */}
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" disabled> {/* Implement later */}
                  <UserPlusIcon className="mr-1 h-4 w-4" /> Manage Members
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Group &quot;{group.name}&quot;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the group. Students will no longer be associated with it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        Delete Group
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <CreateGroupDialog
        isOpen={isCreateGroupDialogOpen}
        onClose={() => setIsCreateGroupDialogOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}
