
'use server';

import { z } from 'zod';
import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/firebase/admin';


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
    
    // Perform AI analysis
    const analysisResult = await analyzeExpiryLabelImage({ photoDataUri });
    
    // Save report to Firestore
    const db = getDb();
    await addDoc(collection(db, 'reports'), {
      productName,
      storeLocation,
      labelDescription,
      photoUrl: '', // Will be implemented later with file storage
      userId,
      analysisResult: analysisResult.analysisResult,
      submissionDate: serverTimestamp(),
      reportStatus: 'Pending',
    });


    return {
      message: 'Report submitted and analysis complete!',
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
