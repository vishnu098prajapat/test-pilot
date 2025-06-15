
"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Save, Eye, Settings as SettingsIcon, AlertTriangle } from "lucide-react";
import { QuestionForm } from "./question-form";
import type { Test, Question, MCQQuestion, ShortAnswerQuestion, TrueFalseQuestion, Option } from "@/lib/types";
import { addTest, getTestById, updateTest } from "@/lib/store"; 
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";
import {
  Form as UIForm,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "../ui/skeleton";


const optionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Option text cannot be empty"),
});

const baseQuestionSchema = z.object({
  id: z.string(), 
  text: z.string().min(1, "Question text is required"),
  points: z.number().min(0, "Points must be non-negative"),
});

const mcqQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("mcq"),
  options: z.array(optionSchema).min(2, "MCQ must have at least 2 options"),
  correctOptionId: z.string().nullable().refine(val => val !== null, "Correct option must be selected for MCQ"),
});

const shortAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("short-answer"),
  correctAnswer: z.string().min(1, "Correct answer is required for short answer"),
  options: z.array(optionSchema).optional(), 
});

const trueFalseQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("true-false"),
  correctAnswer: z.boolean({ required_error: "Correct answer must be selected for True/False" }),
  options: z.array(optionSchema).optional(), 
});

const questionSchema = z.discriminatedUnion("type", [
  mcqQuestionSchema,
  shortAnswerQuestionSchema,
  trueFalseQuestionSchema,
]);

const testBuilderSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  subject: z.string().min(1, "Subject is required"),
  duration: z.number().min(5, "Duration must be at least 5 minutes").max(180, "Duration cannot exceed 3 hours"),
  questions: z.array(questionSchema).min(1, "Test must have at least one question"),
  attemptsAllowed: z.number().min(0, "Attempts must be non-negative (0 for unlimited)"), 
  randomizeQuestions: z.boolean(),
  enableTabSwitchDetection: z.boolean(),
  enableCopyPasteDisable: z.boolean(),
  published: z.boolean(),
});

export type TestBuilderFormValues = z.infer<typeof testBuilderSchema>;

const AI_GENERATED_DATA_STORAGE_KEY = "aiGeneratedTestData";

const defaultQuestionValues = (type: Question['type']): Question => {
  const base = { id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text: "", points: 10 };
  if (type === 'mcq') {
    return { ...base, type, options: [{id: `opt-${Date.now()}`, text: ""}, {id: `opt-${Date.now()+1}`, text: ""}], correctOptionId: null } as MCQQuestion;
  }
  if (type === 'short-answer') {
    return { ...base, type, correctAnswer: "" } as ShortAnswerQuestion;
  }
  return { ...base, type, correctAnswer: true } as TrueFalseQuestion; 
};

