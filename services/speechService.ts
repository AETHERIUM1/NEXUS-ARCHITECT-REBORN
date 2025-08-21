import { VoiceOption } from '../types';

let voices: SpeechSynthesisVoice[] = [];
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let isEnginePrimed = false;
let speechQueue: Array<{ text: string; voiceURI: string | null; rate: number; pitch: number; onStart?: () => void; onEnd?: () => void }> = [];

/**
 * Processes the queue of speech requests.
 * This is called once the speech engine is confirmed to be active.
 */
function processSpeechQueue() {
    const queue = [...speechQueue];
    speechQueue = [];
    queue.forEach(item => speak(item.text, item.voiceURI, item.rate, item.pitch, item.onStart, item.onEnd));
}

/**
 * Primes the speech synthesis engine to address browser autoplay policies.
 * This speaks a silent utterance to "unlock" the API and then processes any queued speech.
 */
export function primeSpeechEngine() {
  if (typeof window.speechSynthesis === 'undefined' || isEnginePrimed) {
    return;
  }
  
  initializeVoices();
  
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    isEnginePrimed = true;
    processSpeechQueue();
    return;
  }
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(' ');
  utterance.volume = 0;
  
  const onPrimeEnd = () => {
      if (!isEnginePrimed) {
          isEnginePrimed = true;
          processSpeechQueue();
      }
  };
  
  utterance.onend = onPrimeEnd;
  utterance.onerror = (e) => {
    console.warn("Speech engine priming utterance failed, but will proceed.", e);
    onPrimeEnd();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech engine priming failed with an error.", e);
    onPrimeEnd();
  }
}

// Global handler to prime the speech engine on the user's first interaction.
if (typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined') {
    const primeEngineOnFirstInteraction = () => primeSpeechEngine();
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
            // No longer clearing the onvoiceschanged listener to handle dynamic voice list changes
            resolve(voices);
            return true;
        }
        return false;
    };

    if (getAndResolve()) return;

    window.speechSynthesis.onvoiceschanged = () => {
        getAndResolve();
    };

    // Fallback in case onvoiceschanged never fires
    setTimeout(() => {
        if (!getAndResolve()) {
            console.warn("Speech synthesis voices did not load within a reasonable time.");
            resolve([]);
        }
    }, 1000);
  });

  return voicesPromise;
}

// Ensure voices start loading on module initialization
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
  // If the engine isn't primed, queue this request and exit.
  if (!isEnginePrimed) {
      speechQueue.push({ text, voiceURI, rate, pitch, onStart, onEnd });
      return;
  }

  if (!text || !text.trim() || typeof window.speechSynthesis === 'undefined') {
    onEnd?.();
    return;
  }

  const allVoices = await initializeVoices();
  let voiceToUse: SpeechSynthesisVoice | undefined | null = null;

  if (voiceURI) {
    voiceToUse = allVoices.find(v => v.voiceURI === voiceURI);
  } 
  
  if (!voiceToUse) {
    const femaleVoiceKeywords = ['female', 'zira', 'samantha', 'susan', 'tessa', 'fiona'];
    const isFemale = (v: SpeechSynthesisVoice) => 
        femaleVoiceKeywords.some(keyword => v.name.toLowerCase().includes(keyword));

    voiceToUse = allVoices.find(v => v.lang === 'en-US' && isFemale(v)) ||
                 allVoices.find(v => v.lang.startsWith('en-') && isFemale(v)) ||
                 allVoices.find(v => v.lang === 'en-US') ||
                 allVoices.find(v => v.lang.startsWith('en-')) ||
                 allVoices[0];
  }

  const utteranceText = text.replace(/[*#_`]/g, '');
  const utterance = new SpeechSynthesisUtterance(utteranceText);

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
    console.error(`Speech synthesis error for utterance: "${utteranceText}" | Error: ${event.error}`);
    onEnd?.();
  };

  if (voiceToUse) {
    utterance.voice = voiceToUse;
  }
  utterance.rate = rate;
  utterance.pitch = pitch;
  
  window.speechSynthesis.cancel();
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