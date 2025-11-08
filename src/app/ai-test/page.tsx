'use client';

import { useRef, useState, useTransition } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, Info } from 'lucide-react';
import { testAnalyzeImageAction, type TestAnalyzeImageResponse } from '@/app/actions';

export default function AiTestPage() {
  const [dataUri, setDataUri] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [result, setResult] = useState<TestAnalyzeImageResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewSrc(null);
      setClientError('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewSrc(result);
      setDataUri(result);
      setClientError(null);
    };
    reader.onerror = () => {
      setClientError('Failed to read image file. Please try another image.');
      setPreviewSrc(null);
      setDataUri('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    if (!dataUri.trim()) {
      setClientError('Please select an image or paste a valid data URI.');
      return;
    }

    setClientError(null);

    startTransition(async () => {
      const response = await testAnalyzeImageAction(dataUri.trim());
      setResult(response);
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis Playground</CardTitle>
          <CardDescription>
            Upload a label photo or paste a <code>data:&lt;mimetype&gt;;base64,&lt;data&gt;</code> string to run the Gemini flow directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="image-file">
                Choose image file
              </label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </div>

            {previewSrc && (
              <div className="relative w-full overflow-hidden rounded-md border bg-muted/30">
                <img src={previewSrc} alt="Selected label preview" className="max-h-72 w-full object-contain" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="data-uri">
                Or paste data URI
              </label>
              <Textarea
                id="data-uri"
                value={dataUri}
                onChange={(event) => setDataUri(event.target.value)}
                placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                You can edit the generated string before submitting. The analyzer will use the current contents of this field.
              </p>
            </div>

            {clientError && clientError.length > 0 && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{clientError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Analysis...
                </>
              ) : (
                'Run Analysis'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Alert variant={result.error ? 'destructive' : 'default'}>
          <Info className="h-4 w-4" />
          <AlertTitle>{result.error ? 'Error' : 'Analysis Result'}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap text-sm">
            {result.error ? result.error : result.analysisResult}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

