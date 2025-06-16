
"use client";

import React, { useState, useEffect } from "react";
import { UseFieldArrayReturn, UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Edit3 } from "lucide-react";
import type { Question, Option as OptionType } from "@/lib/types";
import type { TestBuilderFormValues } from "./test-builder-form";
import { cn } from "@/lib/utils";

interface QuestionFormProps {
  questionIndex: number;
  form: UseFormReturn<TestBuilderFormValues, any, undefined>;
  removeQuestion: (index: number) => void;
  initialCorrectOptionIdFromAI: string | null | undefined; 
}

export function QuestionForm({ questionIndex, form, removeQuestion, initialCorrectOptionIdFromAI }: QuestionFormProps) {
  const { register, control, watch, setValue, formState: { errors } } = form;
  const questionType = watch(`questions.${questionIndex}.type`);
  const questionId = watch(`questions.${questionIndex}.id`);
  const currentCorrectOptionId = watch(`questions.${questionIndex}.correctOptionId`);
  const options = watch(`questions.${questionIndex}.options`);

  // State to manage if the correct answer for an AI-preselected MCQ is being edited
  const [isEditingCorrectMcqAnswer, setIsEditingCorrectMcqAnswer] = useState(
    questionType === 'mcq' && !initialCorrectOptionIdFromAI 
  );

  useEffect(() => {
    // If question type changes from MCQ or initialCorrectOptionIdFromAI changes,
    // reset editing state for MCQs.
    // If it's an MCQ and initialCorrectOptionIdFromAI is null (meaning AI didn't match or it's manual),
    // then start in editing mode for correct answer.
    if (questionType === 'mcq') {
      setIsEditingCorrectMcqAnswer(!initialCorrectOptionIdFromAI);
    } else {
      setIsEditingCorrectMcqAnswer(false);
    }
  }, [questionType, initialCorrectOptionIdFromAI]);


  const {
    fields: mcqOptionFields,
    append: appendMcqOption,
    remove: removeMcqOption,
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options` as `questions.${number}.options`,
  });

  const handleTypeChange = (type: Question["type"]) => {
    setValue(`questions.${questionIndex}.type`, type);
    
    const existingCorrectAnswer = watch(`questions.${questionIndex}.correctAnswer`);
    const existingCorrectOptionId = watch(`questions.${questionIndex}.correctOptionId`);
    const currentOptions = watch(`questions.${questionIndex}.options`);

    if (type === 'mcq') {
      // Ensure options array exists and has at least 2 options for MCQs
      if (!currentOptions || currentOptions.length < 2) {
        const defaultOpts = [
          { id: `opt-${questionId}-${Date.now()}`, text: "" },
          { id: `opt-${questionId}-${Date.now()+1}`, text: "" }
        ];
        setValue(`questions.${questionIndex}.options`, defaultOpts);
        setValue(`questions.${questionIndex}.correctOptionId`, null); 
      } else {
         // Retain existing options. If a text correctAnswer was there, try to match.
         if (typeof existingCorrectAnswer === 'string' && existingCorrectAnswer && currentOptions.length > 0) {
            const matchedOption = currentOptions.find(opt => opt.text.toLowerCase() === existingCorrectAnswer.toLowerCase());
            setValue(`questions.${questionIndex}.correctOptionId`, matchedOption ? matchedOption.id : null);
         } else {
            // Otherwise, keep existing correctOptionId or null if it wasn't set
            setValue(`questions.${questionIndex}.correctOptionId`, existingCorrectOptionId || null);
         }
      }
      // Clear text-based correctAnswer for MCQs
      setValue(`questions.${questionIndex}.correctAnswer`, undefined);
      setIsEditingCorrectMcqAnswer(!watch(`questions.${questionIndex}.correctOptionId`));


    } else if (type === 'short-answer') {
      setValue(`questions.${questionIndex}.correctAnswer`, typeof existingCorrectAnswer === 'string' ? existingCorrectAnswer : "");
      setValue(`questions.${questionIndex}.options`, []); 
      setValue(`questions.${questionIndex}.correctOptionId`, null);
      setIsEditingCorrectMcqAnswer(false);
    } else if (type === 'true-false') {
      setValue(`questions.${questionIndex}.correctAnswer`, typeof existingCorrectAnswer === 'boolean' ? existingCorrectAnswer : true);
      setValue(`questions.${questionIndex}.options`, []);
      setValue(`questions.${questionIndex}.correctOptionId`, null);
      setIsEditingCorrectMcqAnswer(false);
    }
  };

  const addOption = () => {
    appendMcqOption({ id: `opt-${questionId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text: "" });
  };

  const removeOption = (optionIndex: number) => {
    if (mcqOptionFields[optionIndex]?.id === currentCorrectOptionId) {
      setValue(`questions.${questionIndex}.correctOptionId`, null);
    }
    removeMcqOption(optionIndex);
  };


  return (
    <Card className="mb-6 border-border shadow-md">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
        <CardTitle className="text-lg font-semibold">Question {questionIndex + 1}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => removeQuestion(questionIndex)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove Question</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-4">
        <div>
          <Label htmlFor={`questions.${questionIndex}.type`}>Question Type</Label>
          <Select
            value={questionType}
            onValueChange={(value) => handleTypeChange(value as Question["type"])}
          >
            <SelectTrigger id={`questions.${questionIndex}.type`}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
              <SelectItem value="short-answer">Short Answer</SelectItem>
              <SelectItem value="true-false">True/False</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`questions.${questionIndex}.text`}>Question Text</Label>
          <Textarea
            id={`questions.${questionIndex}.text`}
            placeholder="Enter the question text here..."
            {...register(`questions.${questionIndex}.text`)}
            className="min-h-[80px]"
          />
           {errors?.questions?.[questionIndex]?.text && (
            <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.text?.message}</p>
          )}
        </div>
        
        {questionType === "mcq" && (
          <div className="space-y-3">
            <Label>Options</Label>
            {isEditingCorrectMcqAnswer || !currentCorrectOptionId ? (
              <>
                <RadioGroup
                    value={currentCorrectOptionId || ""}
                    onValueChange={(value) => setValue(`questions.${questionIndex}.correctOptionId`, value)}
                >
                    {mcqOptionFields.map((optionField, optionIdx) => (
                    <div key={optionField.id} className="flex items-center gap-2">
                        <RadioGroupItem value={optionField.id} id={`${questionId}-opt-${optionField.id}-correct`} />
                        <Label htmlFor={`${questionId}-opt-${optionField.id}-correct`} className="sr-only">Mark option {optionIdx + 1} as correct</Label>
                        <Input
                        placeholder={`Option ${optionIdx + 1}`}
                        {...register(`questions.${questionIndex}.options.${optionIdx}.text`)}
                        className="flex-grow"
                        />
                        {mcqOptionFields.length > 2 && ( 
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIdx)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                        )}
                    </div>
                    ))}
                </RadioGroup>
                {errors?.questions?.[questionIndex]?.correctOptionId && (
                    <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.correctOptionId?.message}</p>
                )}
              </>
            ) : (
              <div className="space-y-2">
                {mcqOptionFields.map((optionField, optionIdx) => (
                  <div 
                    key={optionField.id} 
                    className={cn(
                        "flex items-center gap-2 p-2 border rounded-md",
                        optionField.id === currentCorrectOptionId ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : "bg-muted/30"
                    )}
                  >
                    <Input
                        placeholder={`Option ${optionIdx + 1}`}
                        {...register(`questions.${questionIndex}.options.${optionIdx}.text`)}
                        className={cn("flex-grow", optionField.id === currentCorrectOptionId ? "font-semibold text-green-700 dark:text-green-300" : "")}
                    />
                    {optionField.id === currentCorrectOptionId && <span className="text-xs text-green-700 dark:text-green-300">(Correct)</span>}
                     {mcqOptionFields.length > 2 && ( 
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIdx)} className="opacity-50 hover:opacity-100">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingCorrectMcqAnswer(true)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Change Correct Answer
                </Button>
              </div>
            )}

            {errors?.questions?.[questionIndex]?.options?.root?.message && (
                <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.options?.root?.message}</p>
            )}
            {errors?.questions?.[questionIndex]?.options?.message && (
                <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.options?.message}</p>
            )}
             {mcqOptionFields.forEach((_, optIdx) => {
                if (errors?.questions?.[questionIndex]?.options?.[optIdx]?.text) {
                    return <p key={`err-${optIdx}`} className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.options?.[optIdx]?.text?.message}</p>;
                }
                return null;
            })}

            {mcqOptionFields.length < 4 && ( 
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Option
              </Button>
            )}
          </div>
        )}

        {questionType === "short-answer" && (
          <div>
            <Label htmlFor={`questions.${questionIndex}.correctAnswer`}>Correct Answer</Label>
            <Input
              id={`questions.${questionIndex}.correctAnswer`}
              placeholder="Enter the correct answer"
              {...register(`questions.${questionIndex}.correctAnswer`)}
            />
            {errors?.questions?.[questionIndex]?.correctAnswer && (
                <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.correctAnswer?.message}</p>
            )}
          </div>
        )}

        {questionType === "true-false" && (
          <div>
            <Label>Correct Answer</Label>
            <RadioGroup
              value={String(watch(`questions.${questionIndex}.correctAnswer`))}
              onValueChange={(value) => {
                setValue(`questions.${questionIndex}.correctAnswer`, value === "true");
              }}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${questionId}-true`} />
                <Label htmlFor={`${questionId}-true`}>True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${questionId}-false`} />
                <Label htmlFor={`${questionId}-false`}>False</Label>
              </div>
            </RadioGroup>
             {errors?.questions?.[questionIndex]?.correctAnswer && (
                <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.correctAnswer?.message}</p>
            )}
          </div>
        )}
        
        <div>
          <Label htmlFor={`questions.${questionIndex}.points`}>Points</Label>
          <Input
            id={`questions.${questionIndex}.points`}
            type="number"
            min="0"
            placeholder="e.g., 10"
            {...register(`questions.${questionIndex}.points`, { valueAsNumber: true })}
          />
           {errors?.questions?.[questionIndex]?.points && (
            <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.points?.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
