import type { Metadata } from 'next';
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { Analytics } from './components/Analytics';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SelAI Music Generator - Advanced AI Music Creation',
    template: '%s | SelAI Music Generator'
  },
  description: 'Create professional music with AI. Generate, remix, and train AI models with our advanced music generation platform. Start creating today!',
  keywords: [
    'AI music generation',
    'music creation',
    'AI training',
    'music production',
    'remix music',
    'stem separation',
    'MIDI generation',
    'music AI'
  ],
  authors: [{ name: 'SelAI Music Team' }],
  creator: 'SelAI Music Team',
  publisher: 'SelAI Music',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'SelAI Music Generator - Advanced AI Music Creation',
    description: 'Create professional music with AI. Generate, remix, and train AI models with our advanced music generation platform.',
    siteName: 'SelAI Music Generator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SelAI Music Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SelAI Music Generator - Advanced AI Music Creation',
    description: 'Create professional music with AI. Generate, remix, and train AI models with our advanced music generation platform.',
    images: ['/og-image.png'],
    creator: '@selaimusic',
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://selai-music-storage.s3.amazonaws.com" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//selai-music-storage.s3.amazonaws.com" />
      </head>
      <body className={`${inter.className} antialiased bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white min-h-screen`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#f8fafc',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f8fafc',
                },
              },
            }}
          />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
} 