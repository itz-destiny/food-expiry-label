'use server';

import { z } from 'zod';
import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      storageBucket: process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.appspot.com` : undefined,
    });
  }
  return {
    firestore: admin.firestore(),
    storage: admin.storage().bucket(),
  };
}

const ReportSchema = z.object({
  productName: z.string().min(1, 'Product name is required.'),
  labelDescription: z.string().min(1, 'Description is required.'),
  storeLocation: z.string().min(1, 'Store location is required.'),
  photoDataUri: z.string().min(1, 'Photo is required.'),
  userId: z.string().min(1, 'User ID is required.'),
  photoType: z.string().min(1, 'Photo type is required'),
  photoName: z.string().min(1, 'Photo name is required'),
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

  const { firestore, storage } = initializeFirebaseAdmin();

  const { photoDataUri, productName, storeLocation, labelDescription, userId, photoType, photoName } = validatedFields.data;

  try {
    // Perform AI analysis
    const analysisResult = await analyzeExpiryLabelImage({ photoDataUri });

    // Upload image to Firebase Storage
    const fileName = `reports/${Date.now()}-${photoName}`;
    const file = storage.file(fileName);
    const buffer = Buffer.from(photoDataUri.split(',')[1], 'base64');

    await file.save(buffer, {
        metadata: { contentType: photoType }
    });

    const [photoUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491' // A very long expiry date
    });

    // Save report to Firestore
    await firestore.collection('reports').add({
        productName,
        storeLocation,
        labelDescription,
        userId,
        photoUrl,
        analysisResult: analysisResult.analysisResult,
        reportStatus: "Pending",
        submissionDate: admin.firestore.FieldValue.serverTimestamp(),
    });

    revalidatePath('/admin');

    return {
      message: 'Report submitted successfully. See analysis below.',
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
