
"use client";

import React from "react";
import { UseFieldArrayReturn, UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Question, Option as OptionType } from "@/lib/types";
import type { TestBuilderFormValues } from "./test-builder-form";

interface QuestionFormProps {
  questionIndex: number;
  form: UseFormReturn<TestBuilderFormValues, any, undefined>;
  removeQuestion: (index: number) => void;
}

export function QuestionForm({ questionIndex, form, removeQuestion }: QuestionFormProps) {
  const { register, control, watch, setValue } = form;
  const questionType = watch(`questions.${questionIndex}.type`);
  
  const questionIdFromWatch = watch(`questions.${questionIndex}.id`);
  const isAiQuestion = typeof questionIdFromWatch === 'string' && questionIdFromWatch.startsWith('ai-q-');

  console.log(`QuestionForm Render [Q Index: ${questionIndex}]: ID: "${questionIdFromWatch}", Type: ${questionType}, Is AI Question: ${isAiQuestion}`);

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
    const currentQuestionId = watch(`questions.${questionIndex}.id`);
    // const isCurrentAi = typeof currentQuestionId === 'string' && currentQuestionId.startsWith('ai-q-');
    // For AI questions, we trust the initial structure from AI.
    // For manual changes, we adjust.
    
    if (type === 'mcq') {
      const existingOptions = watch(`questions.${questionIndex}.options`);
      // Only add default options if not an AI question with existing options or if options are empty
      if (!isAiQuestion || !existingOptions || existingOptions.length === 0) {
        setValue(`questions.${questionIndex}.options`, [{ id: `opt-${Date.now()}`, text: "" }, { id: `opt-${Date.now()+1}`, text: "" }]);
        setValue(`questions.${questionIndex}.correctOptionId`, null);
      }
    } else if (type === 'short-answer') {
      // If not an AI question with a pre-filled answer, set to empty string
      if (!isAiQuestion || watch(`questions.${questionIndex}.correctAnswer`) === undefined) {
         setValue(`questions.${questionIndex}.correctAnswer`, "");
      }
      setValue(`questions.${questionIndex}.options`, []); 
    } else if (type === 'true-false') {
      // If not an AI question with a pre-filled answer, set to true (or any default)
       if (!isAiQuestion || watch(`questions.${questionIndex}.correctAnswer`) === undefined) { 
        setValue(`questions.${questionIndex}.correctAnswer`, true);
       }
      setValue(`questions.${questionIndex}.options`, []);
    }
  };

  const addOption = () => {
    appendMcqOption({ id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text: "" });
  };

  const removeOption = (optionIndex: number) => {
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
           {form.formState.errors?.questions?.[questionIndex]?.text && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.questions[questionIndex]?.text?.message}</p>
          )}
        </div>
        
        {questionType === "mcq" && (
          isAiQuestion ? (
            <div className="space-y-2">
              <Label>Options (AI Generated - Correct Answer Pre-selected)</Label>
              {mcqOptionFields.map((optionField, optionIdx) => {
                const isCorrectAiSelected = optionField.id === watch(`questions.${questionIndex}.correctOptionId`);
                return (
                  <div 
                    key={optionField.id} 
                    className={`flex items-center justify-between gap-2 p-2 border rounded-md min-h-[2.5rem]
                                ${isCorrectAiSelected ? 'bg-green-100 dark:bg-green-900/30 border-green-500' : 'bg-muted/40'}`}
                  >
                    <span className="flex-grow text-sm">{optionField.text}</span>
                    {isCorrectAiSelected && (
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">(AI Selected - Correct)</span>
                    )}
                  </div>
                );
              })}
              {form.formState.errors?.questions?.[questionIndex]?.correctOptionId && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.questions[questionIndex]?.correctOptionId?.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Options & Correct Answer</Label>
              {mcqOptionFields.map((optionField, optionIdx) => (
                <div key={optionField.id} className="flex items-center gap-2">
                  <RadioGroup
                      value={watch(`questions.${questionIndex}.correctOptionId`) || ""}
                      onValueChange={(value) => setValue(`questions.${questionIndex}.correctOptionId`, value)}
                      className="flex items-center"
                  >
                      <RadioGroupItem value={optionField.id} id={`${questionIndex}-opt-${optionIdx}-correct`} />
                  </RadioGroup>
                  <Label htmlFor={`${questionIndex}-opt-${optionIdx}-correct`} className="sr-only">Mark as correct</Label>
                  <Input
                    placeholder={`Option ${optionIdx + 1}`}
                    {...register(`questions.${questionIndex}.options.${optionIdx}.text`)}
                    defaultValue={optionField.text}
                    className="flex-grow"
                  />
                  {mcqOptionFields.length > 1 && (
                     <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIdx)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
               {form.formState.errors?.questions?.[questionIndex]?.options && (
                  <p className="text-sm text-destructive mt-1">Each option text is required, and at least two options are needed.</p>
              )}
               {form.formState.errors?.questions?.[questionIndex]?.correctOptionId && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.questions[questionIndex]?.correctOptionId?.message}</p>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Option
              </Button>
            </div>
          )
        )}


        {questionType === "short-answer" && (
          <div>
            <Label htmlFor={`questions.${questionIndex}.correctAnswer`}>Correct Answer</Label>
            <Input
              id={`questions.${questionIndex}.correctAnswer`}
              placeholder="Enter the correct answer"
              {...register(`questions.${questionIndex}.correctAnswer`)}
            />
            {form.formState.errors?.questions?.[questionIndex]?.correctAnswer && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.questions[questionIndex]?.correctAnswer?.message}</p>
            )}
          </div>
        )}

        {questionType === "true-false" && (
          <div>
            <Label>Correct Answer</Label>
            <RadioGroup
              value={String(watch(`questions.${questionIndex}.correctAnswer`))}
              onValueChange={(value) => setValue(`questions.${questionIndex}.correctAnswer`, value === "true")}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${questionIndex}-true`} />
                <Label htmlFor={`${questionIndex}-true`}>True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${questionIndex}-false`} />
                <Label htmlFor={`${questionIndex}-false`}>False</Label>
              </div>
            </RadioGroup>
             {form.formState.errors?.questions?.[questionIndex]?.correctAnswer && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.questions[questionIndex]?.correctAnswer?.message}</p>
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
           {form.formState.errors?.questions?.[questionIndex]?.points && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.questions[questionIndex]?.points?.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
