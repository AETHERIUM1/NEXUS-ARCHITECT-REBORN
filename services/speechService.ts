import { VoiceOption } from '../types';

let voices: SpeechSynthesisVoice[] = [];
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let isEnginePrimed = false;

/**
 * Initializes and retrieves the list of available speech synthesis voices.
 * This function is memoized to prevent re-running the logic unnecessarily.
 * @returns A promise that resolves to an array of available voices.
 */
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
 * Primes the speech synthesis engine to reduce latency on the first speech request.
 * This is safe to call multiple times.
 */
export function primeSpeechEngine() {
  if (typeof window.speechSynthesis === 'undefined' || isEnginePrimed) {
    return;
  }
  
  const synth = window.speechSynthesis;

  // On many browsers, the act of getting voices is enough to "wake up" the engine.
  initializeVoices();
  
  // A single cancel() on the first prime can help clear any stale state from a 
  // previous page session or a browser bug, without queuing a new utterance.
  synth.cancel(); 

  // Create a silent, empty utterance.
  const silentUtterance = new SpeechSynthesisUtterance('');
  silentUtterance.volume = 0; // Make it silent
  
  // Speaking this silent utterance inside a user gesture (like the "Enter NEXUS" button click)
  // should "unlock" the speech synthesis for subsequent programmatic calls, fixing "not-allowed" errors.
  synth.speak(silentUtterance);
  
  isEnginePrimed = true;
}


export async function getVoices(): Promise<VoiceOption[]> {
  const synthVoices = await initializeVoices();
  return synthVoices.map(v => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }));
}

/**
 * Speaks the given text, definitively fixing the "interrupted" race condition.
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

    const doSpeak = (allVoices: SpeechSynthesisVoice[]) => {
        // Find the desired voice or a suitable fallback
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
        
        // If the text becomes empty after removing markdown, there's nothing to say.
        if (!utteranceText.trim()) {
            onEnd?.();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(utteranceText);

        if (onStart) utterance.onstart = onStart;
        if (onEnd) utterance.onend = onEnd;
        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            console.error(`Speech synthesis error for utterance: "${utteranceText}" | Error: ${event.error}`);
            onEnd?.();
        };
        if (voiceToUse) utterance.voice = voiceToUse;
        utterance.rate = rate;
        utterance.pitch = pitch;

        // --- THE DEFINITIVE FIX FOR THE "INTERRUPTED" ERROR ---
        // This race condition occurs when `speak()` is called before the engine has
        // processed a `cancel()` command. The solution is to always cancel, then
        // wait a moment before speaking.
        
        // 1. Cancel anything currently in the speech queue.
        window.speechSynthesis.cancel();
        
        // 2. Use a short, non-blocking delay to allow the 'cancel' command to complete.
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50);
    };
    
    initializeVoices().then(doSpeak).catch(err => {
        console.error("Could not initialize voices for speaking:", err);
        onEnd?.();
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
