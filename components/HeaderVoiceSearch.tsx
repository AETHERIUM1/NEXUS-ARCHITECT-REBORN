import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AppContext } from '../contexts/AppContext';
import { primeSpeechEngine } from '../services/speechService';

interface HeaderVoiceSearchProps {
    onSend: (prompt: string) => void;
}

export const HeaderVoiceSearch: React.FC<HeaderVoiceSearchProps> = ({ onSend }) => {
    const { isLoading, isSearchEnabled } = useContext(AppContext);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMicPermission('unsupported');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') setMicPermission('denied');
            console.error("Voice search error:", event.error);
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.trim();
            if (transcript) {
                onSend(transcript);
            }
        };
        recognitionRef.current = recognition;
    }, [onSend]);

    const handleToggleListening = useCallback(() => {
        if (!recognitionRef.current || isLoading || !isSearchEnabled) return;
        
        primeSpeechEngine();
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    }, [isListening, isLoading, isSearchEnabled]);

    const isDisabled = isLoading || !isSearchEnabled || micPermission === 'denied' || micPermission === 'unsupported';
    
    let title = 'Start voice search';
    if (isListening) title = 'Stop voice search';
    if (!isSearchEnabled) title = "Enable Web Search to use voice search";
    if (micPermission === 'denied') title = "Microphone access denied. Please check browser settings.";
    if (micPermission === 'unsupported') title = "Speech recognition is not supported by your browser.";

    return (
        <button
            type="button"
            onClick={handleToggleListening}
            disabled={isDisabled}
            aria-label={title}
            title={title}
            className={`transition-colors duration-200 ${
                isListening 
                ? 'text-red-500 animate-pulse' 
                : 'text-slate-400 hover:text-cyan-400'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed hover:text-slate-400' : ''}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        </button>
    );
};