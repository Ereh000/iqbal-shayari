
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Adjusted: Using process.env.API_KEY directly as per SDK guidelines
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchExplanation = async (urduText: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explain the following verse by Allama Iqbal in depth: "${urduText}"`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          meaning: { type: Type.STRING, description: 'Literal meaning of the verse' },
          philosophicalContext: { type: Type.STRING, description: 'Deep philosophical interpretation' },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Core Iqbalian concepts used' }
        },
        required: ['meaning', 'philosophicalContext', 'keywords']
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const autoFillVerse = async (urduText: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Given this Urdu verse: "${urduText}", provide the transliteration and a HIGH-END, highly artistic, poetic English interpretation (not a literal translation), and the likely book it belongs to.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transliteration: { type: Type.STRING },
          translation: { type: Type.STRING, description: 'A highly poetic and elevated interpretation' },
          book: { type: Type.STRING }
        },
        required: ['transliteration', 'translation', 'book']
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const generateSpeech = async (text: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Recite this Urdu poetry with an EXTREMELY DEEP, bass-heavy, resonant, and authoritative male voice. Speak loudly and clearly with profound, earth-shaking emotion and solemnity: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// Audio Utilities
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
