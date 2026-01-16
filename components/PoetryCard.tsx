
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
    <div className={`relative bg-white rounded-[2rem] p-5 md:p-7 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border transition-all duration-500 group flex flex-col overflow-hidden ${
      isSpeaking 
        ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-[0_15px_40px_-10px_rgba(5,150,105,0.2)] scale-[1.02]' 
        : 'border-stone-100 hover:border-emerald-200 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] hover:-translate-y-1'
    }`}>
      
      {/* Decorative Subtle Background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity duration-500">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
      </div>

      {/* Header Area */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-black tracking-[0.2em] text-emerald-950 uppercase bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 rounded-full w-fit backdrop-blur-sm">
            {verse.book || 'Kalam-e-Iqbal'}
          </span>
          {isQueued && !isSpeaking && (
            <div className="flex items-center gap-1 px-1 animate-in fade-in slide-in-from-left-1">
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[7px] font-bold text-amber-600 uppercase tracking-widest">In Queue</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Action: Toggle Text */}
          <button 
            onClick={toggleText}
            className={`w-8 h-8 rounded-xl border transition-all duration-300 flex items-center justify-center active:scale-90 shadow-sm ${
              showTransliteration 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-emerald-50/50 text-emerald-950 border-emerald-100/50 hover:bg-emerald-600 hover:text-white'
            }`}
            title="Toggle Transliteration"
          >
            <span className="text-[10px] font-black serif-text">T</span>
          </button>

          {/* Action: Recite */}
          <button 
            onClick={() => onToggleQueue(verse)}
            className={`w-8 h-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-sm active:scale-90 ${
              isSpeaking 
                ? 'bg-emerald-600 text-white scale-110' 
                : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-600 hover:text-white'
            }`}
            title={isSpeaking ? "Stop" : "Listen"}
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : isSpeaking ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                <rect x="14" y="4" width="4" height="16" rx="1"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content Body - Compact Height */}
      <div className="flex-1 flex flex-col items-center text-center relative z-10 py-4 min-h-[140px] md:min-h-[160px] justify-center cursor-pointer" onClick={() => onExplain(verse)}>
        <div className="w-full relative px-2">
          {showTransliteration ? (
            <p className={`serif-text text-xl sm:text-2xl md:text-3xl font-medium text-stone-700 leading-snug tracking-tight italic animate-in fade-in zoom-in-95 duration-500 transition-all ${isSpeaking ? 'text-emerald-900 scale-[1.02]' : ''}`}>
              {verse.transliteration}
            </p>
          ) : (
            <p className={`urdu-text text-2xl sm:text-3xl md:text-4xl text-stone-800 whitespace-pre-line leading-relaxed transition-all duration-500 animate-in fade-in duration-500 ${isSpeaking ? 'text-emerald-950 scale-[1.02]' : ''}`}>
              {verse.urdu}
            </p>
          )}
          
          {/* Subtle Progress Bar when speaking */}
          {isSpeaking && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 h-3 opacity-40">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-emerald-500 rounded-full animate-[bounce_1.2s_infinite]" 
                  style={{ animationDelay: `${i * 0.15}s`, height: `${40 + Math.random() * 60}%` }}
                ></div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Label */}
      <div className="mt-4 pt-3 border-t border-emerald-50 flex justify-center items-center gap-2">
         <div className="h-[1px] w-4 bg-emerald-100"></div>
         <span className="text-[9px] font-black text-emerald-950 uppercase tracking-[0.3em] group-hover:text-emerald-700 transition-colors duration-300">Allama Iqbal</span>
         <div className="h-[1px] w-4 bg-emerald-100"></div>
      </div>
    </div>
  );
};

export default PoetryCard;
