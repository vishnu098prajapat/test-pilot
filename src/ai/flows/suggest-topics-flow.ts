
'use server';
/**
 * @fileOverview A Genkit flow to suggest relevant topics based on a given subject.
 *
 * - suggestTopics - A function that takes a subject and returns topic suggestions.
 * - SuggestTopicsInput - The input type for the suggestTopics function.
 * - SuggestTopicsOutput - The return type for the suggestTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for the flow
const SuggestTopicsInputSchema = z.object({
  subject: z.string().min(1, "Subject cannot be empty.").describe("The general subject for which topics are to be suggested (e.g., Mathematics, History)."),
});
export type SuggestTopicsInput = z.infer<typeof SuggestTopicsInputSchema>;

// Output schema for the flow
const SuggestTopicsOutputSchema = z.object({
  topicSuggestions: z.array(z.string()).describe("An array of 5-7 suggested topic strings relevant to the input subject."),
});
export type SuggestTopicsOutput = z.infer<typeof SuggestTopicsOutputSchema>;

export async function suggestTopics(input: SuggestTopicsInput): Promise<SuggestTopicsOutput> {
  return suggestTopicsFlow(input);
}

const suggestTopicsPrompt = ai.definePrompt({
  name: 'suggestTopicsPrompt',
  input: {schema: SuggestTopicsInputSchema},
  output: {schema: SuggestTopicsOutputSchema},
  prompt: `You are an expert curriculum designer. Given the subject "{{subject}}", please suggest 5-7 relevant topics or sub-topics that would be suitable for generating test questions for a general audience (e.g., high school or early college level).

Focus on core concepts and commonly taught areas within the subject.

Return your response as a JSON object with a single key "topicSuggestions", where the value is an array of strings. For example:
{
  "topicSuggestions": ["Topic 1", "Topic 2", "Another Topic", "Key Concept A", "Sub-area B"]
}

Ensure the array contains between 5 and 7 distinct topic suggestions.
Subject: {{{subject}}}
`,
});

const suggestTopicsFlow = ai.defineFlow(
  {
    name: 'suggestTopicsFlow',
    inputSchema: SuggestTopicsInputSchema,
    outputSchema: SuggestTopicsOutputSchema,
  },
  async (input) => {
    const {output} = await suggestTopicsPrompt(input);
    if (!output || !output.topicSuggestions || output.topicSuggestions.length === 0) {
      console.warn("AI did not return any topic suggestions for subject:", input.subject);
      return { topicSuggestions: [] }; // Return empty array if AI fails or returns nothing
    }
    return output;
  }
);
