
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TestBuilderFormValues, Question, MCQQuestion, ShortAnswerQuestion, TrueFalseQuestion, Option as OptionType } from './test-builder-form'; 
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';

interface TestPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  testData: TestBuilderFormValues;
}

const QuestionPreviewCard: React.FC<{ question: Question, index: number }> = ({ question, index }) => {
  return (
    <div className="p-4 border rounded-lg mb-4 shadow-sm bg-card">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-md text-card-foreground">
          Question {index + 1} <span className="text-xs text-muted-foreground">({question.type})</span>
        </h4>
        <Badge variant="secondary">{question.points} pts</Badge>
      </div>
      <p className="text-card-foreground mb-3 whitespace-pre-wrap">{question.text}</p>
      
      {question.type === 'mcq' && (
        <ul className="space-y-2 text-sm">
          {(question as MCQQuestion).options.map((option: OptionType) => (
            <li key={option.id} className={`flex items-center p-2 rounded-md border ${
              option.id === (question as MCQQuestion).correctOptionId ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border'
            }`}>
              {option.id === (question as MCQQuestion).correctOptionId && <CheckCircle className="h-4 w-4 mr-2 text-primary" />}
              {option.text}
            </li>
          ))}
        </ul>
      )}

      {question.type === 'short-answer' && (
        <div className="text-sm mt-2">
          <p className="font-medium text-primary">Correct Answer:</p>
          <p className="p-2 border rounded-md bg-muted whitespace-pre-wrap">{(question as ShortAnswerQuestion).correctAnswer}</p>
        </div>
      )}

      {question.type === 'true-false' && (
        <div className="text-sm mt-2">
          <p className="font-medium text-primary">Correct Answer:</p>
           <p className="p-2 border rounded-md bg-muted">{(question as TrueFalseQuestion).correctAnswer ? "True" : "False"}</p>
        </div>
      )}
    </div>
  );
};


export default function TestPreviewDialog({ isOpen, onClose, testData }: TestPreviewDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Test Preview: {testData.title}</DialogTitle>
          <DialogDescription>
            Subject: {testData.subject} | Duration: {testData.duration} mins | Published: {testData.published ? "Yes" : "No"}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow my-4 pr-2">
          <div className="space-y-4">
            {testData.questions.map((q, index) => (
              <QuestionPreviewCard key={q.id || `q-preview-${index}`} question={q} index={index} />
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button onClick={onClose} variant="outline">Close Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
