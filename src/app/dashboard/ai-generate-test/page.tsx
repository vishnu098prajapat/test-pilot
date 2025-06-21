
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, ListChecks, Send, Lightbulb, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormMessage } from '@/components/ui/form';
import { generateTestQuestions, GenerateTestQuestionsInput, AIQuestion } from '@/ai/flows/generate-test-questions-flow';
import { suggestTopics, SuggestTopicsInput } from '@/ai/flows/suggest-topics-flow';
import type { Question as TestBuilderQuestion, MCQQuestion, ShortAnswerQuestion, TrueFalseQuestion, DragDropQuestion } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSubscription } from '@/hooks/use-subscription';
import UpgradeNudge from '@/components/common/upgrade-nudge';
import Loading from '@/app/loading';

const AIGenerateTestSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters."),
  questionType: z.enum(['mcq', 'short-answer', 'true-false', 'drag-and-drop'], { required_error: "Question type is required." }),
  difficulty: z.enum(['easy', 'medium', 'hard'], { required_error: "Difficulty level is required."}),
  topics: z.string().min(3, "Please provide at least one topic.").transform(val => val.split(',').map(t => t.trim()).filter(t => t.length > 0)),
  numberOfQuestions: z.coerce.number().int().min(1, "Minimum 1 question.").max(50, "Maximum 50 questions."),
});

type AIGenerateTestFormValues = z.infer<typeof AIGenerateTestSchema>;

const AI_GENERATED_DATA_STORAGE_KEY = "aiGeneratedTestData";

