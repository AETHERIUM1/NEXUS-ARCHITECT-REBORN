import { VoiceOption } from '../types';

let voices: SpeechSynthesisVoice[] = [];
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Primes the speech synthesis engine to address browser autoplay policies.
 * This should be called after the first user interaction (e.g., a click).
 * It speaks a silent utterance to "unlock" the API.
 */
export function primeSpeechEngine() {
  if (typeof window.speechSynthesis === 'undefined') {
    return;
  }
  
  // Trigger voice loading if it hasn't started yet.
  initializeVoices();
  
  // If the engine is already active, no need to prime.
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    return;
  }
  
  // Clear any previous state just in case.
  window.speechSynthesis.cancel();

  // A silent utterance with a single space can reliably wake the engine.
  const utterance = new SpeechSynthesisUtterance(' ');
  utterance.volume = 0;
  
  try {
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech engine priming failed, this may be expected.", e);
  }
}


// Robustly prime the speech engine on the user's first interaction with the page.
// This solves browsers blocking audio that doesn't originate from a user gesture,
// especially for the initial greeting after a page refresh.
if (typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined') {
    const primeEngineOnFirstInteraction = () => {
        primeSpeechEngine();
        // The listeners remove themselves after the first invocation.
    };
    // Use { once: true } for cleaner, automatic removal.
    window.addEventListener('click', primeEngineOnFirstInteraction, { once: true });
    window.addEventListener('keydown', primeEngineOnFirstInteraction, { once: true });
    window.addEventListener('scroll', primeEngineOnFirstInteraction, { once: true });
}


function initializeVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesPromise) {
    return voicesPromise;
  }
  
  voicesPromise = new Promise((resolve) => {
    if (typeof window.speechSynthesis === 'undefined') {
      console.warn('Speech Synthesis not supported by this browser.');
      return resolve([]);
    }

    const getAndResolve = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
            voices = availableVoices;
            window.speechSynthesis.onvoiceschanged = null; // Clean up listener
            resolve(voices);
            return true;
        }
        return false;
    };

    if (getAndResolve()) return;

    const fallbackTimeout = setTimeout(() => {
        window.speechSynthesis.onvoiceschanged = null;
        if(!getAndResolve()){
            console.warn("Speech synthesis voices did not load within the timeout.");
            resolve([]);
        }
    }, 1000);

    window.speechSynthesis.onvoiceschanged = () => {
        clearTimeout(fallbackTimeout);
        getAndResolve();
    };
  });

  return voicesPromise;
}

// Ensure voices are loaded on module start
initializeVoices();

export async function getVoices(): Promise<VoiceOption[]> {
  const synthVoices = await initializeVoices();
  return synthVoices.map(v => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }));
}

export async function speak(
    text: string, 
    voiceURI: string | null, 
    rate: number = 1, 
    pitch: number = 1.1,
    onStart?: () => void,
    onEnd?: () => void
): Promise<void> {
  if (!text || !text.trim() || typeof window.speechSynthesis === 'undefined') {
    onEnd?.();
    return;
  }

  const allVoices = await initializeVoices();
  let voiceToUse: SpeechSynthesisVoice | undefined | null = null;

  if (voiceURI) {
    voiceToUse = allVoices.find(v => v.voiceURI === voiceURI);
  } 
  
  // If no voice is selected, or the selected voice isn't found, apply the default persona.
  if (!voiceToUse) {
    // RESTORED: Prioritize high-quality, English-speaking female voices as the default.
    const femaleVoiceKeywords = ['female', 'zira', 'samantha', 'susan', 'tessa', 'fiona'];
    const isFemale = (v: SpeechSynthesisVoice) => 
        femaleVoiceKeywords.some(keyword => v.name.toLowerCase().includes(keyword));

    // 1. Try to find a preferred English (US) female voice.
    voiceToUse = allVoices.find(v => v.lang === 'en-US' && isFemale(v));
    
    // 2. If not found, try any English female voice.
    if (!voiceToUse) {
        voiceToUse = allVoices.find(v => v.lang.startsWith('en-') && isFemale(v));
    }

    // 3. If a female voice isn't found, use a generic high-quality US voice.
    if (!voiceToUse) {
        voiceToUse = allVoices.find(v => v.lang === 'en-US');
    }

    // 4. As a final fallback, use any English voice or the browser's absolute default.
    if (!voiceToUse) {
        voiceToUse = allVoices.find(v => v.lang.startsWith('en-')) || allVoices[0];
    }
  }

  const utteranceText = text.replace(/[*#_`]/g, '');
  const utterance = new SpeechSynthesisUtterance(utteranceText);

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  // Ensure onEnd is called even if speech fails
  utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
    console.error(`Speech synthesis error for utterance: "${utteranceText}" | Error: ${event.error}`);
    onEnd?.();
  };

  if (voiceToUse) {
    utterance.voice = voiceToUse;
  }
  utterance.rate = rate;
  utterance.pitch = pitch;
  
  window.speechSynthesis.cancel(); // Stop any currently speaking utterance
  window.speechSynthesis.speak(utterance);
}

export function playSound(soundUri: string | null) {
  if (!soundUri) return;
  try {
    const audio = new Audio(soundUri);
    audio.play().catch(e => console.error("Error playing notification sound:", e));
  } catch (e) {
    console.error("Failed to play sound URI:", e);
  }
}