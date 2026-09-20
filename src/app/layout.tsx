import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';

import { AppShell } from '@/components/shell/AppShell';
import { Backdrop } from '@/components/shell/Backdrop';
import { Providers } from '@/components/shell/Providers';

import './globals.css';

// Self-hosted by next/font: no external request, no layout shift, no FOUT.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://weather.alexball.dev'),
  title: 'Weather',
  description:
    'A weather command center built on National Weather Service data: live conditions, active alerts, hourly and seven-day forecasts, with an advanced mode for the meteorology underneath.',
  applicationName: 'Weather',
  openGraph: {
    title: 'Weather',
    description:
      'Live NWS observations, alerts, and forecasts in a meteorological operations interface.',
    url: 'https://weather.alexball.dev',
    siteName: 'Weather',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0B0F14',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          Skip to weather
        </a>
        <Backdrop />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
