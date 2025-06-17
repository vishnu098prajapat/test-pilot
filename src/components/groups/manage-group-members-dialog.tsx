
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Group } from '@/lib/types';
import { Loader2, UserPlus, Trash2, Users, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ManageGroupMembersDialogProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onMembersUpdate: (updatedGroup: Group) => void;
}

const addStudentSchema = z.object({
  studentIdentifier: z.string().min(1, "Student name/identifier cannot be empty.").max(100, "Name too long."),
});
type AddStudentFormValues = z.infer<typeof addStudentSchema>;

export default function ManageGroupMembersDialog({ group, isOpen, onClose, onMembersUpdate }: ManageGroupMembersDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMembers, setCurrentMembers] = useState<string[]>([]);

  const form = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: { studentIdentifier: '' },
  });

  useEffect(() => {
    if (group) {
      setCurrentMembers([...group.studentIdentifiers]); // Make a mutable copy
      form.reset({ studentIdentifier: '' }); // Reset add student form
    }
  }, [group, form, isOpen]); // Re-run when dialog opens or group changes


  const handleAddStudent = (data: AddStudentFormValues) => {
    if (!group) return;
    const newIdentifier = data.studentIdentifier.trim();
    if (newIdentifier && !currentMembers.includes(newIdentifier)) {
      setCurrentMembers(prev => [...prev, newIdentifier]);
      form.reset(); // Clear input after adding
    } else if (currentMembers.includes(newIdentifier)) {
      toast({ title: "Duplicate", description: "This student identifier is already in the group.", variant: "default", duration: 2000 });
    }
  };

  const handleRemoveStudent = (identifierToRemove: string) => {
    setCurrentMembers(prev => prev.filter(id => id !== identifierToRemove));
  };

  const handleSaveChanges = async () => {
    if (!group) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/groups?groupId=${group.id}`, { // Using groupId in query for PUT
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIdentifiers: currentMembers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update group members');
      }
      const result = await response.json();
      toast({ title: "Success", description: `Members for group "${group.name}" updated!` });
      onMembersUpdate(result.group); // Pass the updated group back
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update members.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Users className="mr-2 h-6 w-6 text-primary" /> Manage Members: {group.name}
          </DialogTitle>
          <DialogDescription>
            Add or remove student identifiers for this group. Current count: <Badge variant="secondary">{currentMembers.length}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddStudent)} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="studentIdentifier"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <Label htmlFor="studentIdentifier" className="sr-only">Student Name/Identifier</Label>
                    <FormControl>
                      <Input id="studentIdentifier" placeholder="Enter student name or ID" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs"/>
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm" className="mt-0.5"> {/* Adjusted margin */}
                <UserPlus className="mr-2 h-4 w-4" /> Add
              </Button>
            </form>
          </Form>

          {currentMembers.length === 0 ? (
             <div className="text-center text-muted-foreground py-4 border rounded-md bg-muted/30">
                <Info className="mx-auto h-8 w-8 mb-2 text-muted-foreground/70" />
                No students added to this group yet.
            </div>
          ) : (
            <ScrollArea className="h-60 border rounded-md p-1">
              <div className="space-y-2 p-3">
              {currentMembers.map((identifier, index) => (
                <div key={`${identifier}-${index}`} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md text-sm">
                  <span>{identifier}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveStudent(identifier)}
                    title={`Remove ${identifier}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSaveChanges} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
