
"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Save, Eye, Settings as SettingsIcon, Info } from "lucide-react";
import { QuestionForm } from "@/components/test/question-form";
import type { Test, Question, MCQQuestion, ShortAnswerQuestion, TrueFalseQuestion, TestBuilderFormValues } from '@/lib/types';
import { testBuilderSchema } from "@/lib/types";
import { addTest, getTestById, updateTest } from "@/lib/store"; 
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  Form as UIForm,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import TestPreviewDialog from "@/components/test/test-preview-dialog"; 
import { useSubscription } from "@/hooks/use-subscription";
import UpgradeNudge from "@/components/common/upgrade-nudge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Loading from "@/app/loading";

const AI_GENERATED_DATA_STORAGE_KEY = "aiGeneratedTestData";

const defaultQuestionValues = (type: Question['type']): Question => {
  const baseId = `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const base = { id: baseId, text: "", points: 10 };
  if (type === 'mcq') {
    return { 
      ...base, 
      type, 
      options: [
        {id: `opt-${baseId}-0`, text: ""}, 
        {id: `opt-${baseId}-1`, text: ""}
      ], 
      correctOptionId: null, 
      correctAnswer: undefined, 
      isAiPreselected: false 
    } as MCQQuestion;
  }
  if (type === 'short-answer') {
    return { ...base, type, correctAnswer: "", options: undefined } as ShortAnswerQuestion;
  }
  // Default for true-false
  return { ...base, type, correctAnswer: true, options: undefined } as TrueFalseQuestion; 
};

export default function TestBuilderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { plan, isLoading: isSubscriptionLoading, canCreateTest, canCreateAiTest, remainingTests, remainingAiTests, addCreatedTest } = useSubscription();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testIdToEdit, setTestIdToEdit] = useState<string | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTestData, setPreviewTestData] = useState<TestBuilderFormValues | null>(null);

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
      isAiGenerated: false,
    },
  });

  const { fields: questions, append: appendQuestion, remove: removeQuestion, replace: replaceQuestions } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  useEffect(() => {
    const editId = searchParams.get("edit");
    const source = searchParams.get("source");

    if (isAuthLoading) {
        return;
    }

    if (!user && editId) {
      toast({ title: "Unauthorized", description: "You must be logged in to edit a test.", variant: "destructive" });
      router.push("/auth/login");
      setIsLoading(false);
      return;
    }

    if (source === 'ai') {
      try {
        const aiDataString = localStorage.getItem(AI_GENERATED_DATA_STORAGE_KEY);
        if (aiDataString) {
          const aiData: Partial<TestBuilderFormValues> & {questions: Question[]} = JSON.parse(aiDataString);
          if (aiData.questions && aiData.questions.length > 0) {
            form.setValue("title", aiData.title || "AI Generated Test");
            form.setValue("subject", aiData.subject || "AI Suggested Subject");
            form.setValue("duration", aiData.duration || 30);
            form.setValue("attemptsAllowed", aiData.attemptsAllowed === undefined ? 1 : aiData.attemptsAllowed);
            form.setValue("randomizeQuestions", aiData.randomizeQuestions === undefined ? false : aiData.randomizeQuestions);
            form.setValue("enableTabSwitchDetection", aiData.enableTabSwitchDetection === undefined ? true : aiData.enableTabSwitchDetection);
            form.setValue("enableCopyPasteDisable", aiData.enableCopyPasteDisable === undefined ? true : aiData.enableCopyPasteDisable);
            form.setValue("published", aiData.published === undefined ? false : aiData.published);
            form.setValue("isAiGenerated", true);
            
            const processedAiQuestions = aiData.questions.map(q => {
              const baseQ = { ...q, id: String(q.id || `ai-q-${Date.now()}-${Math.random().toString(36).substring(2,7)}`), text: q.text || "", points: q.points || 10 };
              if (baseQ.type === 'mcq') {
                return {
                  ...baseQ,
                  options: (baseQ.options || []).map((opt, optIdx) => ({ ...opt, id: String(opt.id || `ai-opt-${baseQ.id}-${optIdx}`), text: opt.text || "" })),
                  correctOptionId: (baseQ as MCQQuestion).correctOptionId || null,
                  correctAnswer: (baseQ as MCQQuestion).correctAnswer || undefined,
                  isAiPreselected: (baseQ as MCQQuestion).isAiPreselected === true && (baseQ as MCQQuestion).correctOptionId !== null,
                } as MCQQuestion;
              }
              if(baseQ.type === 'short-answer') {
                return { ...baseQ, correctAnswer: (baseQ as ShortAnswerQuestion).correctAnswer || "", options: undefined } as ShortAnswerQuestion;
              }
              if(baseQ.type === 'true-false') {
                 return { ...baseQ, correctAnswer: typeof (baseQ as TrueFalseQuestion).correctAnswer === 'boolean' ? (baseQ as TrueFalseQuestion).correctAnswer : true, options: undefined } as TrueFalseQuestion;
              }
              return baseQ as Question; 
            });
            replaceQuestions(processedAiQuestions); 
            toast({ title: "AI Data Loaded", description: "AI-generated content has been added to the form.", duration: 2000});
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
        setIsLoading(false);
      }
    } else if (editId) {
      setTestIdToEdit(editId);
      getTestById(editId)
        .then(testData => {
          if (testData && testData.teacherId === user?.id) {
            const questionsWithProcessedIds = testData.questions.map(q => {
              const baseQ = { ...q, id: String(q.id), text: q.text || "", points: q.points || 10 };
              if (baseQ.type === 'mcq') {
                return {
                  ...baseQ,
                  options: (baseQ.options || []).map(opt => ({ ...opt, id: String(opt.id), text: opt.text || "" })),
                  correctOptionId: baseQ.correctOptionId || null,
                  correctAnswer: (baseQ as MCQQuestion).correctAnswer || undefined, 
                  isAiPreselected: (baseQ as MCQQuestion).isAiPreselected || false,
                } as MCQQuestion;
              }
              if(baseQ.type === 'short-answer') {
                return { ...baseQ, correctAnswer: (baseQ as ShortAnswerQuestion).correctAnswer || "", options: undefined } as ShortAnswerQuestion;
              }
              if(baseQ.type === 'true-false') {
                 return { ...baseQ, correctAnswer: typeof (baseQ as TrueFalseQuestion).correctAnswer === 'boolean' ? (baseQ as TrueFalseQuestion).correctAnswer : true, options: undefined } as TrueFalseQuestion;
              }
              return baseQ as Question; 
            });
            form.reset({
              ...testData,
              questions: questionsWithProcessedIds, 
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
    } else {
        setIsLoading(false);
    }
  }, [searchParams, form, user, isAuthLoading, router, toast, replaceQuestions]);


  const onSubmit = async (data: TestBuilderFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive", duration: 2000 });
      return;
    }

    if (!testIdToEdit) { // Only check limits for NEW tests, not for edits.
      if (data.isAiGenerated) {
        if (!canCreateAiTest) {
          toast({ title: "AI Test Limit Reached", description: `You have reached your monthly limit of ${plan.aiTestCreationLimit} AI-generated tests.`, variant: "destructive", duration: 3000 });
          return;
        }
      } else {
        if (!canCreateTest) {
          toast({ title: "Manual Test Limit Reached", description: `You have reached your monthly limit of ${plan.testCreationLimit} manual tests.`, variant: "destructive", duration: 3000 });
          return;
        }
      }
    }

    setIsSubmitting(true);
    
    const processedData = {
      ...data,
      questions: data.questions.map(q => {
        if (q.type === 'mcq') {
          const mcq = q as MCQQuestion;
          if (mcq.correctOptionId && !mcq.correctAnswer) {
            const correctOption = mcq.options.find(opt => opt.id === mcq.correctOptionId);
            return {
              ...mcq,
              correctAnswer: correctOption?.text || undefined,
            };
          }
        }
        return q;
      })
    };

    const finalData = processedData;
    let savedTest: Test | undefined | null;

    try {
      const teacherUserId = user.id;

      if (testIdToEdit) {
        savedTest = await updateTest(testIdToEdit, { ...finalData, teacherId: teacherUserId });
      } else {
        savedTest = await addTest({ ...finalData, teacherId: teacherUserId });
      }

      if (savedTest) {
        addCreatedTest(savedTest);
        toast({
          title: "Success",
          description: `Test ${testIdToEdit ? 'updated' : 'created'} successfully!`,
          duration: 2000,
        });
        router.push(`/dashboard/test/${savedTest.id}`);
      } else {
        toast({
          title: "Save Error",
          description: `Failed to ${testIdToEdit ? 'update' : 'create'} the test.`,
          variant: "destructive",
          duration: 2000,
        });
      }
    } catch (error: any) {
      console.error("Error saving test:", error);
      toast({ title: "Save Error", description: `Failed to save test: ${error.message || "Please try again."}`, variant: "destructive", duration: 2000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    const currentTestData = form.getValues();
    const questionsForPreview = currentTestData.questions.map(q => {
      if (q.type === 'mcq') {
        const mcq = q as MCQQuestion;
        const correctOpt = mcq.options.find(opt => opt.id === mcq.correctOptionId);
        return { ...mcq, correctAnswer: correctOpt?.text || "Not selected" };
      }
      return q;
    });
    setPreviewTestData({ ...currentTestData, questions: questionsForPreview });
    setShowPreviewDialog(true);
  };

  if (isAuthLoading || isLoading || isSubscriptionLoading) { 
    return <Loading />;
  }
  
  if (!testIdToEdit && !canCreateTest) { // Block new manual test creation if limit reached
    return (
        <UpgradeNudge 
            featureName="more manual tests"
            description={`You have reached your limit of ${plan.testCreationLimit} manual test creations for this month on the ${plan.name} plan.`}
            requiredPlan="a higher tier"
        />
    );
  }

  return (
    <>
      <div className="mb-6">
          <Alert className="border-primary/50 text-primary bg-primary/5 dark:bg-primary/10">
              <Info className="h-4 w-4" />
              <AlertTitle className="font-semibold">Plan Information</AlertTitle>
              <AlertDescription>
              You are on the <b>{plan.name}</b> plan. 
              {plan.testCreationLimit !== Infinity 
                  ? ` You have ${remainingTests} manual test creation(s) remaining this month.`
                  : ` You have unlimited manual test creations.`
              }
              </AlertDescription>
          </Alert>
      </div>
      <UIForm {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error("Form validation errors on submit:", errors);
          toast({title: "Validation Error", description: "Please check the form for errors.", variant: "destructive", duration: 3000});
        })} className="space-y-8">
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
             {form.formState.errors.questions && typeof form.formState.errors.questions === 'object' && !Array.isArray(form.formState.errors.questions) && 'message' in form.formState.errors.questions && (
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
            <Button type="button" variant="outline" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {isSubmitting ? "Saving..." : (testIdToEdit ? "Update Test" : "Create Test")}
            </Button>
          </div>
        </form>
      </UIForm>
      {showPreviewDialog && previewTestData && (
        <TestPreviewDialog
          isOpen={showPreviewDialog}
          onClose={() => setShowPreviewDialog(false)}
          testData={previewTestData}
        />
      )}
    </>
  );
}
