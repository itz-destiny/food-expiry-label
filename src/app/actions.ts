'use server';

import { z } from 'zod';
import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';

const ReportSchema = z.object({
  photoDataUri: z.string().min(1, 'Photo is required.'),
});

export type SubmitReportResponse = {
  message: string;
  analysis?: string;
  error?: boolean;
};

export async function submitReportAction(
  data: unknown
): Promise<SubmitReportResponse> {
  const validatedFields = ReportSchema.safeParse(data);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join(' ');
    return {
      message: `Invalid form data. ${errorMessages}`,
      error: true,
    };
  }

  const { photoDataUri } = validatedFields.data;

  try {
    // Perform AI analysis
    const analysisResult = await analyzeExpiryLabelImage({ photoDataUri });

    return {
      message: 'Analysis complete. See results below.',
      analysis: analysisResult.analysisResult,
      error: false,
    };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      message: `An error occurred during analysis: ${errorMessage}`,
      error: true,
    };
  }
}
