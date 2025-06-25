
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface JoinGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupJoined: () => void;
}

const joinGroupSchema = z.object({
  groupCode: z.string().min(6, "Code must be 6 characters.").max(6, "Code must be 6 characters."),
});

type JoinGroupFormValues = z.infer<typeof joinGroupSchema>;

export default function JoinGroupDialog({ isOpen, onClose, onGroupJoined }: JoinGroupDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<JoinGroupFormValues>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      groupCode: "",
    },
  });
  
  useEffect(() => {
    const codeFromUrl = searchParams.get('join_code');
    if (codeFromUrl) {
      form.setValue('groupCode', codeFromUrl.toUpperCase());
    }
  }, [searchParams, form, isOpen]);


  const handleJoinGroup = async (data: JoinGroupFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to join a group.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupCode: data.groupCode.trim(), studentIdentifier: user.displayName }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: "Success!", description: result.message });
        onGroupJoined();
        onClose();
        form.reset();
      } else {
        throw new Error(result.message || "Failed to join group.");
      }

    } catch (error: any) {
      console.error("Join group error:", error);
      toast({ title: "Error Joining Group", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a New Group</DialogTitle>
          <DialogDescription>
            Enter the 6-character code from your teacher to join their group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleJoinGroup)} className="space-y-4">
            <FormField
              control={form.control}
              name="groupCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="XXXXXX"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="text-center text-lg tracking-[0.3em]"
                      autoCapitalize="characters"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Joining..." : "Join Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
