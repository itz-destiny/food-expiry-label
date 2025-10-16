'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { submitReportAction, type SubmitReportResponse } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Package, ScanSearch, Store, UserX } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPending} size="lg">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2" />}
      Analyze and Submit Report
    </Button>
  );
}

function LoggedOutWarning() {
    return (
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserX /> Please Log In</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p>You must be logged in to submit a report.</p>
                <div className="flex gap-4 justify-center">
                    <Button asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href="/signup">Sign Up</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function Home() {
  const [state, setState] = useState<SubmitReportResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');

  const { user, isUserLoading } = useUser();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(null);
      setPreview(null);
    }
  };

  useEffect(() => {
    if (state && !state.error) {
      formRef.current?.reset();
      setPreview(null);
      setPhotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
        setState({ message: 'You must be logged in to submit a report.', error: true });
        return;
    }

    setState(null);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (!photoFile) {
        setState({ message: 'A photo is required.', error: true });
        return;
    }

    startTransition(async () => {
      const reader = new FileReader();
      reader.readAsDataURL(photoFile);
      reader.onloadend = async () => {
        const photoDataUri = reader.result as string;
        const payload = { ...data, photoDataUri, userId: user.uid };
        const result = await submitReportAction(payload);
        setState(result);
      };
      reader.onerror = () => {
        setState({ message: 'Failed to read the image file.', error: true });
      }
    });
  };


  return (
    <div className="space-y-8">
      {heroImage && (
        <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden group shadow-lg">
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
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-headline font-black uppercase tracking-wider">Food Expiry Alert</h1>
            <p className="text-base sm:text-lg md:text-xl max-w-3xl mt-4">
              Your eyes on expiry dates. Report suspicious food labels and help ensure community food safety.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid lg:grid-cols-5 gap-8 items-start">
        { isUserLoading ? (
            <div className="lg:col-span-3">
                <Skeleton className="h-[650px] w-full" />
            </div>
        ) : user ? (
            <div className="lg:col-span-3">
                <Card>
                    <form onSubmit={handleSubmit} ref={formRef}>
                    <CardHeader>
                        <CardTitle>Submit a New Report</CardTitle>
                        <CardDescription>Fill out the details below. All fields are required.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                        <SubmitButton isPending={isPending} />
                    </CardFooter>
                    </form>
                </Card>
            </div>
        ) : (
            <LoggedOutWarning />
        )}


        <div className="lg:col-span-2 lg:sticky top-24 space-y-6">
          <h2 className="text-3xl font-headline font-bold">Analysis Result</h2>
          {isPending && !state && (
             <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg min-h-[300px]">
                <Loader2 className="h-16 w-16 mb-4 animate-spin text-muted-foreground/30" />
                <p>Analyzing... please wait.</p>
              </div>
          )}
          {state && (
            <Alert variant={state.error ? 'destructive' : 'default'} className={cn(!state.error && "bg-accent/50 border-accent")}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{state.error ? 'Error' : 'Analysis Complete'}</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          {state?.analysis ? (
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
            !isPending && (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg min-h-[300px]">
                <ScanSearch className="h-16 w-16 mb-4 text-muted-foreground/30" />
                <p>The analysis of your submitted image will appear here after you submit a report.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
