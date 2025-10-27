
'use server';

import { z } from 'zod';
import { collection, addDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Helper to initialize Firebase app on the server
function getDb() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
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
    const analysisResult = "Your report has been submitted for review. Thank you for your contribution.";
    
    // Save report to Firestore
    const db = getDb();
    await addDoc(collection(db, 'reports'), {
      productName,
      storeLocation,
      labelDescription,
      photoUrl: '', // Will be implemented later with file storage
      userId,
      analysisResult: "N/A", // AI analysis is removed for now
      submissionDate: serverTimestamp(),
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
