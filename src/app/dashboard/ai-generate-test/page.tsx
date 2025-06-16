
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, ListChecks, Send, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { generateTestQuestions, GenerateTestQuestionsInput, AIQuestion } from '@/ai/flows/generate-test-questions-flow';
import { suggestTopics, SuggestTopicsInput } from '@/ai/flows/suggest-topics-flow';
import type { Question as TestBuilderQuestion, Option as TestBuilderOption, MCQQuestion, ShortAnswerQuestion, TrueFalseQuestion, DragDropQuestion, DraggableItem, DropTarget, CorrectMapping } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
          toast({ title: "Topic Suggestions", description: `${result.topicSuggestions.length} topics suggested for "${subjectValue}".`, duration: 2000 });
        } else {
          toast({ title: "No Suggestions", description: `No topic suggestions found for "${subjectValue}". Please enter topics manually.`, variant: "default", duration: 2000 });
        }
      } catch (error: any) {
        console.error("Topic Suggestion Error:", error);
        toast({ title: "Suggestion Error", description: error.message || "Failed to get topic suggestions.", variant: "destructive", duration: 2000 });
      } finally {
        setIsSuggestingTopics(false);
      }
    }
  };

  const handleAddTopicSuggestion = (suggestion: string) => {
    const currentTopics = form.getValues("topics");
    const currentTopicsString = Array.isArray(currentTopics) ? (currentTopics as string[]).join(", ") : (currentTopics || "");
    
    let newTopicsString;
    if (currentTopicsString.trim() === "") {
      newTopicsString = suggestion;
    } else {
      newTopicsString = `${currentTopicsString}, ${suggestion}`;
    }
    form.setValue("topics", newTopicsString, { shouldValidate: true });
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
        toast({ title: "Success!", description: `${result.generatedQuestions.length} questions generated by AI.`, duration: 2000 });
      } else {
        toast({ title: "No Questions", description: "AI did not return any questions. Try adjusting your topics or subject.", variant: "destructive", duration: 2000 });
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      toast({ title: "AI Error", description: error.message || "Failed to generate questions. Please try again.", variant: "destructive", duration: 2000 });
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeText = (text: string | undefined | null): string => {
    if (typeof text !== 'string') return '';
    return text.trim().toLowerCase();
  };
  
  const transformAIQuestionsToTestBuilderFormat = (aiQuestions: AIQuestion[]): TestBuilderQuestion[] => {
    return aiQuestions.map((aiQ, index): TestBuilderQuestion => {
      const questionId = `ai-q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
      
      const baseQuestion = {
        id: questionId,
        text: aiQ.text,
        points: aiQ.points || 10,
      };

      if (aiQ.type === 'mcq') {
        const options: TestBuilderOption[] = (aiQ.options || []).map((optText, optIndex) => ({
          id: `ai-opt_q${index}_idx${optIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          text: optText,
        }));
        
        let matchedCorrectOptionId: string | null = null;
        let isAiPreselectedForThisQ = false;
        const aiCorrectAnswerText = (aiQ as MCQQuestion).correctAnswer; 

        if (aiCorrectAnswerText && options.length > 0) {
            const normalizedAICorrectAnswer = normalizeText(aiCorrectAnswerText);
            const matchedOption = options.find(opt => normalizeText(opt.text) === normalizedAICorrectAnswer);
            if (matchedOption) {
              matchedCorrectOptionId = matchedOption.id;
              isAiPreselectedForThisQ = true; 
            }
        }

        return {
          ...baseQuestion,
          type: 'mcq',
          options,
          correctOptionId: matchedCorrectOptionId,
          correctAnswer: aiCorrectAnswerText, 
          isAiPreselected: isAiPreselectedForThisQ,
        } as MCQQuestion;
      } else if (aiQ.type === 'short-answer') {
        return {
          ...baseQuestion,
          type: 'short-answer',
          correctAnswer: (aiQ as ShortAnswerQuestion).correctAnswer as string,
        } as ShortAnswerQuestion;
      } else if (aiQ.type === 'true-false') {
        return {
          ...baseQuestion,
          type: 'true-false',
          correctAnswer: (aiQ as TrueFalseQuestion).correctAnswer as boolean,
        } as TrueFalseQuestion;
      } else if (aiQ.type === 'drag-and-drop') {
         const draggableItems: DraggableItem[] = ((aiQ as DragDropQuestion).draggableItems || []).map((itemText, i) => ({
          id: `ditem-${questionId}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          text: typeof itemText === 'string' ? itemText : (itemText as any).text || "Draggable", 
        }));
        const dropTargets: DropTarget[] = ((aiQ as DragDropQuestion).dropTargets || []).map((targetLabel, i) => ({
          id: `dtarget-${questionId}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          label: typeof targetLabel === 'string' ? targetLabel : (targetLabel as any).label || "Target", 
        }));

        const correctMappings: CorrectMapping[] = ((aiQ as DragDropQuestion).correctMappings || []).map(mapping => {
          const mappedDraggableItem = draggableItems.find(di => di.text === mapping.draggableItemText);
          const mappedDropTarget = dropTargets.find(dt => dt.label === mapping.dropTargetLabel);
          return {
            draggableItemId: mappedDraggableItem ? mappedDraggableItem.id : `unknown-draggable-${mapping.draggableItemText}`,
            dropTargetId: mappedDropTarget ? mappedDropTarget.id : `unknown-target-${mapping.dropTargetLabel}`,
          };
        });
        
        return {
          ...baseQuestion,
          type: 'drag-and-drop',
          instruction: (aiQ as DragDropQuestion).instruction || "",
          draggableItems,
          dropTargets,
          correctMappings
        } as DragDropQuestion;
      }
      // Fallback for unknown types, though schema should prevent this
      return { ...baseQuestion, type: aiQ.type } as TestBuilderQuestion;
    });
  };

  const handleUseQuestions = () => {
    if (!generatedQuestions || !generationParams) return;
    
    const testBuilderQuestions = transformAIQuestionsToTestBuilderFormat(generatedQuestions);
    
    const aiGeneratedTitle = `AI Gen (${generationParams.difficulty}) ${generationParams.questionType.toUpperCase()} Test on ${generationParams.subject}`;
    
    const dataToStore = {
      title: aiGeneratedTitle,
      subject: generationParams.subject,
      questions: testBuilderQuestions,
      duration: 30, 
      attemptsAllowed: 1,
      randomizeQuestions: false,
      enableTabSwitchDetection: true,
      enableCopyPasteDisable: true,
      published: false, 
    };

    try {
      localStorage.setItem(AI_GENERATED_DATA_STORAGE_KEY, JSON.stringify(dataToStore));
      toast({title: "Data Saved", description: "Redirecting to Test Builder with generated content.", duration: 2000});
      router.push('/dashboard/create-test?source=ai');
    } catch (e) {
      toast({title: "Error", description: "Could not save data for Test Builder.", variant: "destructive", duration: 2000});
    }
  };


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
                       <Input 
                         id="subject" 
                         placeholder="e.g., World History, Algebra I" 
                         {...field} 
                         onBlur={handleSubjectBlur} 
                       />
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
                      <Badge
                        key={index}
                        variant="secondary"
                        onClick={() => handleAddTopicSuggestion(suggestion)}
                        className="cursor-pointer hover:bg-primary/20"
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="questionType"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="questionType">Question Type</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger id="questionType">
                            <SelectValue placeholder="Select question type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                          <SelectItem value="short-answer">Short Answer</SelectItem>
                          <SelectItem value="true-false">True/False</SelectItem>
                          <SelectItem value="drag-and-drop">Drag & Drop</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger id="difficulty">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="topics"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="topics">Topics (comma-separated)</Label>
                    <Textarea
                      id="topics"
                      placeholder="e.g., French Revolution, Photosynthesis, Quadratic Equations"
                      {...field}
                      className="min-h-[80px]"
                    />
                    <FormMessage />
                     <p className="text-xs text-muted-foreground">Enter specific topics the AI should focus on, or use suggestions.</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfQuestions"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="numberOfQuestions">Number of Questions (1-50)</Label>
                    <Input id="numberOfQuestions" type="number" min="1" max="50" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLoading || isSuggestingTopics}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Questions
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {generatedQuestions && generatedQuestions.length > 0 && (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
              <ListChecks className="mr-2 h-5 w-5" /> Generated Questions
            </CardTitle>
            <CardDescription>Review the questions generated by AI. You can then use them in the Test Builder.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {generatedQuestions.map((q, index) => (
              <div key={index} className="p-3 border rounded-md bg-muted/50">
                <p className="font-semibold">{index + 1}. ({q.type.toUpperCase()}) {q.text}</p>
                {q.type === 'mcq' && (q as MCQQuestion).options && (
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    {(q as MCQQuestion).options.map((optText, optIndex) => ( 
                      <li key={optIndex} className={normalizeText(optText) === normalizeText((q as MCQQuestion).correctAnswer) ? 'text-green-600 font-medium' : ''}>
                        {optText} {normalizeText(optText) === normalizeText((q as MCQQuestion).correctAnswer) ? '(Correct)' : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {(q.type === 'short-answer' || q.type === 'true-false') && (
                  <p className="text-sm mt-1">Correct Answer: <span className="text-green-600 font-medium">{String((q as ShortAnswerQuestion | TrueFalseQuestion).correctAnswer)}</span></p>
                )}
                {q.type === 'drag-and-drop' && (
                  <div className="text-sm mt-1">
                    <p>Instruction: {(q as DragDropQuestion).instruction || 'N/A'}</p>
                    <p>Draggable Items: {(q as DragDropQuestion).draggableItems?.map(di => typeof di === 'string' ? di : (di as any).text).join(", ")}</p>
                    <p>Drop Targets: {(q as DragDropQuestion).dropTargets?.map(dt => typeof dt === 'string' ? dt : (dt as any).label).join(", ")}</p>
                    <p>Correct Mappings:</p>
                    <ul className="list-disc pl-5">
                      {(q as DragDropQuestion).correctMappings?.map((m, mi) => (
                        <li key={mi}>{m.draggableItemText} &rarr; {m.dropTargetLabel}</li>
                      ))}
                    </ul>
                  </div>
                )}
                 <p className="text-xs text-muted-foreground mt-1">Points: {q.points}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleUseQuestions}>
              <Send className="mr-2 h-4 w-4" /> Use these Questions in Test Builder
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
