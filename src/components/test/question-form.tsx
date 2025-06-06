"use client";

import React from "react";
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, GripVertical } from "lucide-react";
import type { Question, Option as OptionType } from "@/lib/types"; // Assuming TestBuilderFormValues is defined elsewhere
import type { TestBuilderFormValues } from "./test-builder-form"; // Import the main form type

interface QuestionFormProps {
  questionIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TestBuilderFormValues, any, undefined>; // Use the main form's type
  removeQuestion: (index: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optionsFieldArray?: UseFieldArrayReturn<TestBuilderFormValues, `questions.${number}.options`, "id">;
}

export function QuestionForm({ questionIndex, form, removeQuestion }: QuestionFormProps) {
  const { register, control, watch, setValue } = form;
  const question = watch(`questions.${questionIndex}`);
  const questionType = watch(`questions.${questionIndex}.type`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { fields: mcqOptions, append: appendMcqOption, remove: removeMcqOption } = form.control.register(`questions.${questionIndex}.options` as any) ? 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.control.fieldsRef.current[`questions.${questionIndex}.options` as any] as any : { fields: [], append: () => {}, remove: () => {} };


  const handleTypeChange = (type: Question["type"]) => {
    setValue(`questions.${questionIndex}.type`, type);
    // Reset specific fields when type changes
    if (type === 'mcq') {
      setValue(`questions.${questionIndex}.options`, [{ id: `opt-${Date.now()}`, text: "" }]);
      setValue(`questions.${questionIndex}.correctOptionId`, null);
    } else if (type === 'short-answer') {
      setValue(`questions.${questionIndex}.correctAnswer`, "");
    } else if (type === 'true-false') {
      setValue(`questions.${questionIndex}.correctAnswer`, true);
    }
  };

  const addOption = () => {
    const currentOptions = watch(`questions.${questionIndex}.options`) || [];
    setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      { id: `opt-${Date.now()}-${Math.random()}`, text: "" }
    ]);
  };

  const removeOption = (optionIndex: number) => {
     const currentOptions = watch(`questions.${questionIndex}.options`);
     if (currentOptions) {
        const newOptions = currentOptions.filter((_,idx) => idx !== optionIndex);
        setValue(`questions.${questionIndex}.options`, newOptions);
     }
  };


  return (
    <Card className="mb-6 border-border shadow-md">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
        <CardTitle className="text-lg font-semibold">Question {questionIndex + 1}</CardTitle>
        <div className="flex items-center gap-2">
           {/* <Button type="button" variant="ghost" size="icon" className="cursor-grab">
            <GripVertical className="h-5 w-5" />
          </Button> */}
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
          <div className="space-y-3">
            <Label>Options & Correct Answer</Label>
            {watch(`questions.${questionIndex}.options`)?.map((option, optionIdx) => (
              <div key={option.id || optionIdx} className="flex items-center gap-2">
                <RadioGroup
                    value={watch(`questions.${questionIndex}.correctOptionId`) || ""}
                    onValueChange={(value) => setValue(`questions.${questionIndex}.correctOptionId`, value)}
                    className="flex items-center"
                >
                    <RadioGroupItem value={option.id} id={`${questionIndex}-opt-${optionIdx}-correct`} />
                </RadioGroup>
                <Label htmlFor={`${questionIndex}-opt-${optionIdx}-correct`} className="sr-only">Mark as correct</Label>
                <Input
                  placeholder={`Option ${optionIdx + 1}`}
                  {...register(`questions.${questionIndex}.options.${optionIdx}.text`)}
                  className="flex-grow"
                />
                {watch(`questions.${questionIndex}.options`)!.length > 1 && (
                   <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIdx)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            ))}
             {form.formState.errors?.questions?.[questionIndex]?.options && (
                <p className="text-sm text-destructive mt-1">Each option text is required.</p>
            )}
             {form.formState.errors?.questions?.[questionIndex]?.correctOptionId && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.questions[questionIndex]?.correctOptionId?.message}</p>
            )}
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Option
            </Button>
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
            {form.formState.errors?.questions?.[questionIndex]?.correctAnswer && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.questions[questionIndex]?.correctAnswer?.message}</p>
            )}
          </div>
        )}

        {questionType === "true-false" && (
          <div>
            <Label>Correct Answer</Label>
            <RadioGroup
              defaultValue={watch(`questions.${questionIndex}.correctAnswer`)?.toString() || "true"}
              onValueChange={(value) => setValue(`questions.${questionIndex}.correctAnswer`, value === "true")}
              className="flex space-x-4"
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
