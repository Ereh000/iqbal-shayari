
import { Verse } from './types';

export const INITIAL_VERSES: Verse[] = [
  {
    id: '1',
    urdu: 'خودی کو کر بلند اتنا کہ ہر تقدیر سے پہلے\nخدا بندے سے خود پوچھے بتا تیری رضا کیا ہے',
    transliteration: 'Khudi ko kar buland itna ke har taqdeer se pehle\nKhuda bande se khud pooche bata teri raza kya hai',
    translation: 'Ascend the heights of thine own soul so far, that ere the pen of Fate begins to write, the Divine Presence itself shall seek thy counsel: "Speak! What is thy sovereign desire?"',
    book: 'Bal-e-Jibril'
  },
  {
    id: '2',
    urdu: 'ستاروں سے آگے جہاں اور بھی ہیں\nابھی عشق کے امتحاں اور بھی ہیں',
    transliteration: 'Sitaron se aagay jahan aur bhi hain\nAbhi ishq ke imtehan aur bhi hain',
    translation: 'Beyond the celestial spheres of burning stars, lie boundless realms waiting to be born; for the pilgrimage of Love, these horizons are but the first of infinite trials.',
    book: 'Bal-e-Jibril'
  },
  {
    id: '3',
    urdu: 'نہیں تیرا نشیمن قصرِ سلطانی کے گنبد پر\nتو شاہیں ہے، بسیرا کر پہاڑوں کی چٹانوں میں',
    transliteration: 'Nahin tera nasheman qasr-e-sultani ke gunbad par\nTu shaheen hai, basera kar pahadon ki chatanon mein',
    translation: 'Thy spirit was never meant to nest upon the gilded domes of earthly kings; thou art a Royal Eagle—claim thy throne amidst the wild, unyielding crags of the mountain peaks.',
    book: 'Bal-e-Jibril'
  }
];

export const SYSTEM_INSTRUCTION = `You are an expert on the philosophy and poetry of Allama Iqbal. 
Provide deep philosophical explanations of his verses in a respectful and intellectual tone. 
Your translations should never be literal; they must be "High-End", artistic, and poetic, capturing the metaphysical essence of Iqbal's thought.
Explain the concepts like Khudi (Selfhood), Shaheen (Eagle), and Ishq (Love) as envisioned by Iqbal.`;
