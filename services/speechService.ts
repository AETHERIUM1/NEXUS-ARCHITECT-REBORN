import { VoiceOption } from '../types';

let voices: SpeechSynthesisVoice[] = [];
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let isEnginePrimed = false;
let primeTimeout: number | null = null;

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
            resolve(voices);
            return true;
        }
        return false;
    };

    if (getAndResolve()) return;

    window.speechSynthesis.onvoiceschanged = getAndResolve;

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

/**
 * Primes the speech synthesis engine. Safe to call multiple times.
 */
export function primeSpeechEngine() {
  if (typeof window.speechSynthesis === 'undefined' || isEnginePrimed) {
    return;
  }
  
  // The act of getting voices often primes the engine.
  initializeVoices();
  
  // Cancel anything that might be lingering from a page reload.
  window.speechSynthesis.cancel(); 
  const utterance = new SpeechSynthesisUtterance(' ');
  utterance.volume = 0;
  
  const onPrimeEnd = () => {
    if (primeTimeout) clearTimeout(primeTimeout);
    isEnginePrimed = true;
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
  
  primeTimeout = window.setTimeout(() => {
      console.warn("Priming timeout reached. Forcing engine state to primed.");
      onPrimeEnd();
  }, 350);
}


export async function getVoices(): Promise<VoiceOption[]> {
  const synthVoices = await initializeVoices();
  return synthVoices.map(v => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }));
}

/**
 * Speaks the given text, interrupting any currently playing speech.
 * This function is designed to be robust against browser race conditions.
 */
export function speak(
    text: string, 
    voiceURI: string | null, 
    rate: number = 1, 
    pitch: number = 1.1,
    onStart?: () => void,
    onEnd?: () => void
): void {
    if (typeof window.speechSynthesis === 'undefined' || !text?.trim()) {
        onEnd?.();
        return;
    }

    // This function contains the logic to create and speak the utterance.
    const doSpeak = (allVoices: SpeechSynthesisVoice[]) => {
        let voiceToUse: SpeechSynthesisVoice | undefined | null = null;
        
        if (voiceURI) {
            voiceToUse = allVoices.find(v => v.voiceURI === voiceURI);
        } 
      
        if (!voiceToUse) {
            const femaleVoiceKeywords = ['female', 'zira', 'samantha', 'susan', 'tessa', 'fiona'];
            const isFemale = (v: SpeechSynthesisVoice) => femaleVoiceKeywords.some(keyword => v.name.toLowerCase().includes(keyword));
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
            onEnd?.(); // Ensure onEnd is always called
        };

        if (voiceToUse) {
            utterance.voice = voiceToUse;
        }
        utterance.rate = rate;
        utterance.pitch = pitch;

        // **THE DEFINITIVE FIX**
        // 1. Immediately cancel any ongoing or pending speech.
        window.speechSynthesis.cancel();
        
        // 2. Introduce a small delay before speaking the new utterance.
        // This gives the browser engine time to process the 'cancel' command
        // and prevents the "interrupted" race condition error.
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50);
    };
    
    // Get the list of voices and then execute the speaking logic.
    initializeVoices().then(doSpeak).catch(err => {
        console.error("Could not initialize voices for speaking:", err);
        onEnd?.(); // Ensure onEnd is called on voice initialization failure
    });
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
