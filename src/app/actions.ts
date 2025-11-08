
'use server';

import { z } from 'zod';
import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';
import { getDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const FormSchema = z.object({
  productName: z.string().min(1, 'Product name is required.'),
  storeLocation: z.string().min(1, 'Store location is required.'),
  labelDescription: z.string().min(1, 'Description is required.'),
  photoDataUri: z.string().min(1, 'Photo is required.'),
  userId: z.string().min(1, 'User ID is required.'),
});

export type SubmitReportResponse = {
  message: string;
  analysis?: string;
  error?: boolean;
};

export type TestAnalyzeImageResponse = {
  analysisResult: string;
  error?: string;
};

export async function submitReportAction(
  data: unknown
): Promise<SubmitReportResponse> {

  const validatedFields = FormSchema.safeParse(data);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join(' ');
    return {
      message: `Invalid form data. ${errorMessages}`,
      error: true,
    };
  }

  const { productName, storeLocation, labelDescription, photoDataUri, userId } = validatedFields.data;

  try {
    let analysisResult = 'AI analysis could not be completed.';

    try {
      const aiResponse = await analyzeExpiryLabelImage({ photoDataUri });
      analysisResult = aiResponse.analysisResult;
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
    }
    
    // Save report to Firestore
    const db = getDb();
    await db.collection('reports').add({
      productName,
      storeLocation,
      labelDescription,
      photoUrl: '', // Will be implemented later with file storage
      userId,
      analysisResult,
      submissionDate: FieldValue.serverTimestamp(),
      reportStatus: 'Pending',
    });


    return {
      message: 'Report submitted successfully!',
      analysis: analysisResult,
      error: false,
    };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      message: `An error occurred while submitting the report: ${errorMessage}`,
      error: true,
    };
  }
}

export async function testAnalyzeImageAction(photoDataUri: unknown): Promise<TestAnalyzeImageResponse> {
  if (typeof photoDataUri !== 'string' || !photoDataUri.trim()) {
    return {
      analysisResult: '',
      error: 'photoDataUri must be a non-empty string.',
    };
  }

  try {
    const result = await analyzeExpiryLabelImage({ photoDataUri });
    return { analysisResult: result.analysisResult };
  } catch (error) {
    console.error('AI analysis test failed:', error);
    return {
      analysisResult: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred while running analysis.',
    };
  }
}
