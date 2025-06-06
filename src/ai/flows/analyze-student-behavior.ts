'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing student behavior during tests to detect suspicious activity.
 *
 * - analyzeStudentBehavior - A function that analyzes student behavior and flags suspicious activity.
 * - AnalyzeStudentBehaviorInput - The input type for the analyzeStudentBehavior function.
 * - AnalyzeStudentBehaviorOutput - The return type for the analyzeStudentBehavior function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStudentBehaviorInputSchema = z.object({
  studentId: z.string().describe('The unique identifier for the student.'),
  testId: z.string().describe('The unique identifier for the test.'),
  activityLog: z
    .string()
    .describe(
      'A detailed log of student activity during the test, including timestamps, actions (e.g., tab switches, copy/paste attempts), and other relevant data.'
    ),
});
export type AnalyzeStudentBehaviorInput = z.infer<typeof AnalyzeStudentBehaviorInputSchema>;

const AnalyzeStudentBehaviorOutputSchema = z.object({
  isSuspicious: z
    .boolean()
    .describe('Whether or not the student behavior is considered suspicious.'),
  suspiciousReason: z
    .string()
    .describe('A detailed explanation of why the student behavior is considered suspicious.'),
  severityScore: z
    .number()
    .describe(
      'A numerical score indicating the severity of the suspicious behavior (e.g., 0-10, where 10 is the most severe).'
    ),
  recommendations: z
    .string()
    .describe(
      'Recommendations for further action, such as reviewing the test or contacting the student.'
    ),
});
export type AnalyzeStudentBehaviorOutput = z.infer<typeof AnalyzeStudentBehaviorOutputSchema>;

export async function analyzeStudentBehavior(input: AnalyzeStudentBehaviorInput): Promise<AnalyzeStudentBehaviorOutput> {
  return analyzeStudentBehaviorFlow(input);
}

const analyzeStudentBehaviorPrompt = ai.definePrompt({
  name: 'analyzeStudentBehaviorPrompt',
  input: {schema: AnalyzeStudentBehaviorInputSchema},
  output: {schema: AnalyzeStudentBehaviorOutputSchema},
  prompt: `You are an AI proctor analyzing student behavior during online tests to detect cheating.

  You are provided with the student's ID, the test ID, and a detailed activity log.
  Your task is to determine if the student's behavior is suspicious based on the activity log.

  Analyze the activity log for patterns indicative of cheating, such as:
  - Frequent tab switches or attempts to access unauthorized resources.
  - Copying and pasting text into the test.
  - Unusual keyboard activity or attempts to use shortcuts.
  - Any other behavior that deviates from the expected testing environment.

  Based on your analysis, determine the isSuspicious flag (true or false), provide a detailed explanation in the suspiciousReason field, assign a severityScore (0-10), and offer recommendations for further action.

  Here is the student activity log:
  Student ID: {{{studentId}}}
  Test ID: {{{testId}}}
  Activity Log: {{{activityLog}}}

  Ensure that the output is valid JSON and conforms to the AnalyzeStudentBehaviorOutputSchema.  Include a detailed reason for your determination.
  `,
});

const analyzeStudentBehaviorFlow = ai.defineFlow(
  {
    name: 'analyzeStudentBehaviorFlow',
    inputSchema: AnalyzeStudentBehaviorInputSchema,
    outputSchema: AnalyzeStudentBehaviorOutputSchema,
  },
  async input => {
    const {output} = await analyzeStudentBehaviorPrompt(input);
    return output!;
  }
);
