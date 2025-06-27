
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-student-behavior.ts';
import '@/ai/flows/generate-test-questions-flow.ts';
import '@/ai/flows/suggest-topics-flow.ts';
import '@/ai/flows/translate-text-flow.ts';

