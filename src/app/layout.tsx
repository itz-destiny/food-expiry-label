import type { Metadata } from 'next';
import { Archivo, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MotionProvider } from '@/components/motion';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/components/auth-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const archivo = Archivo({ subsets: ['latin'], weight: ['600', '700', '800', '900'], variable: '--font-display' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'LabelCheck — Food Label Verification',
  description:
    'Intelligent Food Label Verification and Consumer Awareness System. Check expiry dates, NAFDAC registration, product records and community reports before you buy.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, archivo.variable, mono.variable, 'font-body antialiased min-h-screen bg-background flex flex-col')}>
        <AuthProvider>
          <MotionProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </MotionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
