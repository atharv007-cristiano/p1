import React from 'react';
import { Skeleton, Card } from './shared';

interface SkeletonProps {
  view: 'detect' | 'result' | 'history' | 'alerts' | 'api' | 'settings' | 'webrtc' | 'nav';
}

export const LoadingSkeletons: React.FC<SkeletonProps> = ({ view }) => {
  
  // 1. TOP NAV SKELETON
  if (view === 'nav') {
    return (
      <div className="w-full h-[60px] bg-white dark:bg-[#111111] border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-16 h-2" />
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          <Skeleton className="w-16 h-5" />
          <Skeleton className="w-16 h-5" />
          <Skeleton className="w-16 h-5" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-5 rounded-pill" />
          <Skeleton className="w-6 h-6 rounded-elem" />
          <Skeleton className="w-7 h-7 rounded-full" />
        </div>
      </div>
    );
  }

  // 2. DETECT MAIN SKELETON
  if (view === 'detect') {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="flex justify-between min-h-[96px] bg-white dark:bg-[#161616]">
              <div className="flex flex-col gap-2 w-full">
                <Skeleton className="w-24 h-2.5" />
                <Skeleton className="w-16 h-6 mt-1" />
                <Skeleton className="w-32 h-2" />
              </div>
            </Card>
          ))}
        </div>
        {/* Large Drop Zone */}
        <Card className="w-full h-80 bg-white dark:bg-[#161616] p-8 flex flex-col items-center justify-center">
          <Skeleton className="w-12 h-12 rounded-full mb-4" />
          <Skeleton className="w-48 h-3.5 mb-2" />
          <Skeleton className="w-64 h-2.5 mb-8" />
          <div className="flex gap-2">
            <Skeleton className="w-20 h-4 rounded-pill" />
            <Skeleton className="w-20 h-4 rounded-pill" />
            <Skeleton className="w-20 h-4 rounded-pill" />
          </div>
        </Card>
        {/* Secondary 3 Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-white dark:bg-[#161616] p-5 h-44 flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Skeleton className="w-8 h-8 rounded-elem" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="w-20 h-3" />
                    <Skeleton className="w-12 h-2" />
                  </div>
                </div>
                <Skeleton className="w-full h-2.5 mt-4" />
                <Skeleton className="w-3/4 h-2.5" />
              </div>
              <Skeleton className="w-full h-8 mt-2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 3. ANALYSIS RESULTS SKELETON
  if (view === 'result') {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none pb-12">
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-28 h-2.5" />
          </div>
          <Skeleton className="w-24 h-8" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-[#161616] p-6 h-96 flex flex-col items-center justify-between">
            <Skeleton className="w-20 h-3 self-start" />
            <Skeleton className="w-40 h-40 rounded-full" />
            <Skeleton className="w-28 h-5 rounded-pill" />
            <Skeleton className="w-48 h-3" />
          </Card>
          <Card className="bg-white dark:bg-[#161616] p-6 h-96 flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <Skeleton className="w-36 h-3" />
              <Skeleton className="w-48 h-2" />
            </div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <Skeleton className="w-20 h-2.5" />
                  <Skeleton className="w-8 h-2.5" />
                </div>
                <Skeleton className="w-full h-2 rounded-pill" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  // 4. WEBRTC LIVE STREAM SKELETON
  if (view === 'webrtc') {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none">
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-48 h-2.5" />
          </div>
          <Skeleton className="w-28 h-8" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-white dark:bg-[#161616] p-5 h-80 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="w-24 h-3" />
                  <Skeleton className="w-16 h-2" />
                </div>
                <Skeleton className="w-12 h-4 rounded-pill" />
              </div>
              <Skeleton className="w-full h-28 rounded-elem mt-3" />
              <div className="flex gap-1">
                <Skeleton className="w-14 h-4 rounded-pill" />
                <Skeleton className="w-14 h-4 rounded-pill" />
                <Skeleton className="w-14 h-4 rounded-pill" />
              </div>
              <Skeleton className="w-full h-1.5 rounded-pill" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 5. HISTORY AUDIT TABLE SKELETON
  if (view === 'history') {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none">
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-52 h-2.5" />
          </div>
        </div>
        <div className="flex justify-between p-4 bg-white dark:bg-[#161616] rounded-card border-thin-gray">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-32 h-8" />
        </div>
        <Card className="p-0 bg-white dark:bg-[#161616] border-thin-gray flex flex-col">
          <div className="h-10 bg-[#FAFAFA] dark:bg-[#1A1A1A] border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 flex items-center px-5">
            <Skeleton className="w-20 h-3" />
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 flex items-center justify-between px-5">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="w-40 h-3" />
              </div>
              <Skeleton className="w-16 h-3" />
              <Skeleton className="w-12 h-3" />
              <Skeleton className="w-12 h-4 rounded-pill" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // 6. ALERT CENTRE SKELETON
  if (view === 'alerts') {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none">
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-28 h-4" />
            <Skeleton className="w-40 h-2.5" />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-white dark:bg-[#161616] p-4 flex justify-between items-center h-16 border-thin-gray">
            <div className="flex items-center gap-3">
              <Skeleton className="w-2.5 h-2.5 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="w-16 h-3 rounded-pill" />
                <Skeleton className="w-64 h-3" />
              </div>
            </div>
            <Skeleton className="w-12 h-6" />
          </Card>
        ))}
      </div>
    );
  }

  // 7. API DOCS SKELETON
  if (view === 'api') {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none">
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-48 h-2.5" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-[#161616] p-5 h-80 flex flex-col justify-between">
            <Skeleton className="w-24 h-3.5" />
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-3/4 h-3" />
            <Skeleton className="w-full h-8" />
          </Card>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="bg-white dark:bg-[#161616] p-5 h-96 flex flex-col justify-between">
              <div className="flex gap-2">
                <Skeleton className="w-16 h-6" />
                <Skeleton className="w-24 h-6" />
              </div>
              <Skeleton className="w-full h-16" />
              <Skeleton className="w-full h-32" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 8. SETTINGS CONFIG SKELETON
  if (view === 'settings') {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none">
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-52 h-2.5" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="bg-white dark:bg-[#161616] p-5 h-96 flex flex-col justify-between">
              <Skeleton className="w-28 h-3.5 border-b pb-2" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="flex gap-2">
                      <Skeleton className="w-8 h-8 rounded-elem" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="w-16 h-3" />
                        <Skeleton className="w-20 h-2.5" />
                      </div>
                    </div>
                    <Skeleton className="w-8 h-5 rounded-pill" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card className="bg-white dark:bg-[#161616] p-5 h-96 flex flex-col justify-between">
            <Skeleton className="w-24 h-3.5" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </Card>
        </div>
      </div>
    );
  }

  return null;
};
