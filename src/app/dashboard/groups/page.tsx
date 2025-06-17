
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
import ManageGroupMembersDialog from '@/components/groups/manage-group-members-dialog';
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
import Link from 'next/link';

export default function GroupsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);

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
      setIsLoadingGroups(false); 
    }
  }, [user, isAuthLoading, fetchGroups]);

  const handleGroupCreated = (newGroup: Group) => {
    fetchGroups(); 
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

  const handleOpenManageMembers = (group: Group) => {
    setSelectedGroupForMembers(group);
  };

  const handleMembersUpdated = (updatedGroup: Group) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? {...g, studentIdentifiers: updatedGroup.studentIdentifiers} : g));
    setSelectedGroupForMembers(null); // Close dialog
  };


  if (isAuthLoading || (isLoadingGroups && user)) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center">
            <Users className="w-10 h-10 text-primary mr-3" />
            <div>
              <Skeleton className="h-8 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter className="border-t pt-4 flex flex-col sm:flex-row justify-end gap-2">
                <Skeleton className="h-9 w-full sm:w-auto px-4 py-2" /> {/* Adjusted skeleton */}
                <Skeleton className="h-9 w-9 sm:w-9" /> {/* Adjusted skeleton for icon button */}
              </CardFooter>
            </Card>
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
        <div className="flex items-center">
            <Users className="w-10 h-10 text-primary mr-3 hidden sm:block" />
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center">
                    <Users className="mr-3 h-8 w-8 text-primary sm:hidden" /> Manage Groups
                </h1>
                <p className="text-muted-foreground">Create and manage your student groups.</p>
            </div>
        </div>
        <Button size="lg" onClick={() => setIsCreateGroupDialogOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Group
        </Button>
      </div>

      {groups.length === 0 && !isLoadingGroups ? (
        <Card className="text-center py-12 shadow-md">
          <CardContent className="flex flex-col items-center gap-4">
            <Users className="w-16 h-16 text-muted-foreground/50" />
            <p className="text-muted-foreground text-lg font-semibold">No groups created yet.</p>
            <p className="text-sm text-muted-foreground">Get started by clicking the "Create New Group" button.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
              <CardHeader>
                <CardTitle className="font-headline text-xl">{group.name}</CardTitle>
                <CardDescription className="flex items-center">
                  Group Code: 
                  <span className="font-mono text-primary ml-1 mr-1">{group.groupCode}</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6 text-primary hover:bg-primary/10" 
                    onClick={() => copyToClipboard(group.groupCode, "Group code copied!")}
                    title="Copy group code"
                  >
                    <ClipboardCopy className="h-4 w-4"/>
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1">
                <p className="text-sm text-muted-foreground">
                  Students: {group.studentIdentifiers.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="border-t pt-4 flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenManageMembers(group)} className="w-full sm:w-auto">
                  <UserPlusIcon className="mr-1 h-4 w-4" /> Manage Members
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="w-full sm:w-auto sm:h-9 sm:w-9" title="Delete Group">
                      <Trash2 className="h-4 w-4" />
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
      {selectedGroupForMembers && (
        <ManageGroupMembersDialog
          group={selectedGroupForMembers}
          isOpen={!!selectedGroupForMembers}
          onClose={() => setSelectedGroupForMembers(null)}
          onMembersUpdate={handleMembersUpdated}
        />
      )}
    </div>
  );
}

