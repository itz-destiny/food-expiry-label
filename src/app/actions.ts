'use server';

import { z } from 'zod';
import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';
import { collection, addDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

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

export async function submitReportAction(
  data: unknown
): Promise<SubmitReportResponse> {
  const maxDuration = 60; // Increase timeout to 60 seconds

  const validatedFields = FormSchema.safeParse(data);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join(' ');
    return {
      message: `Invalid form data. ${errorMessages}`,
      error: true,
    };
  }

  const { photoDataUri, ...reportData } = validatedFields.data;

  try {
    const { firestore } = initializeFirebase();
    // Perform AI analysis
    const analysisResult = await analyzeExpiryLabelImage({ photoDataUri });

    // Save the full report to Firestore
    await addDoc(collection(firestore, 'reports'), {
      ...reportData,
      photoUrl: 'dummy_url_for_now', // Placeholder as we are not uploading to storage yet
      submissionDate: new Date().toISOString(),
      reportStatus: 'Pending',
      analysisResult: analysisResult.analysisResult,
    });

    return {
      message: 'Analysis complete and report submitted successfully!',
      analysis: analysisResult.analysisResult,
      error: false,
    };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      message: `An error occurred: ${errorMessage}`,
      error: true,
    };
  }
}
