'use server';

import { z } from 'zod';
import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';
import { collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { initializeFirebase, addDocumentNonBlocking } from '@/firebase';
import { revalidatePath } from 'next/cache';

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
    const { firestore, firebaseApp } = initializeFirebase();
    const storage = getStorage(firebaseApp);

    const photoDataUri = await fileToDataUri(photo);

    const analysisResult = await analyzeExpiryLabelImage({ photoDataUri });

    // Upload image to Firebase Storage
    const storageRef = ref(storage, `reports/${Date.now()}-${photo.name}`);
    const uploadResult = await uploadString(storageRef, photoDataUri, 'data_url');
    const photoUrl = await getDownloadURL(uploadResult.ref);

    // Save report to Firestore
    const reportsCollection = collection(firestore, 'reports');
    addDocumentNonBlocking(reportsCollection, {
        productName,
        storeLocation,
        labelDescription,
        userId,
        photoUrl,
        analysisResult: analysisResult.analysisResult,
        reportStatus: "Pending",
        submissionDate: serverTimestamp(),
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
