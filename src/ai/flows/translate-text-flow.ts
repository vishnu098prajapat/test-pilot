
'use server';
/**
 * @fileOverview A Genkit flow to translate a batch of texts into a specified language.
 *
 * - translateText - A function that takes texts and a target language and returns translations.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  texts: z.array(z.string()).describe("An array of texts to be translated."),
  targetLanguage: z.string().describe("The target language for translation (e.g., 'Hindi', 'English')."),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translations: z.array(z.string()).describe("The array of translated texts, in the same order as the input."),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `You are an expert translator. Translate the following array of texts into {{targetLanguage}}.
  
  IMPORTANT: 
  1.  Provide translations for EACH text in the input array.
  2.  The output array 'translations' MUST have the exact same number of elements as the input 'texts' array.
  3.  The order of the translations in the output array MUST correspond to the order of the texts in the input array.
  4.  Provide only the translation, without any additional comments or explanations.

  Input Texts:
  {{#each texts}}
  - "{{{this}}}"
  {{/each}}

  Target Language: {{targetLanguage}}
  `,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const {output} = await translateTextPrompt(input);
    if (!output || !output.translations || output.translations.length !== input.texts.length) {
        console.error("Translation failed or returned incorrect number of items.", { input, output });
        // Fallback to returning original texts if translation fails
        return { translations: input.texts };
    }
    return output;
  }
);
