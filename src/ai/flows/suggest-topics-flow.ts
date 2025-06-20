
'use server';
/**
 * @fileOverview A Genkit flow to suggest relevant topics based on a given subject or multiple subjects.
 *
 * - suggestTopics - A function that takes a subject string (potentially comma-separated) and returns topic suggestions.
 * - SuggestTopicsInput - The input type for the suggestTopics function.
 * - SuggestTopicsOutput - The return type for the suggestTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for the flow
const SuggestTopicsInputSchema = z.object({
  subject: z.string().min(1, "Subject cannot be empty.").describe("The general subject(s) for which topics are to be suggested (e.g., 'Mathematics', 'History, Geography', 'Python, Java'). Can be a single subject or comma-separated list of subjects."),
});
export type SuggestTopicsInput = z.infer<typeof SuggestTopicsInputSchema>;

// Output schema for the flow
const SuggestTopicsOutputSchema = z.object({
  topicSuggestions: z.array(z.string()).describe("An array of 5-7 suggested topic strings relevant to the input subject(s)."),
});
export type SuggestTopicsOutput = z.infer<typeof SuggestTopicsOutputSchema>;

export async function suggestTopics(input: SuggestTopicsInput): Promise<SuggestTopicsOutput> {
  return suggestTopicsFlow(input);
}

const suggestTopicsPrompt = ai.definePrompt({
  name: 'suggestTopicsPrompt',
  input: {schema: SuggestTopicsInputSchema},
  output: {schema: SuggestTopicsOutputSchema},
  prompt: `You are an expert curriculum designer. The provided "subject" field may contain one or more subjects, potentially comma-separated (e.g., "Mathematics, Physics" or "History" or "Python, Java, C++"). 
Based on the subject(s) provided in "{{subject}}", please suggest 5-7 relevant topics or sub-topics that would be suitable for generating test questions for a general audience (e.g., high school or early college level).

If multiple subjects are listed (comma-separated), try to provide topics that are:
1. Common to all listed subjects, if applicable.
2. Integrate concepts from the listed subjects.
3. Or, provide a balanced mix of key topics from each distinct subject mentioned.

Focus on core concepts and commonly taught areas within the specified subject(s).

Return your response as a JSON object with a single key "topicSuggestions", where the value is an array of strings. For example:
{
  "topicSuggestions": ["Topic 1", "Topic 2", "Another Topic for Subject A", "Key Concept from Subject B", "Integrated Topic C"]
}

Ensure the array contains between 5 and 7 distinct topic suggestions.
Subject(s): {{{subject}}}
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
      console.warn("AI did not return any topic suggestions for subject(s):", input.subject);
      return { topicSuggestions: [] }; // Return empty array if AI fails or returns nothing
    }
    return output;
  }
);

