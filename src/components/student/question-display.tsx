
"use client";

import React from 'react';
import type { Question, Option as OptionType, StudentAnswer, MCQQuestion, ShortAnswerQuestion, TrueFalseQuestion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; 
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  currentAnswer: any; 
  onAnswerChange: (questionId: string, answer: any) => void;
  isReviewMode?: boolean; 
  studentAttempt?: StudentAnswer; 
  isCorrect?: boolean; 
}

export default function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
  isReviewMode = false,
  studentAttempt, // This will be the student's actual recorded answer object for this question
  isCorrect // This directly tells if studentAttempt was correct for the overall question
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

  // This section is for displaying feedback in review mode
  let reviewFeedbackDisplay = null;
  if (isReviewMode && studentAttempt) {
    let studentAnswerText = "Not Answered";
    let correctAnswerText = "";
    const qIsCorrect = studentAttempt.isCorrect; // Use the isCorrect from the processed studentAttempt

    if (question.type === 'mcq') {
      const mcqQuestion = question as MCQQuestion;
      const studentSelectedOption = mcqQuestion.options.find(opt => opt.id === studentAttempt.answer);
      studentAnswerText = studentSelectedOption ? studentSelectedOption.text : "Not Answered";
      const correctOption = mcqQuestion.options.find(opt => opt.id === mcqQuestion.correctOptionId);
      correctAnswerText = correctOption ? correctOption.text : "N/A";
    } else if (question.type === 'short-answer') {
      const saQuestion = question as ShortAnswerQuestion;
      studentAnswerText = studentAttempt.answer ? String(studentAttempt.answer) : "Not Answered";
      correctAnswerText = String(saQuestion.correctAnswer);
    } else if (question.type === 'true-false') {
      const tfQuestion = question as TrueFalseQuestion;
      studentAnswerText = studentAttempt.answer === undefined ? "Not Answered" : (studentAttempt.answer ? "True" : "False");
      correctAnswerText = tfQuestion.correctAnswer ? "True" : "False";
    }

    reviewFeedbackDisplay = (
      <div className={`mt-4 p-3 border rounded-md text-sm ${qIsCorrect ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
        <h4 className="font-semibold mb-2 flex items-center">
          {qIsCorrect ? <CheckCircle className="h-5 w-5 mr-2 text-green-700" /> : <XCircle className="h-5 w-5 mr-2 text-red-700" />}
          Your Answer: <span className={`ml-1 font-medium ${qIsCorrect ? 'text-green-700' : 'text-red-700'}`}>{studentAnswerText}</span>
        </h4>
        {!qIsCorrect && (
          <p>Correct Answer: <span className="font-medium text-green-700">{correctAnswerText}</span></p>
        )}
      </div>
    );
  }


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl md:text-2xl font-headline">Question {questionNumber} <span className="text-base md:text-lg text-muted-foreground">of {totalQuestions}</span></CardTitle>
          <Badge variant="secondary" className="text-sm">{question.points} Points</Badge>
        </div>
        <CardDescription className="pt-4 text-base md:text-lg">{question.text}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {question.type === 'mcq' && (
          <RadioGroup
            value={currentAnswer as string || ""} // currentAnswer for live mode, studentAttempt.answer for review
            onValueChange={handleMcqChange}
            disabled={isReviewMode}
            className="space-y-3"
          >
            {(question as MCQQuestion).options.map((option) => {
              let optionStyle = 'border-border';
              if (isReviewMode) {
                if (option.id === (question as MCQQuestion).correctOptionId) {
                  optionStyle = 'border-green-500 bg-green-500/10 text-green-700 font-medium';
                }
                if (option.id === studentAttempt?.answer && !(studentAttempt?.isCorrect)) {
                  optionStyle = 'border-red-500 bg-red-500/10 text-red-700';
                }
                 if (option.id === studentAttempt?.answer && studentAttempt?.isCorrect) {
                  // If student's answer is correct, green border is already applied by correctOptionId match
                  // No need for specific red styling here if it's correct
                }
              } else if (currentAnswer === option.id) {
                 optionStyle = 'border-primary bg-primary/10';
              }

              return (
                <Label
                  key={option.id}
                  htmlFor={`${question.id}-${option.id}`}
                  className={`flex items-start space-x-3 p-4 border rounded-md cursor-pointer transition-colors hover:bg-accent/50 ${optionStyle}`} // Changed items-center to items-start
                >
                  <RadioGroupItem 
                    value={option.id} 
                    id={`${question.id}-${option.id}`} 
                    disabled={isReviewMode} 
                    checked={isReviewMode ? (studentAttempt?.answer === option.id) : (currentAnswer === option.id)}
                    aria-label={option.text}
                    className="mt-1" // Align radio button slightly with the start of the text
                  />
                  <span className="flex-1">{option.text}</span> {/* Ensure span can take space and wrap */}
                </Label>
              );
            })}
          </RadioGroup>
        )}

        {question.type === 'short-answer' && (
          <div>
            <Label htmlFor={`${question.id}-shortanswer`} className="mb-2 block">Your Answer:</Label>
            <Textarea
              id={`${question.id}-shortanswer`}
              value={isReviewMode ? (studentAttempt?.answer as string || "") : (currentAnswer as string || "")}
              onChange={handleShortAnswerChange}
              placeholder="Type your answer here..."
              rows={4}
              disabled={isReviewMode}
              className={isReviewMode ? `bg-muted ${studentAttempt?.isCorrect ? 'border-green-500' : 'border-red-500'}` : ''}
            />
          </div>
        )}

        {question.type === 'true-false' && (
          <RadioGroup
            value={isReviewMode ? String(studentAttempt?.answer) : (currentAnswer !== undefined && currentAnswer !== null) ? String(currentAnswer) : ""}
            onValueChange={handleTrueFalseChange}
            disabled={isReviewMode}
            className="space-y-3"
          >
            {[ {label: "True", value: "true"}, {label: "False", value: "false"} ].map((option) => {
              let optionStyle = 'border-border';
               if (isReviewMode) {
                const qCorrectAnswerStr = String((question as TrueFalseQuestion).correctAnswer);
                if (option.value === qCorrectAnswerStr) { // This option is the correct answer
                  optionStyle = 'border-green-500 bg-green-500/10 text-green-700 font-medium';
                }
                if (String(studentAttempt?.answer) === option.value && !(studentAttempt?.isCorrect)) { // Student picked this, and it was wrong
                  optionStyle = 'border-red-500 bg-red-500/10 text-red-700';
                }
              } else if (String(currentAnswer) === option.value) {
                 optionStyle = 'border-primary bg-primary/10';
              }

              return (
               <Label
                key={option.value}
                htmlFor={`${question.id}-${option.value}`}
                className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-colors hover:bg-accent/50 ${optionStyle}`} // items-center is fine for T/F
              >
                <RadioGroupItem 
                  value={option.value} 
                  id={`${question.id}-${option.value}`} 
                  disabled={isReviewMode}
                  checked={isReviewMode ? (String(studentAttempt?.answer) === option.value) : (String(currentAnswer) === option.value)}
                  aria-label={option.label}
                />
                <span>{option.label}</span>
              </Label>
              );
            })}
          </RadioGroup>
        )}
        {isReviewMode && reviewFeedbackDisplay}
      </CardContent>
    </Card>
  );
}
