'use server';

import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';
import { readLabel, type ReadLabelOutput } from '@/ai/flows/read-label';

export type TestAnalyzeImageResponse = {
  analysisResult: string;
  error?: string;
};

/**
 * Runs the AI label analysis on a submitted photo. The report itself is
 * written to Firestore from the client so it doesn't depend on the Admin SDK.
 */
export async function analyzeLabelAction(photoDataUri: unknown): Promise<TestAnalyzeImageResponse> {
  if (typeof photoDataUri !== 'string' || !photoDataUri.startsWith('data:image/')) {
    return { analysisResult: '', error: 'A label photo is required.' };
  }

  try {
    const result = await analyzeExpiryLabelImage({ photoDataUri });
    return { analysisResult: result.analysisResult };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      analysisResult: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred while running analysis.',
    };
  }
}

export async function testAnalyzeImageAction(photoDataUri: unknown): Promise<TestAnalyzeImageResponse> {
  return analyzeLabelAction(photoDataUri);
}

export type ReadLabelResponse = { fields?: ReadLabelOutput; error?: string };

/** Verification by photo: reads the label's name, barcode, NAFDAC number and expiry. */
export async function readLabelAction(photoDataUri: unknown): Promise<ReadLabelResponse> {
  if (typeof photoDataUri !== 'string' || !photoDataUri.startsWith('data:image/')) {
    return { error: 'Choose a photo of the label.' };
  }
  if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    return { error: 'Label reading isn’t configured on this server (GOOGLE_GENAI_API_KEY is missing).' };
  }
  try {
    return { fields: await readLabel(photoDataUri) };
  } catch (error) {
    console.error('Label reading failed:', error);
    return { error: 'Couldn’t read that label. Try a sharper, well-lit photo, or type the details instead.' };
  }
}
