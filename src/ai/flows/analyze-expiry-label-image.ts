// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Analyzes uploaded images of expiry labels using AI to identify inconsistencies, alterations, or signs of tampering.
 *
 * - analyzeExpiryLabelImage - A function that handles the expiry label image analysis process.
 * - AnalyzeExpiryLabelImageInput - The input type for the analyzeExpiryLabelImage function.
 * - AnalyzeExpiryLabelImageOutput - The return type for the analyzeExpiryLabelImage function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const AnalyzeExpiryLabelImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an expiry label, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeExpiryLabelImageInput = z.infer<typeof AnalyzeExpiryLabelImageInputSchema>;

const AnalyzeExpiryLabelImageOutputSchema = z.object({
  analysisResult: z.string().describe('The analysis result of the expiry label image.'),
});
export type AnalyzeExpiryLabelImageOutput = z.infer<typeof AnalyzeExpiryLabelImageOutputSchema>;

export async function analyzeExpiryLabelImage(input: AnalyzeExpiryLabelImageInput): Promise<AnalyzeExpiryLabelImageOutput> {
  return analyzeExpiryLabelImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeExpiryLabelImagePrompt',
  input: {schema: AnalyzeExpiryLabelImageInputSchema},
  output: {schema: AnalyzeExpiryLabelImageOutputSchema},
  model: googleAI.model('gemini-pro-vision'),
  prompt: `You are an expert in food safety and expiry label analysis.

You will analyze the provided image of the expiry label and identify any inconsistencies, alterations, or signs of tampering. Provide a detailed analysis result.

Image: {{media url=photoDataUri}}`,
});

const analyzeExpiryLabelImageFlow = ai.defineFlow(
  {
    name: 'analyzeExpiryLabelImageFlow',
    inputSchema: AnalyzeExpiryLabelImageInputSchema,
    outputSchema: AnalyzeExpiryLabelImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
