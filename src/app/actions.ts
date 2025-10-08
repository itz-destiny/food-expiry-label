'use server';

import { z } from 'zod';
import { analyzeExpiryLabelImage } from '@/ai/flows/analyze-expiry-label-image';

const FormSchema = z.object({
  productName: z.string().min(1, 'Product name is required.'),
  labelDescription: z.string().min(1, 'Description is required.'),
  storeLocation: z.string().min(1, 'Store location is required.'),
  photo: z.instanceof(File, { message: 'A photo is required.' }),
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
  });

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join(' ');
    return {
      message: `Invalid form data. ${errorMessages}`,
      error: true,
    };
  }
  
  const { photo } = validatedFields.data;

  if (photo.size === 0) {
    return {
      message: 'A photo of the label is required.',
      error: true,
    };
  }
  
  try {
    const photoDataUri = await fileToDataUri(photo);

    const result = await analyzeExpiryLabelImage({ photoDataUri });

    // In a real app, you would save the report and analysis to a database here.
    
    return {
      message: 'Report submitted successfully. See analysis below.',
      analysis: result.analysisResult,
      error: false,
    };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      message: `An error occurred during image analysis: ${errorMessage}`,
      error: true,
    };
  }
}
