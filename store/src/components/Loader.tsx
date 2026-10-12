'use client';

import React from 'react';

interface LoaderProps {
  fullScreen?: boolean;
  text?: string;
}

export default function Loader({ fullScreen = true, text }: LoaderProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-all duration-500'
    : 'flex flex-col items-center justify-center p-8 w-full';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          {/* Spinner Ring: Gray track with blue-600 active segment */}
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-[3px] border-gray-100 border-t-blue-600 animate-spin" />
          
          {/* Logo container inside: perfectly centered */}
          <div className="absolute w-[100px] h-[100px] sm:w-[112px] sm:h-[112px] rounded-full bg-gray-50 flex items-center justify-center p-2.5">
            <img
              src="/logo-v2.png"
              alt="Bioinnovate Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        {text && (
          <p className="text-gray-500 font-medium tracking-wide text-sm sm:text-base">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}
