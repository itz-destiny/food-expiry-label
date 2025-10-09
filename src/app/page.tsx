'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitReport } from '@/app/actions';
import { useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Package, ScanSearch, Store } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { user } = useUser();
  return (
    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={pending || !user} size="lg">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2" />}
      Analyze and Submit Report
    </Button>
  );
}

export default function Home() {
  const initialState = { message: '', error: false };
  const [state, dispatch] = useActionState(submitReport, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');

  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  useEffect(() => {
    if (state.message && !state.error) {
      formRef.current?.reset();
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [state]);

  return (
    <div className="space-y-8">
      {heroImage && (
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden group shadow-lg">
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4">
            <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-wider">Food Expiry Alert</h1>
            <p className="text-lg md:text-xl max-w-3xl mt-4">
              Your eyes on expiry dates. Report suspicious food labels and help ensure community food safety.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid md:grid-cols-5 gap-8 items-start">
        <div className="md:col-span-3">
          <Card>
            <form action={dispatch} ref={formRef}>
              <CardHeader>
                <CardTitle>Submit a New Report</CardTitle>
                <CardDescription>Fill out the details below. All fields are required.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 {user && <input type="hidden" name="userId" value={user.uid} />}
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="productName" name="productName" placeholder="e.g., Organic Milk, 1 Gallon" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeLocation">Store Location</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="storeLocation" name="storeLocation" placeholder="e.g., Main St. Grocer, Aisle 4" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labelDescription">Description of Suspicion</Label>
                  <Textarea id="labelDescription" name="labelDescription" placeholder="e.g., The expiry date seems to be printed over an old one..." required rows={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Upload Photo of Label</Label>
                  <Input id="photo" name="photo" type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef} required />
                  {preview && (
                    <div className="mt-4 relative w-full aspect-video rounded-md overflow-hidden border-2 border-dashed">
                      <Image src={preview} alt="Label preview" fill className="object-contain" />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <SubmitButton />
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2 sticky top-24 space-y-6">
          <h2 className="text-3xl font-headline font-bold">Analysis Result</h2>
          {state.message && (
            <Alert variant={state.error ? 'destructive' : 'default'} className={cn(!state.error && "bg-accent/50 border-accent")}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{state.error ? 'Error' : 'Submission Received'}</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          {state.analysis ? (
            <Card className="animate-in fade-in-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanSearch />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{state.analysis}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg min-h-[300px]">
              <ScanSearch className="h-16 w-16 mb-4 text-muted-foreground/30" />
              <p>The analysis of your submitted image will appear here after you submit a report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
