'use client';

import React from 'react';
import '../index.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { TopNav } from '../components/TopNav';
import { OnboardingWizard } from '../components/OnboardingWizard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>DeepShield — Beyond the Illusion</title>
        <meta name="description" content="AI multi-modal deepfake detection and forensics enterprise portal" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-[#FFFFFF] dark:bg-[#111111] text-[#111111] dark:text-white flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-[#0C447C]/20">
        <ThemeProvider>
          {/* Onboarding Wizard modal overlays */}
          <OnboardingWizard />

          {/* Sticky Header Navigation */}
          <TopNav />

          {/* Core App Container */}
          <main className="flex-1 w-full py-8 overflow-y-auto max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </main>

          {/* Institutional Forensic Footer */}
          <footer className="w-full py-6 border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 bg-transparent flex items-center justify-center select-none shrink-0">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">
              DeepShield Forensic Ecosystem · IEEE Forensics v1.2.4
            </span>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
