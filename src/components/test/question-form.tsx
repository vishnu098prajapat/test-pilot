
"use client";

import React, { useState, useEffect } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Question, Option as OptionType, MCQQuestion, ShortAnswerQuestion, TrueFalseQuestion } from "@/lib/types";
import type { TestBuilderFormValues } from "./test-builder-form";

interface QuestionFormProps {
  questionIndex: number;
  form: UseFormReturn<TestBuilderFormValues, any, undefined>;
  removeQuestion: (index: number) => void;
  // Removed initialCorrectOptionIdFromAI as it's handled by form.watch and defaultValues
}

export function QuestionForm({ questionIndex, form, removeQuestion }: QuestionFormProps) {
  const { register, control, watch, setValue, formState: { errors } } = form;
  const question = watch(`questions.${questionIndex}`);
  const questionType = question.type;
  const questionId = question.id; 
  const currentCorrectOptionId = watch(`questions.${questionIndex}.correctOptionId`);


  const {
    fields: mcqOptionFields,
    append: appendMcqOption,
    remove: removeMcqOption,
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options` as `questions.${number}.options`,
  });

  const handleTypeChange = (type: Question["type"]) => {
    const currentQuestionData = watch(`questions.${questionIndex}`);
    const newId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    setValue(`questions.${questionIndex}.type`, type);
    setValue(`questions.${questionIndex}.id`, newId); 

    if (type === 'mcq') {
      const existingOptions = (currentQuestionData as MCQQuestion).options;
      if (!existingOptions || existingOptions.length < 2) {
        setValue(`questions.${questionIndex}.options`, [
          { id: `opt-${newId}-${Date.now()}`, text: "" },
          { id: `opt-${newId}-${Date.now()+1}`, text: "" }
        ]);
      } else {
         setValue(`questions.${questionIndex}.options`, existingOptions.map((opt, i) => ({ ...opt, id: `opt-${newId}-${Date.now()+i}` })));
      }
      // Ensure correctOptionId is set (or null if no options match AI's textual answer)
      // The transformAIQuestionsToTestBuilderFormat function handles initial setting of correctOptionId
      // If AI provides correctAnswer (text), that function tries to find matching option and set correctOptionId.
      // If not found, correctOptionId remains null, and user must select one.
      setValue(`questions.${questionIndex}.correctOptionId`, (currentQuestionData as MCQQuestion).correctOptionId || null);
      // We don't clear `correctAnswer` (text from AI) here as it might be used by `transformAIQuestionsToTestBuilderFormat` for initial load
    } else if (type === 'short-answer') {
      setValue(`questions.${questionIndex}.correctAnswer`, typeof (currentQuestionData as ShortAnswerQuestion).correctAnswer === 'string' ? (currentQuestionData as ShortAnswerQuestion).correctAnswer : "");
      setValue(`questions.${questionIndex}.options`, []); 
      setValue(`questions.${questionIndex}.correctOptionId`, null);
    } else if (type === 'true-false') {
      setValue(`questions.${questionIndex}.correctAnswer`, typeof (currentQuestionData as TrueFalseQuestion).correctAnswer === 'boolean' ? (currentQuestionData as TrueFalseQuestion).correctAnswer : true);
      setValue(`questions.${questionIndex}.options`, []);
      setValue(`questions.${questionIndex}.correctOptionId`, null);
    }
  };

  const addOption = () => {
    appendMcqOption({ id: `opt-${questionId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text: "" });
  };

  const removeOption = (optionIndex: number) => {
    const optionIdToRemove = mcqOptionFields[optionIndex]?.id;
    if (optionIdToRemove === currentCorrectOptionId) {
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
            <Label>Options & Correct Answer</Label>
            <RadioGroup
                // The `value` is controlled by `correctOptionId` which is set by the transform function or user selection
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
            
            {/* Validation Messages */}
            {errors?.questions?.[questionIndex]?.correctOptionId && (
                <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.correctOptionId?.message}</p>
            )}
            {errors?.questions?.[questionIndex]?.options?.root?.message && (
                <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.options?.root?.message}</p>
            )}
            {errors?.questions?.[questionIndex]?.options?.message && (
                <p className="text-sm text-destructive mt-1">{errors.questions[questionIndex]?.options?.message}</p>
            )}
             {mcqOptionFields.map((_, optIdx) => {
                const error = errors?.questions?.[questionIndex]?.options?.[optIdx]?.text;
                if (error) {
                    return <p key={`err-${optIdx}`} className="text-sm text-destructive mt-1">{error.message}</p>;
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
                <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
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
                <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
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
