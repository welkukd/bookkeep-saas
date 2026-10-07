import type { Metadata, Viewport } from 'next';
import { Inter, DM_Serif_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: '400',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Bookkeep — Intelligent Bookkeeping for Modern Life',
    template: '%s | Bookkeep',
  },
  description: 'Natural language expense tracking, beautiful visualizations, credit card insights, and privacy-first architecture. Built for individuals, families, and small businesses.',
  keywords: ['bookkeeping', 'expense tracking', 'personal finance', 'budgeting', 'financial planning', 'credit card management'],
  authors: [{ name: 'Bookkeep' }],
  creator: 'Bookkeep',
  publisher: 'Bookkeep',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bookkeep.app',
    siteName: 'Bookkeep',
    title: 'Bookkeep — Intelligent Bookkeeping for Modern Life',
    description: 'Natural language expense tracking, beautiful visualizations, credit card insights, and privacy-first architecture.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Bookkeep Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bookkeep — Intelligent Bookkeeping for Modern Life',
    description: 'Natural language expense tracking, beautiful visualizations, credit card insights.',
    images: ['/og-image.svg'],
    creator: '@bookkeepapp',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0d9488',
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://api.resend.com" />
      </head>
      <body className="antialiased bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}