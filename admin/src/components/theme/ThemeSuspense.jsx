import React from "react";

const ThemeSuspense = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFFDF8] bg-opacity-90 backdrop-blur-sm transition-all duration-500">
      <div className="flex flex-col items-center gap-8">
        
        {/* Creative Jewellery Loader Animation */}
        <div className="relative flex items-center justify-center w-32 h-32">
          {/* Outer Ring - Slow rotate */}
          <div className="absolute inset-0 rounded-full border border-[#C9920A]/30 border-t-[#C9920A] animate-[spin_3s_linear_infinite]" />
          
          {/* Middle Ring - Reverse rotate */}
          <div className="absolute inset-2 rounded-full border border-[#8B6508]/20 border-b-[#8B6508] animate-[spin_2s_linear_infinite_reverse]" />
          
          {/* Inner Ring - Fast rotate */}
          <div className="absolute inset-4 rounded-full border border-yellow-600/20 border-l-yellow-600 animate-[spin_1.5s_linear_infinite]" />
          
          {/* Center Diamond Pulsing */}
          <div className="absolute flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-[#C9920A] drop-shadow-[0_0_10px_rgba(201,146,10,0.5)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 6h6.6l-5.3 3.9 2 6.1L12 14l-5.7 4 2-6.1L3 8h6.6z"/>
            </svg>
          </div>
          
          {/* Sparkle elements */}
          <div className="absolute top-0 right-4 w-2 h-2 rounded-full bg-yellow-400 animate-ping" style={{ animationDelay: '0.2s' }} />
          <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping" style={{ animationDelay: '0.7s' }} />
        </div>
        
        <div className="flex flex-col items-center">
          <p className="text-[#8B6508] font-bold tracking-[0.25em] uppercase text-sm sm:text-base animate-pulse">
            LOADING
          </p>
          <div className="mt-2 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9920A] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9920A] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9920A] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSuspense;
