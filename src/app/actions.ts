'use server';

import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';

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
