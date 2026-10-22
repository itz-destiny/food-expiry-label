'use server';

/**
 * Reads the verification fields printed on a food label photo, so shoppers can
 * verify a product by photographing it instead of typing.
 */

import {ai, withModelFallback} from '@/ai/genkit';
import {z} from 'genkit';

const ReadLabelInputSchema = z.object({
  photoDataUri: z.string().describe("Photo of a food package or label as a data URI ('data:<mime>;base64,<data>')."),
});

const ReadLabelOutputSchema = z.object({
  productName: z.string().nullable().describe('Product name as printed, including brand and variant, e.g. "Tropika Orange Juice". Null if unreadable.'),
  barcode: z.string().nullable().describe('The digits printed under the barcode, digits only. Null if not visible.'),
  nafdacNumber: z.string().nullable().describe('NAFDAC registration number exactly as printed, e.g. "A1-1234" or "01-1234". Null if none is printed.'),
  expiryDate: z
    .string()
    .nullable()
    .describe('Expiry / use-by / best-before date as YYYY-MM-DD. If only month and year are printed, use the last day of that month. Null if none.'),
  notes: z.string().describe('One short sentence on anything unclear, damaged, altered or missing on the label.'),
});

export type ReadLabelOutput = z.infer<typeof ReadLabelOutputSchema>;

const readLabelFlow = ai.defineFlow(
  {name: 'readLabelFlow', inputSchema: ReadLabelInputSchema, outputSchema: ReadLabelOutputSchema},
  async ({photoDataUri}) => {
    const {output} = await withModelFallback((model) => ai.generate({
      model,
      output: {schema: ReadLabelOutputSchema},
      prompt: [
        {
          text:
            'You read food packaging for a food-safety app in Nigeria. Extract only what is actually printed on this label. ' +
            'Never guess or invent values: use null for anything not clearly visible. ' +
            'Dates on Nigerian packs are usually day/month/year.',
        },
        {media: {url: photoDataUri}},
      ],
    }));
    if (!output) throw new Error('The model returned no result.');
    return output;
  }
);

export async function readLabel(photoDataUri: string): Promise<ReadLabelOutput> {
  return readLabelFlow({photoDataUri});
}