export default function AIGenerateTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { plan, isLoading: isSubscriptionLoading } = useSubscription();

  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<AIQuestion[] | null>(null);
  const [generationParams, setGenerationParams] = useState<AIGenerateTestFormValues | null>(null);
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);

  const form = useForm<AIGenerateTestFormValues>({
    resolver: zodResolver(AIGenerateTestSchema),
    defaultValues: {
      subject: '',
      questionType: 'mcq',
      difficulty: 'medium',
      topics: '',
      numberOfQuestions: 5, 
    },
  });
  
  const handleSubjectBlur = async () => {
    const subjectValue = form.getValues("subject");
    if (subjectValue && subjectValue.trim().length >= 3) {
      setIsSuggestingTopics(true);
      setTopicSuggestions([]);
      try {
        const input: SuggestTopicsInput = { subject: subjectValue.trim() };
        const result = await suggestTopics(input);
        if (result.topicSuggestions && result.topicSuggestions.length > 0) {
          setTopicSuggestions(result.topicSuggestions);
        } else {
          toast({ title: "No Suggestions", description: `No topic suggestions found for "${subjectValue}". Please enter topics manually.`, variant: "default", duration: 2000 });
        }
      } catch (error: any) {
        console.error("Topic Suggestion Error:", error);
      } finally {
        setIsSuggestingTopics(false);
      }
    }
  };

  const handleAddTopicSuggestion = (suggestion: string) => {
    const currentTopics = form.getValues("topics");
    const topicsArray = Array.isArray(currentTopics) ? currentTopics : currentTopics.split(',').map(t => t.trim()).filter(Boolean);
    if (!topicsArray.includes(suggestion)) {
      const newTopics = [...topicsArray, suggestion];
      form.setValue("topics", newTopics.join(", "), { shouldValidate: true });
    }
  };

  const onSubmit = async (data: AIGenerateTestFormValues) => {
    setIsLoading(true);
    setGeneratedQuestions(null);
    setGenerationParams(data);
    try {
      const input: GenerateTestQuestionsInput = {
        subject: data.subject,
        questionType: data.questionType,
        difficulty: data.difficulty,
        topics: data.topics, 
        numberOfQuestions: data.numberOfQuestions,
      };
      const result = await generateTestQuestions(input);
      if (result.generatedQuestions && result.generatedQuestions.length > 0) {
        setGeneratedQuestions(result.generatedQuestions);
        toast({ title: "Success!", description: `${result.generatedQuestions.length} questions generated.`, duration: 2000 });
      } else {
        toast({ title: "No Questions", description: "AI did not return any questions. Try adjusting your topics.", variant: "destructive", duration: 2000 });
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      toast({ title: "AI Error", description: error.message || "Failed to generate questions.", variant: "destructive", duration: 2000 });
    } finally {
      setIsLoading(false);
    }
  };

  const transformAIQuestionsToTestBuilderFormat = (aiQuestions: AIQuestion[]): TestBuilderQuestion[] => {
    return aiQuestions.map((aiQ, index): TestBuilderQuestion => {
      const questionId = `ai-q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
      
      const baseQuestion = { id: questionId, text: aiQ.text, points: aiQ.points || 10 };

      if (aiQ.type === 'mcq') {
        const options = (aiQ.options || []).map((optText, optIndex) => ({
          id: `ai-opt_q${index}_idx${optIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          text: optText,
        }));
        const aiCorrectAnswerText = (aiQ as MCQQuestion).correctAnswer;
        const matchedOption = options.find(opt => opt.text.trim().toLowerCase() === aiCorrectAnswerText?.trim().toLowerCase());
        return {
          ...baseQuestion, type: 'mcq', options, correctOptionId: matchedOption?.id || null, 
          correctAnswer: aiCorrectAnswerText, isAiPreselected: !!matchedOption
        } as MCQQuestion;
      }
      if (aiQ.type === 'short-answer') return { ...baseQuestion, type: 'short-answer', correctAnswer: (aiQ as ShortAnswerQuestion).correctAnswer } as ShortAnswerQuestion;
      if (aiQ.type === 'true-false') return { ...baseQuestion, type: 'true-false', correctAnswer: (aiQ as TrueFalseQuestion).correctAnswer } as TrueFalseQuestion;
      if (aiQ.type === 'drag-and-drop') {
         const draggableItems = ((aiQ as DragDropQuestion).draggableItems || []).map((item, i) => ({ id: `ditem-${questionId}-${i}`, text: typeof item === 'string' ? item : (item as any).text }));
         const dropTargets = ((aiQ as DragDropQuestion).dropTargets || []).map((target, i) => ({ id: `dtarget-${questionId}-${i}`, label: typeof target === 'string' ? target : (target as any).label }));
         const correctMappings = ((aiQ as DragDropQuestion).correctMappings || []).map(m => ({
            draggableItemId: draggableItems.find(di => di.text === m.draggableItemText)?.id || '',
            dropTargetId: dropTargets.find(dt => dt.label === m.dropTargetLabel)?.id || '',
         }));
         return { ...baseQuestion, type: 'drag-and-drop', instruction: (aiQ as DragDropQuestion).instruction, draggableItems, dropTargets, correctMappings } as DragDropQuestion;
      }
      return { ...baseQuestion, type: aiQ.type } as TestBuilderQuestion;
    });
  };

  const handleUseQuestions = () => {
    if (!generatedQuestions || !generationParams) return;
    const testBuilderQuestions = transformAIQuestionsToTestBuilderFormat(generatedQuestions);
    const aiGeneratedTitle = `AI Gen (${generationParams.difficulty}) ${generationParams.questionType.toUpperCase()} Test on ${generationParams.subject}`;
    const dataToStore = {
      title: aiGeneratedTitle, subject: generationParams.subject, questions: testBuilderQuestions,
      duration: 30, attemptsAllowed: 1, randomizeQuestions: false,
      enableTabSwitchDetection: true, enableCopyPasteDisable: true, published: false, 
    };
    try {
      localStorage.setItem(AI_GENERATED_DATA_STORAGE_KEY, JSON.stringify(dataToStore));
      router.push('/dashboard/create-test?source=ai');
    } catch (e) {
      toast({title: "Error", description: "Could not save data for Test Builder.", variant: "destructive", duration: 2000});
    }
  };
  
  if (isSubscriptionLoading) return <Loading />;
  
  if (!plan.canUseAI) {
    return (
      <UpgradeNudge 
        featureName="AI Test Generator"
        description="This powerful feature creates tests for you in seconds. It is available on our premium plans."
        requiredPlan="Teacher"
      />
    );
  }

  return (
    <div className="container mx-auto py-2">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-primary" /> AI Test Generator
          </CardTitle>
          <CardDescription>
            Let AI help you create test questions. Describe your test, and the AI will generate questions for you.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="subject">Subject</Label>
                    <div className="flex items-center gap-2">
                       <Input id="subject" placeholder="e.g., Python, World History" {...field} onBlur={handleSubjectBlur} />
                       {isSuggestingTopics && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {topicSuggestions.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center"><Lightbulb className="h-4 w-4 mr-1 text-yellow-400" />Suggested Topics (click to add):</Label>
                  <div className="flex flex-wrap gap-2">
                    {topicSuggestions.map((suggestion, index) => (
                      <Badge key={index} variant="secondary" onClick={() => handleAddTopicSuggestion(suggestion)} className="cursor-pointer hover:bg-primary/20">{suggestion}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="questionType" render={({ field }) => (<FormItem><Label>Question Type</Label><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="mcq">Multiple Choice</SelectItem><SelectItem value="short-answer">Short Answer</SelectItem><SelectItem value="true-false">True/False</SelectItem><SelectItem value="drag-and-drop">Drag & Drop</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (<FormItem><Label>Difficulty Level</Label><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl><SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <FormField
                control={form.control} name="topics" render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="topics">Topics (comma-separated)</Label>
                    <Textarea id="topics" placeholder="e.g., French Revolution, Photosynthesis" {...field} className="min-h-[80px]" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="numberOfQuestions" render={({ field }) => (<FormItem><Label>Number of Questions (1-50)</Label><Input type="number" min="1" max="50" {...field} /><FormMessage /></FormItem>)} />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLoading || isSuggestingTopics}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>) : (<><Sparkles className="mr-2 h-4 w-4" /> Generate Questions</>)}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {generatedQuestions && generatedQuestions.length > 0 && (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader><CardTitle className="text-xl font-headline flex items-center"><ListChecks className="mr-2 h-5 w-5" /> Generated Questions</CardTitle><CardDescription>Review the questions. You can use them in the Test Builder.</CardDescription></CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {generatedQuestions.map((q, index) => (
              <div key={index} className="p-3 border rounded-md bg-muted/50">
                <p className="font-semibold">{index + 1}. ({q.type.toUpperCase()}) {q.text}</p>
                 {q.type === 'mcq' && (<ul className="list-disc pl-5 mt-1 text-sm">{(q as MCQQuestion).options.map((opt, i) => (<li key={i} className={(q as MCQQuestion).correctAnswer === opt ? 'text-green-600 font-medium' : ''}>{opt} {(q as MCQQuestion).correctAnswer === opt ? '(Correct)' : ''}</li>))}</ul>)}
                {(q.type === 'short-answer' || q.type === 'true-false') && (<p className="text-sm mt-1">Answer: <span className="text-green-600 font-medium">{String((q as ShortAnswerQuestion | TrueFalseQuestion).correctAnswer)}</span></p>)}
                {q.type === 'drag-and-drop' && (<div className="text-sm mt-1"><p>Draggables: {(q as DragDropQuestion).draggableItems?.map(i=>i.text).join(', ')}</p><p>Targets: {(q as DragDropQuestion).dropTargets?.map(t=>t.label).join(', ')}</p></div>)}
                 <p className="text-xs text-muted-foreground mt-1">Points: {q.points}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-end"><Button onClick={handleUseQuestions}><Send className="mr-2 h-4 w-4" /> Use these Questions</Button></CardFooter>
        </Card>
      )}
    </div>
  );
}
