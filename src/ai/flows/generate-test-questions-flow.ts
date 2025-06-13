
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

// Base schema for common AI question properties
const BaseAIQuestionSchema = z.object({
  text: z.string().describe("The question text."),
  points: z.number().default(10).describe("The points allocated to the question."),
});

// Schema for AI-generated MCQ questions
const AIQuestionMCQSchema = BaseAIQuestionSchema.extend({
  type: z.enum(['mcq']).describe("The type of the question, must be 'mcq' for Multiple Choice Questions."),
  options: z.array(z.string())
    .length(4, "MCQ questions must have exactly 4 options.")
    .describe("An array of exactly 4 distinct option texts. This field is mandatory for MCQ questions."),
  correctAnswer: z.string().describe("The correct answer, which MUST be a string that exactly matches one of the texts in the 'options' array. This field is mandatory for MCQ questions."),
});

// Schema for AI-generated Short Answer questions
const AIQuestionShortAnswerSchema = BaseAIQuestionSchema.extend({
  type: z.enum(['short-answer']).describe("The type of the question, must be 'short-answer'."),
  correctAnswer: z.string().describe("The correct answer, which MUST be a string. This field is mandatory for short-answer questions."),
});

// Schema for AI-generated True/False questions
const AIQuestionTrueFalseSchema = BaseAIQuestionSchema.extend({
  type: z.enum(['true-false']).describe("The type of the question, must be 'true-false'."),
  correctAnswer: z.boolean().describe("The correct answer, which MUST be a boolean (true or false). This field is mandatory for true/false questions."),
});

// Discriminated union for AIQuestionSchema
const AIQuestionSchema = z.discriminatedUnion("type", [
  AIQuestionMCQSchema,
  AIQuestionShortAnswerSchema,
  AIQuestionTrueFalseSchema,
]).describe("A single AI-generated question, structured based on its 'type' field (mcq, short-answer, or true-false).");
export type AIQuestion = z.infer<typeof AIQuestionSchema>;


// Input schema for the flow
const GenerateTestQuestionsInputSchema = z.object({
  subject: z.string().describe("The general subject of the test (e.g., Mathematics, History)."),
  questionType: z.enum(['mcq', 'short-answer', 'true-false']).describe("The desired type for all generated questions (mcq, short-answer, or true-false)."),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe("The desired difficulty level for the questions (easy, medium, or hard)."),
  topics: z.array(z.string()).min(1).describe("An array of specific topics to generate questions about."),
  numberOfQuestions: z.number().int().min(1).max(50).describe("The number of questions to generate (integer between 1 and 50)."),
});
export type GenerateTestQuestionsInput = z.infer<typeof GenerateTestQuestionsInputSchema>;

// Output schema for the flow
const GenerateTestQuestionsOutputSchema = z.object({
  generatedQuestions: z.array(AIQuestionSchema).describe("An array of AI-generated question objects, each conforming to the AIQuestionSchema based on its type."),
});
export type GenerateTestQuestionsOutput = z.infer<typeof GenerateTestQuestionsOutputSchema>;


export async function generateTestQuestions(input: GenerateTestQuestionsInput): Promise<GenerateTestQuestionsOutput> {
  return generateTestQuestionsFlow(input);
}

const generateTestQuestionsPrompt = ai.definePrompt({
  name: 'generateTestQuestionsPrompt',
  input: {schema: GenerateTestQuestionsInputSchema},
  output: {schema: GenerateTestQuestionsOutputSchema},
  prompt: `You are an expert test creator specializing in generating high-quality assessment questions.
Your task is to generate {{numberOfQuestions}} questions of type "{{questionType}}" and difficulty level "{{difficulty}}" for the subject "{{subject}}", focusing on the following topics:
{{#each topics}}
- {{{this}}}
{{/each}}

Please generate these questions as quickly as possible.

Key Instructions for Question Generation:
1.  **Importance and Relevance:** Prioritize questions that cover the most important concepts and core principles within the given topics. Generate questions that are representative of common examination patterns and frequently tested areas for this subject and difficulty.
2.  **Depth of Understanding:** Craft questions that assess a genuine understanding of the subject matter, not just superficial recall. They should be similar in style and analytical depth to questions found in well-designed educational assessments or typical previous year papers for this level.
3.  **Clarity and Precision:** Ensure each question is clearly worded, unambiguous, and directly addresses the specified topics and difficulty.
4.  **Points Allocation:** Each question must be worth 10 points by default, unless the schema specifies otherwise.
5.  **Strict Adherence to Output Format:** The "type" field for EACH generated question MUST BE EXACTLY "{{questionType}}".

Follow these specific structures based on the question type "{{questionType}}":

If "{{questionType}}" is "mcq":
Each question object MUST be structured as follows:
{
  "text": "Example: What is the capital of France?",
  "type": "mcq",
  "points": 10,
  "options": ["London", "Berlin", "Paris", "Madrid"], // MANDATORY: An array of EXACTLY 4 distinct string options.
  "correctAnswer": "Paris" // MANDATORY: A string that EXACTLY matches one of the 4 provided options.
}

If "{{questionType}}" is "short-answer":
Each question object MUST be structured as follows:
{
  "text": "Example: What is the chemical symbol for water?",
  "type": "short-answer",
  "points": 10,
  "correctAnswer": "H2O" // MANDATORY: A string representing the correct answer.
}
The 'options' field MUST NOT be present for "short-answer" questions.

If "{{questionType}}" is "true-false":
Each question object MUST be structured as follows:
{
  "text": "Example: The sun rises in the west.",
  "type": "true-false",
  "points": 10,
  "correctAnswer": false // MANDATORY: A boolean value (true or false).
}
The 'options' field MUST NOT be present for "true-false" questions.

Please ensure your entire output is a single JSON object containing a key "generatedQuestions".
"generatedQuestions" must be an array of question objects.
Each question object in the array must strictly adhere to the structure and types outlined above for the specified "{{questionType}}".
The questions should reflect the requested "{{difficulty}}" level and the key instructions provided above.
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

    if (!output || !output.generatedQuestions || output.generatedQuestions.length === 0) {
        throw new Error("AI failed to generate valid questions. The output did not match the required structure or was empty. Please try adjusting your topics, subject or difficulty, or try a different question type.");
    }
    return output;
  }
);

