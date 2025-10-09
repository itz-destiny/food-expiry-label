'use server';

import { z } from 'zod';
import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: `${process.env.GCLOUD_PROJECT}.appspot.com`,
  });
}

const firestore = admin.firestore();
const storage = admin.storage().bucket();

const FormSchema = z.object({
  productName: z.string().min(1, 'Product name is required.'),
  labelDescription: z.string().min(1, 'Description is required.'),
  storeLocation: z.string().min(1, 'Store location is required.'),
  photo: z.instanceof(File, { message: 'A photo is required.' }),
  userId: z.string().min(1, 'User ID is required.'),
});

export type FormState = {
  message: string;
  analysis?: string;
  error?: boolean;
};

async function fileToDataUri(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${file.type};base64,${base64}`;
}


export async function submitReport(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // Increase timeout to 60 seconds
  // This is a Next.js-specific configuration
  if (typeof (globalThis as any).requestConfigRegistry === 'object') {
    (globalThis as any).requestConfigRegistry.set(submitReport, {
      maxDuration: 60,
    });
  }

  const validatedFields = FormSchema.safeParse({
    productName: formData.get('productName'),
    labelDescription: formData.get('labelDescription'),
    storeLocation: formData.get('storeLocation'),
    photo: formData.get('photo'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join(' ');
    return {
      message: `Invalid form data. ${errorMessages}`,
      error: true,
    };
  }
  
  const { photo, productName, storeLocation, labelDescription, userId } = validatedFields.data;

  if (photo.size === 0) {
    return {
      message: 'A photo of the label is required.',
      error: true,
    };
  }
  
  try {
    const photoDataUri = await fileToDataUri(photo);
    
    // Perform AI analysis
    const analysisResult = await analyzeExpiryLabelImage({ photoDataUri });

    // Upload image to Firebase Storage
    const fileName = `reports/${Date.now()}-${photo.name}`;
    const file = storage.file(fileName);
    const buffer = Buffer.from(photoDataUri.split(',')[1], 'base64');
    
    await file.save(buffer, {
        metadata: { contentType: photo.type }
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
