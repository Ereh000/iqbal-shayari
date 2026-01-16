
export interface Verse {
  id: string;
  urdu: string;
  transliteration: string;
  translation: string;
  book?: string;
}

export interface PoetryExplanation {
  meaning: string;
  philosophicalContext: string;
  keywords: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SPEAKING = 'SPEAKING',
  QUEUED = 'QUEUED',
  ERROR = 'ERROR'
}
