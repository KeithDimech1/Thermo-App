import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm-plex-sans',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm-plex-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'QC Results Viewer | Infectious Disease Testing Quality Control',
    template: '%s | QC Results Viewer',
  },
  description: 'Interactive web application to visualize and analyze quality control data for infectious disease testing assays.',
  keywords: [
    'quality control',
    'QC',
    'infectious disease',
    'diagnostic testing',
    'coefficient of variation',
    'CV',
    'laboratory',
    'assay performance',
  ],
  authors: [
    {
      name: 'EDCNET',
    },
  ],
  creator: 'EDCNET',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'QC Results Viewer',
    title: 'QC Results Viewer - Infectious Disease Testing Quality Control',
    description: 'Interactive web application to visualize and analyze quality control data for infectious disease testing assays.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body className={`${ibmPlexSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
