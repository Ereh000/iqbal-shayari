
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Verse, PoetryExplanation, AppState } from './types';
import { INITIAL_VERSES } from './constants';
import PoetryCard from './components/PoetryCard';
import AdminPanel from './components/AdminPanel';
import { generateSpeech, fetchExplanation, decodeBase64, decodeAudioData } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'iqbal_vision_verses';
const ITEMS_PER_PAGE = 4;

const App: React.FC = () => {
  const [verses, setVerses] = useState<Verse[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_VERSES;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeVerse, setActiveVerse] = useState<Verse | null>(null);
  const [audioQueue, setAudioQueue] = useState<Verse[]>([]);
  const [explanation, setExplanation] = useState<PoetryExplanation | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nextAudioBufferRef = useRef<AudioBuffer | null>(null);
  const isProcessingQueueRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(verses));
  }, [verses]);

  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const stopAudio = useCallback(() => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    setAppState(AppState.IDLE);
    setActiveVerse(null);
  }, []);

  const clearQueue = useCallback(() => {
    stopAudio();
    setAudioQueue([]);
    isProcessingQueueRef.current = false;
  }, [stopAudio]);

  const prefetchNextInQueue = async (queue: Verse[]) => {
    if (queue.length <= 1) return;
    const nextVerse = queue[1];
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const base64Audio = await generateSpeech(nextVerse.urdu);
      if (base64Audio) {
        const audioData = decodeBase64(base64Audio);
        nextAudioBufferRef.current = await decodeAudioData(audioData, audioContextRef.current);
      }
    } catch (err) {
      console.warn("Pre-fetch failed for verse:", nextVerse.id, err);
      nextAudioBufferRef.current = null;
    }
  };

  const processQueue = useCallback(async (currentQueue: Verse[]) => {
    if (currentQueue.length === 0) {
      isProcessingQueueRef.current = false;
      setAppState(AppState.IDLE);
      setActiveVerse(null);
      return;
    }

    isProcessingQueueRef.current = true;
    const currentVerse = currentQueue[0];
    setActiveVerse(currentVerse);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      let audioBuffer: AudioBuffer;

      if (nextAudioBufferRef.current) {
        audioBuffer = nextAudioBufferRef.current;
        nextAudioBufferRef.current = null;
      } else {
        setAppState(AppState.LOADING);
        const base64Audio = await generateSpeech(currentVerse.urdu);
        if (!base64Audio) throw new Error("Audio generation failed");
        const audioData = decodeBase64(base64Audio);
        audioBuffer = await decodeAudioData(audioData, audioContextRef.current);
      }

      setAppState(AppState.SPEAKING);
      prefetchNextInQueue(currentQueue);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 1.8;
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setAudioQueue(prev => {
          const nextQueue = prev.slice(1);
          processQueue(nextQueue);
          return nextQueue;
        });
      };

      source.start();
      currentSourceRef.current = source;
    } catch (error) {
      console.error("Playback error for verse:", currentVerse.id, error);
      setErrorMessage(`Skipping verse due to error...`);
      setTimeout(() => setErrorMessage(null), 3000);
      
      setAudioQueue(prev => {
        const nextQueue = prev.slice(1);
        processQueue(nextQueue);
        return nextQueue;
      });
    }
  }, []);

  const handleToggleQueue = (verse: Verse) => {
    const isAlreadyQueued = audioQueue.some(v => v.id === verse.id);
    
    if (isAlreadyQueued) {
      if (activeVerse?.id === verse.id) {
        stopAudio();
        const nextQueue = audioQueue.slice(1);
        setAudioQueue(nextQueue);
        processQueue(nextQueue);
      } else {
        setAudioQueue(prev => prev.filter(v => v.id !== verse.id));
      }
      return;
    }

    const newQueue = [...audioQueue, verse];
    setAudioQueue(newQueue);
    
    if (!isProcessingQueueRef.current) {
      processQueue(newQueue);
    }
  };

  const handleExplain = async (verse: Verse) => {
    try {
      setAppState(AppState.LOADING);
      const data = await fetchExplanation(verse.urdu);
      setExplanation(data);
      setActiveVerse(verse);
      setIsModalOpen(true);
      setAppState(AppState.IDLE);
    } catch (error) {
      console.error("Explanation error:", error);
      setAppState(AppState.ERROR);
    }
  };

  const addVerse = (newVerse: Verse) => {
    setVerses(prev => [newVerse, ...prev]);
  };

  const deleteVerse = (id: string) => {
    if (confirm("Are you sure you want to delete this verse?")) {
      setVerses(prev => prev.filter(v => v.id !== id));
      setAudioQueue(prev => prev.filter(v => v.id !== id));
    }
  };

  const filteredVerses = useMemo(() => verses.filter(v => 
    v.urdu.includes(searchQuery) || 
    v.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.transliteration.toLowerCase().includes(searchQuery.toLowerCase())
  ), [verses, searchQuery]);

  const totalPages = Math.ceil(filteredVerses.length / ITEMS_PER_PAGE);
  const paginatedVerses = filteredVerses.slice(
    currentPage * ITEMS_PER_PAGE, 
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#064e3b] relative overflow-x-hidden selection:bg-emerald-400/30">
      {/* Global Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[80vw] max-w-[800px] aspect-square bg-emerald-400/15 blur-[100px] md:blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[60vw] max-w-[600px] aspect-square bg-emerald-300/10 blur-[80px] md:blur-[120px] rounded-full"></div>
        <img 
          src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover mix-blend-overlay opacity-[0.03]"
          alt=""
        />
      </div>

      {/* Search Overlay */}
      {isSearchVisible && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center pt-20 md:pt-24 px-4 md:px-6">
          <div className="absolute inset-0 bg-[#064e3b]/95 backdrop-blur-3xl animate-in fade-in duration-300" onClick={() => setIsSearchVisible(false)}></div>
          <div className="relative w-full max-w-3xl animate-in slide-in-from-top-6 duration-500">
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Search verses or books..."
              className="relative w-full bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-[2rem] py-4 md:py-6 px-12 md:px-16 text-emerald-950 placeholder-emerald-800/40 focus:outline-none focus:ring-4 focus:ring-emerald-400/10 transition-all shadow-2xl text-lg md:text-xl font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || e.key === 'Enter') setIsSearchVisible(false);
              }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-emerald-800/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="relative z-10 text-white shrink-0 safe-top">
        <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center shadow-xl transition-transform active:scale-95">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-400">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-lg md:text-xl font-bold serif-text tracking-wide hidden sm:block">Iqbal's Vision</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setIsSearchVisible(true)} className="bg-white/10 active:bg-white/20 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full transition-all touch-manipulation">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button onClick={() => setIsAdminOpen(true)} className="bg-white/10 active:bg-white/20 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full transition-all touch-manipulation">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-6 pb-40 md:pb-48 relative z-20">
        <div className="max-w-7xl mx-auto py-6 md:py-10">
          {paginatedVerses.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {paginatedVerses.map(verse => (
                <PoetryCard 
                  key={verse.id}
                  verse={verse}
                  onToggleQueue={handleToggleQueue}
                  onExplain={handleExplain}
                  isSpeaking={activeVerse?.id === verse.id && appState === AppState.SPEAKING}
                  isQueued={audioQueue.some(q => q.id === verse.id)}
                  isLoading={activeVerse?.id === verse.id && appState === AppState.LOADING}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-emerald-100/60 text-xl md:text-2xl font-medium serif-text italic px-4">
              No echoes found matching your search.
            </div>
          )}
        </div>
      </main>

      {/* Nebula VoiceStick - Sleek Session Navigation (Fixed Bottom) */}
      {verses.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 flex justify-center items-center z-[150] pointer-events-none safe-bottom">
          <div className="relative pointer-events-auto group/pill w-full max-w-sm">
            <div className="absolute inset-0 bg-emerald-400/20 blur-[20px] md:blur-[30px] rounded-full opacity-0 group-hover/pill:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative bg-[#052e16]/95 backdrop-blur-[60px] border border-white/10 px-3 md:px-4 py-2.5 md:py-3 rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex items-center justify-between border-b-white/5 transition-all duration-500 md:hover:scale-[1.03]">
              
              <button 
                onClick={handlePrev}
                disabled={currentPage === 0}
                className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 rounded-full transition-all active:scale-90 touch-manipulation ${
                  currentPage === 0 
                    ? 'opacity-10 cursor-not-allowed text-white/20' 
                    : 'text-emerald-400 active:bg-emerald-400/20 md:hover:bg-emerald-400/10 hover:text-emerald-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden xs:inline">Prev</span>
              </button>

              <div className="flex-1 flex items-center justify-center px-4 border-x border-white/5 mx-1">
                 <div className="flex flex-col items-center">
                    <span className="text-[7px] md:text-[8px] font-black text-emerald-400/40 uppercase tracking-[0.4em] mb-0.5">Session</span>
                    <div className="flex items-baseline gap-1.5 md:gap-2">
                       <span className="text-white font-bold serif-text text-xl md:text-2xl tabular-nums leading-none drop-shadow-md">{currentPage + 1}</span>
                       <span className="text-white/20 text-[10px] font-light uppercase">of</span>
                       <span className="text-white/40 text-xs md:text-sm font-medium tabular-nums">{totalPages || 1}</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleNext}
                disabled={currentPage >= totalPages - 1}
                className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 rounded-full transition-all active:scale-90 touch-manipulation ${
                  (currentPage >= totalPages - 1) 
                    ? 'opacity-10 cursor-not-allowed text-white/20' 
                    : 'text-emerald-400 active:bg-emerald-400/20 md:hover:bg-emerald-400/10 hover:text-emerald-300'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden xs:inline">Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Floating Audio Player */}
      {audioQueue.length > 0 && (
        <div className="fixed bottom-24 md:bottom-28 right-4 left-4 md:left-auto md:w-[440px] bg-[#1a2f23]/95 backdrop-blur-[30px] text-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.7)] z-[100] border border-white/10 transition-all duration-500 animate-in slide-in-from-bottom-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1 md:gap-1.5 h-3 md:h-3.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1 bg-emerald-400 rounded-full animate-[bounce_1.5s_infinite]" style={{ animationDelay: `${i * 0.2}s`, height: `${40 + Math.random() * 60}%` }}></div>
                ))}
              </div>
              <span className="text-[8px] md:text-[9px] font-black tracking-[0.3em] uppercase text-emerald-400/80">Reciting...</span>
            </div>
            <div className="bg-emerald-400/10 px-2 md:px-2.5 py-0.5 rounded-full border border-emerald-400/20">
              <span className="text-[7px] md:text-[8px] font-bold tracking-[0.15em] uppercase text-emerald-400">{audioQueue.length} in queue</span>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex-1 min-w-0">
              <p className="urdu-text text-lg md:text-xl truncate text-emerald-50 leading-normal">
                {activeVerse?.urdu || 'Echoing wisdom...'}
              </p>
            </div>
            <button onClick={clearQueue} className="group p-2.5 md:p-3 bg-white/5 active:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl md:rounded-2xl transition-all active:scale-90 border border-white/5 touch-manipulation">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal & Overlays */}
      {isModalOpen && explanation && activeVerse && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-[#064e3b]/90 backdrop-blur-3xl animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-500">
            <div className="p-6 md:p-10 border-b border-stone-100 flex justify-between items-start bg-white z-10">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-bold text-stone-900 serif-text">Philosophical Insight</h2>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                  <p className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">{activeVerse.book || 'Kalam-e-Iqbal'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 md:p-3.5 bg-stone-50 hover:bg-stone-100 rounded-xl md:rounded-[1.5rem] transition-all active:scale-90 border border-stone-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 custom-scrollbar">
              <p className="urdu-text text-2xl md:text-3xl text-stone-950 text-center leading-[2.5] bg-stone-50/50 p-6 rounded-2xl md:rounded-[2rem] border border-stone-100/50">
                {activeVerse.urdu}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pb-6">
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-[10px] md:text-[11px] font-black uppercase text-emerald-600 tracking-[0.4em] border-l-4 border-emerald-500 pl-4">The Essence</h3>
                  <p className="text-stone-700 leading-relaxed text-base md:text-lg font-light">{explanation.meaning}</p>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-[10px] md:text-[11px] font-black uppercase text-emerald-600 tracking-[0.4em] border-l-4 border-emerald-500 pl-4">Metaphysics</h3>
                  <p className="text-stone-700 leading-relaxed text-base md:text-lg italic serif-text font-light">{explanation.philosophicalContext}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {isAdminOpen && (
        <AdminPanel 
          verses={verses}
          onAdd={addVerse}
          onDelete={deleteVerse}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
