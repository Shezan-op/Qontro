import type { Metadata } from 'next';
import { Geist, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const sourceSans = Source_Sans_3({
  variable: '--font-source-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Qontro — Founder Command Center & AI Operations',
  description: 'AI-powered operating system for founders managing teams, projects, company memory, and operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${sourceSans.variable} dark`}>
      <body className="min-h-screen bg-[#121212] text-[#f5f5f5] antialiased selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
