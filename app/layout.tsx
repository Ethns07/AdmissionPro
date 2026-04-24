import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteGuard } from '@/components/RouteGuard';
import { PageTransition } from '@/components/PageTransition';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'AdmissionPro | Admission Management System',
  description: 'Comprehensive Admission Management System with RBAC and Rule-Based Admission System.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
        <FirebaseProvider>
          <ErrorBoundary>
            <RouteGuard>
              <PageTransition>
                {children}
              </PageTransition>
            </RouteGuard>
          </ErrorBoundary>
        </FirebaseProvider>
      </body>
    </html>
  );
}
