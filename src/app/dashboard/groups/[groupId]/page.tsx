
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Users, MessageSquare, Settings, ImagePlus, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Group, GroupAnnouncement } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import ManageGroupMembersDialog from '@/components/groups/manage-group-members-dialog';
import { Input } from '@/components/ui/input';


export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [newGroupImageUrl, setNewGroupImageUrl] = useState('');
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);


  const fetchGroupDetails = useCallback(async () => {
    if (!groupId || !user) return;
    setIsLoadingGroup(true);
    try {
      const response = await fetch(`/api/groups?groupId=${groupId}`);
      if (!response.ok) throw new Error('Failed to fetch group details');
      const data: Group = await response.json();
      if (data.teacherId !== user.id) {
          toast({ title: "Unauthorized", description: "You cannot access this group.", variant: "destructive" });
          router.push('/dashboard/groups');
          return;
      }
      setGroup({
        ...data,
        createdAt: new Date(data.createdAt),
        announcements: (data.announcements || []).map(ann => ({...ann, timestamp: new Date(ann.timestamp)})).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())
      });
      setNewGroupImageUrl(data.groupImageUrl || '');
    } catch (error) {
      console.error("Failed to fetch group details:", error);
      toast({ title: "Error", description: "Could not load group details.", variant: "destructive" });
    } finally {
      setIsLoadingGroup(false);
    }
  }, [groupId, user, toast, router]);

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchGroupDetails();
    }
  }, [groupId, user, isAuthLoading, fetchGroupDetails]);

  const handlePostAnnouncement = async () => {
    if (!announcementContent.trim() || !group || !user) return;
    setIsPostingAnnouncement(true);
    try {
      const response = await fetch(`/api/groups?groupId=${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          announcementContent: announcementContent.trim(),
          senderId: user.id,
          senderName: user.displayName 
        }),
      });
      if (!response.ok) throw new Error('Failed to post announcement');
      const updatedGroup = await response.json();
      setGroup(updatedGroup.group ? {
        ...updatedGroup.group,
        createdAt: new Date(updatedGroup.group.createdAt),
        announcements: (updatedGroup.group.announcements || []).map((ann: any) => ({...ann, timestamp: new Date(ann.timestamp)})).sort((a:any,b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      } : group);
      setAnnouncementContent('');
      toast({ title: "Success", description: "Announcement posted." });
    } catch (error) {
      toast({ title: "Error", description: "Could not post announcement.", variant: "destructive" });
    } finally {
      setIsPostingAnnouncement(false);
    }
  };
  
  const handleUpdateGroupImage = async () => {
    if (!group || newGroupImageUrl.trim() === group.groupImageUrl?.trim()) return;
    setIsUpdatingImage(true);
    try {
        const response = await fetch(`/api/groups?groupId=${group.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupImageUrl: newGroupImageUrl.trim() })
        });
        if (!response.ok) throw new Error('Failed to update group image.');
        const updatedGroup = await response.json();
        setGroup(prev => prev ? {...prev, groupImageUrl: updatedGroup.group.groupImageUrl} : null);
        toast({ title: "Success", description: "Group image updated." });
    } catch (error) {
        toast({ title: "Error", description: "Could not update group image.", variant: "destructive" });
    } finally {
        setIsUpdatingImage(false);
    }
};


  if (isAuthLoading || isLoadingGroup) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-8 w-1/4 mb-2" />
        <Skeleton className="h-10 w-1/2 mb-6" />
        <Card className="mb-6"><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Info className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Please Log In</h2>
        <p className="text-muted-foreground mb-4">You need to be logged in to view group details.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }
  
  if (!group) {
    return <div className="container mx-auto py-8 text-center"><p>Group not found or you do not have access.</p></div>;
  }

  return (
    <div className="container mx-auto py-2">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/groups">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
        </Link>
      </Button>

      <Card className="mb-6 shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary">
            <AvatarImage src={group.groupImageUrl || `https://placehold.co/128x128.png?text=${group.name.substring(0,2)}`} alt={group.name} data-ai-hint="group emblem" />
            <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl font-headline">{group.name}</CardTitle>
            <CardDescription>Group Code: <span className="font-mono text-primary">{group.groupCode}</span></CardDescription>
            <CardDescription>Created: {group.createdAt.toLocaleDateString()}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => setIsManageMembersOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> Manage Members ({group.studentIdentifiers?.length || 0})
            </Button>
            {/* Placeholder for Edit Group Details (like name, image URL) */}
             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><Settings className="mr-2 h-4 w-4" /> Group Settings</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Group Image URL</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="groupImageUrl">Image URL</Label>
                        <Input 
                            id="groupImageUrl" 
                            value={newGroupImageUrl} 
                            onChange={(e) => setNewGroupImageUrl(e.target.value)}
                            placeholder="https://example.com/image.png"
                        />
                         <p className="text-xs text-muted-foreground">Enter a direct link to an image (e.g., .png, .jpg).</p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateGroupImage} disabled={isUpdatingImage}>
                            {isUpdatingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Image URL
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Announcements Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Announcements</CardTitle>
          <CardDescription>Post updates or messages for your group members.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <Label htmlFor="announcement">New Announcement</Label>
            <Textarea
              id="announcement"
              placeholder="Type your announcement here..."
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              rows={3}
            />
            <Button onClick={handlePostAnnouncement} disabled={isPostingAnnouncement || !announcementContent.trim()} className="w-full sm:w-auto">
              {isPostingAnnouncement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" /> Post Announcement
            </Button>
          </div>

          <h3 className="text-lg font-semibold mb-3">Recent Announcements</h3>
          {group.announcements && group.announcements.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {group.announcements.map(ann => (
                <Card key={ann.id} className="bg-muted/50 p-4">
                  <p className="text-sm mb-1 whitespace-pre-wrap">{ann.content}</p>
                  <p className="text-xs text-muted-foreground">
                    By {ann.senderName === user?.displayName ? "You" : ann.senderName} - {formatDistanceToNow(new Date(ann.timestamp), { addSuffix: true })}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No announcements posted yet.</p>
          )}
        </CardContent>
      </Card>
      
      {group && (
        <ManageGroupMembersDialog
          group={group}
          isOpen={isManageMembersOpen}
          onClose={() => setIsManageMembersOpen(false)}
          onMembersUpdate={(updatedGroup) => {
            setGroup(g => g ? { ...g, studentIdentifiers: updatedGroup.studentIdentifiers } : null);
            setIsManageMembersOpen(false);
          }}
        />
      )}
    </div>
  );
}

