import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import NavigationBar from '@/components/NavigationBar';
import { LanguageProvider } from '@/lib/context/LanguageContext';

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
    default: 'Thermochronology Database | Malawi Rift Fission-Track and (U-Th)/He Data',
    template: '%s | Thermochronology Database',
  },
  description: 'Interactive viewer for fission-track and (U-Th)/He geochronology data from the Malawi Rift Central Basin. FAIR-compliant data following Kohn et al. (2024) reporting standards.',
  keywords: [
    'thermochronology',
    'fission-track',
    'AFT',
    'apatite fission-track',
    '(U-Th)/He',
    'AHe',
    'apatite helium',
    'geochronology',
    'Malawi Rift',
    'LA-ICP-MS',
    'thermal history',
    'FAIR data',
  ],
  authors: [
    {
      name: 'Thermochronology Research Group',
    },
  ],
  creator: 'Thermochronology Research Group',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Thermochronology Database',
    title: 'Thermochronology Database - Malawi Rift Fission-Track and (U-Th)/He Data',
    description: 'Interactive viewer for fission-track and (U-Th)/He geochronology data from the Malawi Rift Central Basin. FAIR-compliant data following Kohn et al. (2024) reporting standards.',
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
        <LanguageProvider>
          <NavigationBar />
          <main className="min-h-screen">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
