
import React, { useState } from 'react';
import { Verse } from '../types';

interface PoetryCardProps {
  verse: Verse;
  onToggleQueue: (verse: Verse) => void;
  onExplain: (verse: Verse) => void;
  isSpeaking: boolean;
  isQueued: boolean;
  isLoading: boolean;
}

const PoetryCard: React.FC<PoetryCardProps> = ({ 
  verse, 
  onToggleQueue, 
  onExplain, 
  isSpeaking, 
  isQueued, 
  isLoading 
}) => {
  const [showTransliteration, setShowTransliteration] = useState(false);

  const toggleText = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTransliteration(!showTransliteration);
  };

  return (
    <div className={`relative bg-white rounded-[2.5rem] p-7 md:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-all duration-500 group flex flex-col overflow-hidden ${
      isSpeaking 
        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-[0_20px_50px_-12px_rgba(5,150,105,0.25)] scale-[1.01]' 
        : 'border-stone-100 hover:border-emerald-200 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1'
    }`}>
      
      {/* Subtle Decorative Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-500">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Dynamic Background Gradient */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Header Info */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-black tracking-[0.2em] text-emerald-700 uppercase bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-full w-fit backdrop-blur-sm">
            {verse.book || 'Kalam-e-Iqbal'}
          </span>
          {isQueued && !isSpeaking && (
            <div className="flex items-center gap-1.5 px-1 animate-in fade-in slide-in-from-left-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">Next in Queue</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Action: Toggle Text (T) */}
          <button 
            onClick={toggleText}
            className={`w-9 h-9 rounded-full border border-emerald-100/50 backdrop-blur-sm transition-all duration-300 flex items-center justify-center active:scale-90 shadow-sm group/btn ${
              showTransliteration 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100'
            }`}
            title="Toggle Transliteration"
          >
            <span className="text-xs font-black serif-text group-hover/btn:scale-110 transition-transform">T</span>
          </button>

          {/* Action: Recite */}
          <button 
            onClick={() => onToggleQueue(verse)}
            className={`w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm active:scale-90 ${
              isSpeaking 
                ? 'bg-emerald-600 text-white scale-110' 
                : 'bg-emerald-50/80 text-emerald-800 border border-emerald-100/50 hover:bg-emerald-600 hover:text-white'
            }`}
            title={isSpeaking ? "Pause" : "Listen"}
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : isSpeaking ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="3" height="16"></rect>
                <rect x="15" y="4" width="3" height="16"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Poetic Content - Fixed Min Height for Stability */}
      <div className="flex-1 flex flex-col items-center text-center relative z-10 py-6 md:py-8 min-h-[220px] justify-center">
        <div className="w-full relative px-2">
          {showTransliteration ? (
            <p className={`serif-text text-3xl sm:text-4xl md:text-5xl font-medium text-stone-800 leading-[1.4] tracking-tight italic animate-in fade-in zoom-in duration-500 transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.03)] ${isSpeaking ? 'scale-[1.03] text-emerald-900' : ''}`}>
              {verse.transliteration}
            </p>
          ) : (
            <p className={`urdu-text text-3xl sm:text-4xl md:text-5xl text-stone-900 whitespace-pre-line leading-[2.1] tracking-normal transition-all duration-500 drop-shadow-[0_2px_10px_rgba(0,0,0,0.02)] animate-in fade-in duration-500 ${isSpeaking ? 'scale-[1.03] text-emerald-950' : ''}`}>
              {verse.urdu}
            </p>
          )}
          
          {/* Audio Visualizer Effect when speaking */}
          {isSpeaking && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-end gap-1 h-5 opacity-50">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-emerald-500 rounded-full animate-[bounce_1s_infinite]" 
                  style={{ animationDelay: `${i * 0.1}s`, height: `${30 + Math.random() * 70}%` }}
                ></div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-12 h-[2px] w-16 bg-gradient-to-r from-transparent via-emerald-100 to-transparent group-hover:w-24 transition-all duration-700"></div>
      </div>
      
      {/* Bottom Poet Name - Permanently Visible */}
      <div className="mt-4 flex justify-center pb-2">
         <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.4em] drop-shadow-sm group-hover:text-emerald-600 transition-colors duration-300">Allama Iqbal</span>
      </div>
    </div>
  );
};

export default PoetryCard;
