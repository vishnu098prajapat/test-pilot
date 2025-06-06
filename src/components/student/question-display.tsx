"use client";

import React from 'react';
import type { Question, Option as OptionType, StudentAnswer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // For short answer if preferred over textarea

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  currentAnswer: any; // Can be string for short answer, optionId for MCQ, boolean for T/F
  onAnswerChange: (questionId: string, answer: any) => void;
  isReviewMode?: boolean; // If true, disable inputs and show correct answers
  studentAttempt?: StudentAnswer; // Student's answer during review
  isCorrect?: boolean; // If the student's answer was correct in review mode
}

export default function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
  isReviewMode = false,
  studentAttempt,
  isCorrect
}: QuestionDisplayProps) {
  
  const handleMcqChange = (value: string) => {
    if (!isReviewMode) onAnswerChange(question.id, value);
  };

  const handleShortAnswerChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!isReviewMode) onAnswerChange(question.id, event.target.value);
  };

  const handleTrueFalseChange = (value: string) => {
    if (!isReviewMode) onAnswerChange(question.id, value === 'true');
  };

  let reviewAnswerDisplay = null;
  if (isReviewMode && studentAttempt) {
    if (question.type === 'mcq') {
      const studentSelectedOption = question.options.find(opt => opt.id === studentAttempt.answer);
      const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
      reviewAnswerDisplay = (
        <>
          <p>Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{studentSelectedOption?.text || 'Not answered'}</span></p>
          {!isCorrect && <p>Correct answer: <span className="text-green-600">{correctOption?.text}</span></p>}
        </>
      );
    } else if (question.type === 'short-answer') {
       reviewAnswerDisplay = (
        <>
          <p>Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{studentAttempt.answer || 'Not answered'}</span></p>
          {!isCorrect && <p>Correct answer: <span className="text-green-600">{question.correctAnswer}</span></p>}
        </>
      );
    } else if (question.type === 'true-false') {
       reviewAnswerDisplay = (
        <>
          <p>Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{studentAttempt.answer === undefined ? 'Not answered' : studentAttempt.answer ? 'True' : 'False'}</span></p>
          {!isCorrect && <p>Correct answer: <span className="text-green-600">{question.correctAnswer ? 'True' : 'False'}</span></p>}
        </>
      );
    }
  }


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl md:text-2xl font-headline">Question {questionNumber} of {totalQuestions}</CardTitle>
          <Badge variant="secondary" className="text-sm">{question.points} Points</Badge>
        </div>
        <CardDescription className="pt-4 text-base md:text-lg">{question.text}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {question.type === 'mcq' && (
          <RadioGroup
            value={currentAnswer as string || ""}
            onValueChange={handleMcqChange}
            disabled={isReviewMode}
            className="space-y-3"
          >
            {question.options.map((option) => (
              <Label
                key={option.id}
                htmlFor={`${question.id}-${option.id}`}
                className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-colors hover:bg-accent/50
                  ${isReviewMode && option.id === question.correctOptionId ? 'border-green-500 bg-green-500/10' : ''}
                  ${isReviewMode && option.id === studentAttempt?.answer && option.id !== question.correctOptionId ? 'border-red-500 bg-red-500/10' : ''}
                  ${currentAnswer === option.id && !isReviewMode ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} disabled={isReviewMode} />
                <span>{option.text}</span>
              </Label>
            ))}
          </RadioGroup>
        )}

        {question.type === 'short-answer' && (
          <div>
            <Label htmlFor={`${question.id}-shortanswer`} className="mb-2 block">Your Answer:</Label>
            <Textarea
              id={`${question.id}-shortanswer`}
              value={currentAnswer as string || ""}
              onChange={handleShortAnswerChange}
              placeholder="Type your answer here..."
              rows={4}
              disabled={isReviewMode}
              className={isReviewMode ? 'bg-muted' : ''}
            />
          </div>
        )}

        {question.type === 'true-false' && (
          <RadioGroup
            value={(currentAnswer !== undefined && currentAnswer !== null) ? String(currentAnswer) : ""}
            onValueChange={handleTrueFalseChange}
            disabled={isReviewMode}
            className="space-y-3"
          >
            {[ {label: "True", value: "true"}, {label: "False", value: "false"} ].map((option) => (
               <Label
                key={option.value}
                htmlFor={`${question.id}-${option.value}`}
                className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-colors hover:bg-accent/50
                  ${isReviewMode && String(question.correctAnswer) === option.value ? 'border-green-500 bg-green-500/10' : ''}
                  ${isReviewMode && String(studentAttempt?.answer) === option.value && String(studentAttempt?.answer) !== String(question.correctAnswer) ? 'border-red-500 bg-red-500/10' : ''}
                  ${String(currentAnswer) === option.value && !isReviewMode ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} disabled={isReviewMode} />
                <span>{option.label}</span>
              </Label>
            ))}
          </RadioGroup>
        )}
        {isReviewMode && reviewAnswerDisplay && (
          <div className="mt-4 p-3 border rounded-md bg-muted/50 text-sm">
            <h4 className="font-semibold mb-1">Review:</h4>
            {reviewAnswerDisplay}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
