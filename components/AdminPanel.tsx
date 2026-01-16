
import React, { useState, useEffect, useRef } from 'react';
import { Verse } from '../types';
import { autoFillVerse } from '../services/geminiService';

interface AdminPanelProps {
  verses: Verse[];
  onAdd: (verse: Verse) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ verses, onAdd, onDelete, onClose }) => {
  const [newVerse, setNewVerse] = useState<Partial<Verse>>({
    urdu: '',
    transliteration: '',
    translation: '',
    book: ''
  });
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const autoFillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-translate logic
  useEffect(() => {
    if (newVerse.urdu && newVerse.urdu.trim().length > 10 && !newVerse.translation) {
      if (autoFillTimeoutRef.current) clearTimeout(autoFillTimeoutRef.current);
      
      autoFillTimeoutRef.current = setTimeout(() => {
        handleAutoFill();
      }, 2000); 
    }

    return () => {
      if (autoFillTimeoutRef.current) clearTimeout(autoFillTimeoutRef.current);
    };
  }, [newVerse.urdu]);

  const handleAutoFill = async () => {
    if (!newVerse.urdu || isAutoFilling) return;
    
    setIsAutoFilling(true);
    try {
      const data = await autoFillVerse(newVerse.urdu);
      setNewVerse(prev => ({
        ...prev,
        transliteration: prev.transliteration || data.transliteration,
        translation: prev.translation || data.translation,
        book: prev.book || data.book
      }));
    } catch (error) {
      console.error("Auto-fill failed", error);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVerse.urdu || !newVerse.translation) return;
    
    onAdd({
      ...newVerse as Verse,
      id: Date.now().toString()
    });
    
    setNewVerse({ urdu: '', transliteration: '', translation: '', book: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-12">
      <div className="absolute inset-0 bg-[#1c1917]/80 backdrop-blur-xl transition-all duration-500 animate-in fade-in" onClick={onClose}></div>
      <div className="bg-white w-full max-w-6xl h-[95vh] sm:h-[85vh] rounded-t-[3rem] sm:rounded-[3rem] relative z-10 flex flex-col overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-20 duration-500">
        
        {/* Header */}
        <div className="p-8 sm:p-10 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 serif-text">Curator Panel</h2>
            <p className="text-sm text-stone-400 font-medium tracking-wide">Manage the wisdom in your local archives</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl transition-all active:scale-90 group border border-stone-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-stone-400 group-hover:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Form Section */}
            <section className="space-y-10">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600">Archival Form</h3>
                  <div className="h-1 w-8 bg-emerald-600/30 rounded-full"></div>
                </div>
                {isAutoFilling && (
                  <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse border border-emerald-100">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    AI Transcription...
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 px-1">Sacred Verse (Urdu)</label>
                  <textarea 
                    required
                    value={newVerse.urdu}
                    onChange={(e) => setNewVerse({ ...newVerse, urdu: e.target.value })}
                    className="w-full urdu-text text-2xl p-8 bg-stone-50/50 border border-stone-100 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-200 outline-none transition-all text-stone-900 shadow-inner min-h-[160px]"
                    placeholder="کلام یہاں درج کریں..."
                  />
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-stone-400 italic">High-end reflection will manifest after you pause.</p>
                    <button 
                      type="button"
                      onClick={handleAutoFill}
                      disabled={!newVerse.urdu || isAutoFilling}
                      className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 flex items-center gap-2 disabled:opacity-30 group transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Invoke Poetic Muse
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 px-1">Divan / Book</label>
                    <input 
                      type="text"
                      value={newVerse.book}
                      onChange={(e) => setNewVerse({ ...newVerse, book: e.target.value })}
                      className="w-full p-5 bg-stone-50/50 border border-stone-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-200 outline-none text-stone-900 transition-all font-medium"
                      placeholder="e.g. Bal-e-Jibril"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 px-1">Roman Script</label>
                    <input 
                      type="text"
                      value={newVerse.transliteration}
                      onChange={(e) => setNewVerse({ ...newVerse, transliteration: e.target.value })}
                      className="w-full p-5 bg-stone-50/50 border border-stone-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-200 outline-none text-stone-900 transition-all font-medium"
                      placeholder="Transliteration"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 px-1">Artistic Interpretation</label>
                  <textarea 
                    required
                    value={newVerse.translation}
                    onChange={(e) => setNewVerse({ ...newVerse, translation: e.target.value })}
                    className={`w-full p-8 bg-stone-50/50 border border-stone-100 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-200 outline-none font-serif text-xl italic text-stone-800 transition-all min-h-[140px] shadow-inner ${isAutoFilling ? 'opacity-40 grayscale' : 'opacity-100'}`}
                    placeholder="Enter an elevated, poetic interpretation..."
                  />
                </div>

                <button 
                  type="submit"
                  className="group w-full py-6 bg-[#064e3b] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-[#065f46] transition-all shadow-xl hover:shadow-emerald-900/30 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                  Commit to Archives
                </button>
              </form>
            </section>

            {/* List Section */}
            <section className="space-y-10">
              <div className="space-y-1">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">Current Collection ({verses.length})</h3>
                <div className="h-1 w-8 bg-stone-200 rounded-full"></div>
              </div>
              
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-6 custom-scrollbar">
                {verses.length > 0 ? verses.map((verse) => (
                  <div key={verse.id} className="p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 flex justify-between items-center group hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-emerald-100 transition-all duration-500">
                    <div className="overflow-hidden flex-1 space-y-3">
                      <p className="urdu-text text-xl text-stone-900 leading-[1.8] group-hover:text-emerald-950 transition-colors">{verse.urdu}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{verse.book || 'Unknown Book'}</span>
                        <div className="w-1 h-1 bg-stone-300 rounded-full"></div>
                        <span className="text-[9px] font-bold text-stone-400 truncate">{verse.transliteration}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onDelete(verse.id)}
                      className="p-4 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all ml-6 active:scale-90"
                      title="Exile Verse"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )) : (
                  <div className="py-20 text-center space-y-6 bg-stone-50/30 rounded-[3rem] border border-dashed border-stone-200">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <p className="serif-text italic text-stone-400 text-lg">The archives are empty.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
