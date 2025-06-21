
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Test } from '@/lib/types';
import { updateTest } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Loader2 } from 'lucide-react';

interface AssignTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  allTeacherTests: Test[];
  onTestAssigned: (updatedTest: Test) => void;
}

export default function AssignTestDialog({ isOpen, onClose, groupId, allTeacherTests, onTestAssigned }: AssignTestDialogProps) {
  const { toast } = useToast();
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  const unassignedTests = allTeacherTests.filter(test => !test.batchId);

  const handleAssignTest = async (testId: string) => {
    setIsAssigning(testId);
    try {
      const updatedTest = await updateTest(testId, { batchId: groupId });
      if (updatedTest) {
        toast({ title: "Success", description: `"${updatedTest.title}" has been assigned.` });
        onTestAssigned(updatedTest);
        if (unassignedTests.length <= 1) {
          onClose();
        }
      } else {
        throw new Error("Failed to update the test.");
      }
    } catch (error) {
      console.error("Failed to assign test:", error);
      toast({ title: "Assignment Failed", description: "Could not assign the test.", variant: "destructive" });
    } finally {
      setIsAssigning(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign a Test to this Group</DialogTitle>
          <DialogDescription>
            Choose from your list of unassigned tests below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] my-4">
          <div className="pr-4 space-y-2">
            {unassignedTests.length > 0 ? (
              unassignedTests.map(test => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-semibold">{test.title}</p>
                    <p className="text-xs text-muted-foreground">{test.subject} - {test.questions.length} questions</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignTest(test.id)}
                    disabled={isAssigning !== null}
                  >
                    {isAssigning === test.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                All of your tests have been assigned to a group.
              </p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