export default function TestBuilderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testIdToEdit, setTestIdToEdit] = useState<string | null>(null);

  const form = useForm<TestBuilderFormValues>({
    resolver: zodResolver(testBuilderSchema),
    defaultValues: {
      title: "",
      subject: "",
      duration: 30,
      questions: [defaultQuestionValues('mcq')],
      attemptsAllowed: 1,
      randomizeQuestions: false,
      enableTabSwitchDetection: true,
      enableCopyPasteDisable: true,
      published: false,
    },
  });

  const { fields: questions, append: appendQuestion, remove: removeQuestion, replace: replaceQuestions } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  useEffect(() => {
    const editId = searchParams.get("edit");
    const source = searchParams.get("source");

    if (source === 'ai') {
      try {
        const aiDataString = localStorage.getItem(AI_GENERATED_DATA_STORAGE_KEY);
        if (aiDataString) {
          const aiData: { title: string, subject: string, questions: Question[] } = JSON.parse(aiDataString);
          if (aiData.questions && aiData.questions.length > 0) {
            form.setValue("title", aiData.title || "AI Generated Test");
            form.setValue("subject", aiData.subject || "AI Suggested Subject");
            replaceQuestions(aiData.questions); 
            toast({ title: "AI Data Loaded", description: "AI-generated questions, title, and subject have been added to the form.", duration: 2000});
          } else {
            toast({ title: "AI Data Issue", description: "AI data found but no questions were present.", variant: "destructive", duration: 2000});
          }
        }
      } catch (e) {
        console.error("Failed to load AI data from localStorage", e);
        toast({ title: "Load Error", description: "Could not load AI-generated data.", variant: "destructive", duration: 2000});
      } finally {
        localStorage.removeItem(AI_GENERATED_DATA_STORAGE_KEY); 
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('source');
        router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
      }
    } else if (editId) {
      setTestIdToEdit(editId);
      setIsLoading(true);
      getTestById(editId)
        .then(testData => {
          if (testData && testData.teacherId === user?.id) {
            const questionsWithStrIds = testData.questions.map(q => {
              if (q.type === 'mcq' && q.options) {
                return { ...q, options: q.options.map(opt => ({ ...opt, id: String(opt.id) })), id: String(q.id) };
              }
              return { ...q, id: String(q.id) };
            });
            form.reset({
              ...testData,
              questions: questionsWithStrIds as Question[], 
            });
          } else if (testData) {
            toast({ title: "Unauthorized", description: "You are not authorized to edit this test.", variant: "destructive", duration: 2000 });
            router.push("/dashboard");
          } else {
            toast({ title: "Not Found", description: "Test not found.", variant: "destructive", duration: 2000 });
            router.push("/dashboard");
          }
        })
        .catch(() => toast({ title: "Error", description: "Failed to load test data.", variant: "destructive", duration: 2000 }))
        .finally(() => setIsLoading(false));
    }
  }, [searchParams, form, user?.id, router, toast, replaceQuestions]);


  const onSubmit = async (data: TestBuilderFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive", duration: 2000 });
      return;
    }
    setIsSubmitting(true);

    console.log("[TestBuilderForm] Data being submitted:", JSON.stringify(data, null, 2));
    data.questions.forEach((q, idx) => {
      if (q.type === 'mcq') {
        console.log(`[TestBuilderForm] Submitting Q ${idx + 1} (ID: ${q.id}): Type: MCQ, Text: "${q.text}"`);
        console.log(`  Options:`, JSON.stringify(q.options.map(opt => ({id: opt.id, text: opt.text}))));
        console.log(`  CorrectOptionId: "${q.correctOptionId}"`);
        const selectedOption = q.options.find(opt => opt.id === q.correctOptionId);
        if (selectedOption) {
          console.log(`  Selected Option Text (based on ID): "${selectedOption.text}"`);
        } else {
          console.error(`  [TestBuilderForm] SUBMISSION ERROR: CorrectOptionId "${q.correctOptionId}" for Q ${idx + 1} does NOT match any of its option IDs! This question will likely be unanswerable or auto-marked wrong.`);
        }
      }
    });


    try {
      let savedTest;
      const teacherUserId = user.id;

      if (testIdToEdit) {
        savedTest = await updateTest(testIdToEdit, { ...data, teacherId: teacherUserId });
        if (savedTest) {
          toast({ title: "Success", description: "Test updated successfully!", duration: 2000 });
        } else {
          toast({ title: "Update Error", description: `Failed to find test with ID ${testIdToEdit} to update.`, variant: "destructive", duration: 2000 });
          router.push('/dashboard');
          return;
        }
      } else {
        savedTest = await addTest({ ...data, teacherId: teacherUserId });
        if (savedTest) {
            toast({ title: "Success", description: "Test created successfully!", duration: 2000 });
        } else {
            toast({ title: "Creation Error", description: "Failed to create test. The save operation returned no data.", variant: "destructive", duration: 2000 });
            router.push('/dashboard');
            return;
        }
      }
      
      router.push(`/dashboard/test/${savedTest.id}`);

    } catch (error: any) {
      console.error("Error saving test:", error);
      toast({ title: "Save Error", description: `Failed to save test: ${error.message || "Please try again."}`, variant: "destructive", duration: 2000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !searchParams.get("source")) { 
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-1/4 mb-4" />
        {[1,2].map(i => (
          <Card key={i} className="mb-6">
            <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </CardContent>
          </Card>
        ))}
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <UIForm {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              {testIdToEdit ? "Edit Test" : "Create New Test"}
            </CardTitle>
            <CardDescription>
              {testIdToEdit ? "Modify the details of your existing test." : "Fill in the details to create a new test."}
              {searchParams.get("source") === 'ai' && " Using AI-generated questions as a starting point."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="title">Test Title</Label>
                    <Input id="title" placeholder="e.g., Midterm Exam" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="e.g., Mathematics" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input id="duration" type="number" min="5" max="180" {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}
                    />
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">Min: 5 minutes, Max: 180 minutes (3 hours).</p>
                  </FormItem>
                )}
              />
          </CardContent>
        </Card>

        <Separator />

        <div>
          <h2 className="text-xl font-semibold font-headline mb-4">Questions</h2>
          {questions.map((field, index) => (
            <QuestionForm
              key={field.id}
              questionIndex={index}
              form={form}
              removeQuestion={removeQuestion}
            />
          ))}
           {form.formState.errors.questions && typeof form.formState.errors.questions === 'object' && !Array.isArray(form.formState.errors.questions) && (
             <p className="text-sm text-destructive mt-1">{ (form.formState.errors.questions as unknown as {message : string}).message }</p>
           )}
          <Button
            type="button"
            variant="outline"
            onClick={() => appendQuestion(defaultQuestionValues('mcq'))}
            className="mt-4"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </div>
        
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold font-headline flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5" /> Test Settings
            </CardTitle>
             <CardDescription>Configure test behavior and anti-cheat options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="attemptsAllowed"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="attemptsAllowed">Attempts Allowed (0 for unlimited)</Label>
                  <Input id="attemptsAllowed" type="number" min="0" {...field} 
                     onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <FormField
                control={form.control}
                name="randomizeQuestions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <Label htmlFor="randomizeQuestions">Randomize Question Order</Label>
                       <p className="text-xs text-muted-foreground">Shuffle questions for each student.</p>
                    </div>
                    <FormControl>
                      <Switch id="randomizeQuestions" checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-primary/5">
                    <div className="space-y-0.5">
                      <Label htmlFor="published" className="text-primary font-medium">Publish Test</Label>
                       <p className="text-xs text-muted-foreground">Make this test live and accessible to students.</p>
                    </div>
                    <FormControl>
                      <Switch id="published" checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="enableTabSwitchDetection"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableTabSwitchDetection">Detect Tab Switching</Label>
                      <p className="text-xs text-muted-foreground">Log and flag if student leaves the test tab.</p>
                    </div>
                    <FormControl>
                      <Switch id="enableTabSwitchDetection" checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="enableCopyPasteDisable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableCopyPasteDisable">Disable Copy/Paste</Label>
                      <p className="text-xs text-muted-foreground">Prevent copying questions & pasting answers.</p>
                    </div>
                    <FormControl>
                      <Switch id="enableCopyPasteDisable" checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-8 sticky bottom-0 bg-background/90 py-4 border-t">
          <Button type="button" variant="outline" disabled>
            <Eye className="mr-2 h-4 w-4" /> Preview (Not implemented)
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" /> {isSubmitting ? "Saving..." : (testIdToEdit ? "Update Test" : "Create Test")}
          </Button>
        </div>
      </form>
    </UIForm>
  );
}
