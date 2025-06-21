
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Test, Batch as Group } from '@/lib/types';
import { updateTest } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AssignTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  test: Test | null;
  groups: Group[];
  onTestAssigned: (updatedTest: Test) => void;
}

export default function AssignTestToGroupDialog({ isOpen, onClose, test, groups, onTestAssigned }: AssignTestDialogProps) {
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(test?.batchId || null);
  const [isAssigning, setIsAssigning] = useState(false);

  React.useEffect(() => {
    if (test) {
      setSelectedGroupId(test.batchId || null);
    }
  }, [test]);

  if (!test) return null;

  const handleAssign = async () => {
    if (!selectedGroupId) {
      toast({ title: "No Group Selected", description: "Please select a group to assign the test to.", variant: "destructive" });
      return;
    }
    setIsAssigning(true);
    try {
      const updatedTest = await updateTest(test.id, { batchId: selectedGroupId });
      if (updatedTest) {
        toast({ title: "Success", description: `"${test.title}" assigned successfully.` });
        onTestAssigned(updatedTest);
        onClose();
      } else {
        throw new Error("Failed to update test with group assignment.");
      }
    } catch (error) {
      console.error("Failed to assign test:", error);
      toast({ title: "Assignment Failed", description: "Could not assign the test to the group.", variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleUnassign = async () => {
    setIsAssigning(true);
    try {
        // Here we explicitly set batchId to undefined to "unassign" it
        const success = await updateTest(test.id, { batchId: undefined });
        if (success) {
            toast({ title: "Success", description: "Test has been unassigned." });
            // Create a version of the test with batchId removed for immediate UI update
            const { batchId, ...restOfTest } = test;
            onTestAssigned(restOfTest as Test); // We cast because we know batchId is gone
            onClose();
        } else {
            throw new Error("Failed to unassign the test.");
        }
    } catch (error) {
        console.error("Failed to unassign test:", error);
        toast({ title: "Error", description: "Could not unassign the test.", variant: "destructive" });
    } finally {
        setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isAssigning) onClose()}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign &quot;{test.title}&quot;</DialogTitle>
          <DialogDescription>
            Select a group to assign this test to. Already assigned tests can be reassigned or unassigned.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh] my-4">
          <RadioGroup value={selectedGroupId || ""} onValueChange={setSelectedGroupId} className="pr-4 space-y-2">
            {groups.length > 0 ? (
              groups.map(group => (
                <Label key={group.id} htmlFor={group.id} className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <div>
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.studentIdentifiers.length} student(s)</p>
                  </div>
                  <RadioGroupItem value={group.id} id={group.id} />
                </Label>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No groups found. Create a group first from the 'Groups' page.
              </p>
            )}
          </RadioGroup>
        </ScrollArea>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full">
          {test.batchId && (
            <Button type="button" variant="destructive" onClick={handleUnassign} disabled={isAssigning}>
                {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Unassign from current group
            </Button>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isAssigning}>Cancel</Button>
            <Button type="button" onClick={handleAssign} disabled={isAssigning || !selectedGroupId || selectedGroupId === test.batchId}>
              {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assign to Group
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

