'use server';

import { z } from 'zod';
import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';
import { collection, addDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// This is the correct way to initialize firebase on the server for actions
// It will not be bundled with the client
const getDb = () => {
    if (getApps().length === 0) {
        initializeApp(firebaseConfig)
    }
    return getFirestore(getApp());
}


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
    
    // Perform AI analysis
    const analysisResult = await analyzeExpiryLabelImage({ photoDataUri });

    // save to firestore
    const db = getDb();
    await addDoc(collection(db, 'reports'), {
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
      message: `An error occurred during analysis: ${errorMessage}`,
      error: true,
    };
  }
}
