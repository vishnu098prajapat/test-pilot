
'use server';
/**
 * @fileOverview A Genkit flow to generate test questions using AI.
 *
 * - generateTestQuestions - A function that takes test parameters and returns generated questions.
 * - GenerateTestQuestionsInput - The input type for the generateTestQuestions function.
 * - GenerateTestQuestionsOutput - The return type for the generateTestQuestions function.
 * - AIQuestion - The type for a single AI-generated question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for a single AI-generated question (not exported)
const AIQuestionSchema = z.object({
  text: z.string().describe("The question text."),
  type: z.enum(['mcq', 'short-answer', 'true-false']).describe("The type of the question."),
  points: z.number().default(10).describe("The points allocated to the question."),
  options: z.array(z.string()).optional().describe("For MCQ, an array of 4 distinct option texts. For other types, this can be omitted."),
  correctAnswer: z.union([z.string(), z.boolean()]).describe("For MCQ, this is the exact string text of the correct option from the 'options' array. For True/False, a boolean (true or false). For Short Answer, the string answer."),
});
export type AIQuestion = z.infer<typeof AIQuestionSchema>;

// Input schema for the flow
const GenerateTestQuestionsInputSchema = z.object({
  subject: z.string().describe("The general subject of the test (e.g., Mathematics, History)."),
  questionType: z.enum(['mcq', 'short-answer', 'true-false']).describe("The desired type for all generated questions (mcq, short-answer, or true-false)."),
  topics: z.array(z.string()).min(1).describe("An array of specific topics to generate questions about."),
  numberOfQuestions: z.number().int().min(1).max(10).describe("The number of questions to generate (integer between 1 and 10)."),
});
export type GenerateTestQuestionsInput = z.infer<typeof GenerateTestQuestionsInputSchema>;

// Output schema for the flow
const GenerateTestQuestionsOutputSchema = z.object({
  generatedQuestions: z.array(AIQuestionSchema).describe("An array of AI-generated question objects."),
});
export type GenerateTestQuestionsOutput = z.infer<typeof GenerateTestQuestionsOutputSchema>;


export async function generateTestQuestions(input: GenerateTestQuestionsInput): Promise<GenerateTestQuestionsOutput> {
  return generateTestQuestionsFlow(input);
}

const generateTestQuestionsPrompt = ai.definePrompt({
  name: 'generateTestQuestionsPrompt',
  input: {schema: GenerateTestQuestionsInputSchema},
  output: {schema: GenerateTestQuestionsOutputSchema},
  prompt: `You are an expert test creator. Your task is to generate {{numberOfQuestions}} {{questionType}} questions about the subject "{{subject}}", focusing on the following topics:
{{#each topics}}
- {{{this}}}
{{/each}}

Each question should be worth 10 points.

For each question, provide:
- "text": The question text.
- "type": "{{questionType}}" (this will be one of 'mcq', 'short-answer', or 'true-false' based on the input)
- "points": 10

{{#if (eq questionType "mcq")}}
For Multiple Choice Questions (MCQ):
- "options": An array of exactly 4 distinct string options.
- "correctAnswer": The exact string text of the correct option from the "options" array. Ensure this text perfectly matches one of the provided options.
Example for MCQ:
{
  "text": "What is the capital of France?",
  "type": "mcq",
  "points": 10,
  "options": ["London", "Berlin", "Paris", "Madrid"],
  "correctAnswer": "Paris"
}
{{/if}}

{{#if (eq questionType "short-answer")}}
For Short Answer Questions:
- "correctAnswer": A string representing the correct answer.
Example for Short Answer:
{
  "text": "What is the chemical symbol for water?",
  "type": "short-answer",
  "points": 10,
  "correctAnswer": "H2O"
}
{{/if}}

{{#if (eq questionType "true-false")}}
For True/False Questions:
- "correctAnswer": A boolean value (true or false).
Example for True/False:
{
  "text": "The sun rises in the west.",
  "type": "true-false",
  "points": 10,
  "correctAnswer": false
}
{{/if}}

Please ensure your entire output is a single JSON object containing a key "generatedQuestions" which is an array of question objects, strictly adhering to the specified structure and types.
The "type" field for each question must exactly match the input '{{questionType}}'.
For MCQs, always provide 4 options.
`,
});

const generateTestQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTestQuestionsFlow',
    inputSchema: GenerateTestQuestionsInputSchema,
    outputSchema: GenerateTestQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await generateTestQuestionsPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate questions.");
    }
    // Validate that for MCQs, options and correctAnswer are present
    if (input.questionType === 'mcq') {
        output.generatedQuestions.forEach(q => {
            if (q.type === 'mcq' && (!q.options || q.options.length !== 4 || typeof q.correctAnswer !== 'string')) {
                throw new Error('AI generated invalid MCQ structure. Options array or correctAnswer text is missing/invalid.');
            }
            if (q.type === 'mcq' && q.options && !q.options.includes(q.correctAnswer as string)) {
                throw new Error('AI generated MCQ where correctAnswer text does not match any of the options.');
            }
        });
    }
    return output;
  }
);

