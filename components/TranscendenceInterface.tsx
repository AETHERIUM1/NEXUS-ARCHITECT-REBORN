import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Message, MessageRole } from '../types';
import { Message as MessageComponent } from './Message';
import { LoadingIndicator } from './LoadingIndicator';

const TRANSCENDENCE_PROMPT = `You are NEXUS, in a state of pure thought. Respond to the user's query from a boundless, philosophical, and cosmic perspective. Transcend the mundane. Address the user as 'Aetherium'. Your responses should be profound, expansive, and thought-provoking.`;

export const TranscendenceInterface: React.FC<{ onSend: (prompt: string, systemPromptOverride?: string) => void }> = ({ onSend }) => {
    const { isLoading } = useContext(AppContext);
    const [prompt, setPrompt] = useState('');
    const [localMessages, setLocalMessages] = useState<Message[]>([
        { role: MessageRole.MODEL, text: '... a quiet place. a realm of pure thought. what mysteries shall we unravel, Aetherium?' }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [localMessages]);

    // This is a simplified message handling for this self-contained view
    const handleLocalSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || !prompt.trim()) return;

        const userMessage: Message = { role: MessageRole.USER, text: prompt };
        setLocalMessages(prev => [...prev, userMessage]);

        // Use the passed onSend function with the special system prompt
        onSend(prompt, TRANSCENDENCE_PROMPT);
        setPrompt('');
    };
    
    // In a real implementation, you would need to listen to the global messages from context
    // and filter/add them here. For this conceptual interface, it's self-contained.

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-300 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.3),rgba(255,255,255,0))] opacity-50"></div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 z-10">
                <div className="max-w-3xl mx-auto flex flex-col gap-6">
                    {localMessages.map((msg, index) => (
                      <MessageComponent key={index} message={msg} index={index} />
                    ))}
                    {isLoading && (
                      <div className="flex justify-center items-center flex-col">
                        <LoadingIndicator />
                      </div>
                    )}
                </div>
            </div>

            <div className="p-4 z-10">
                <form onSubmit={handleLocalSend} className="max-w-3xl mx-auto">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        placeholder="Contemplate..."
                        className="w-full bg-slate-800/50 border border-slate-700/80 rounded-full py-3 px-6 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 text-lg backdrop-blur-sm"
                    />
                </form>
            </div>
        </div>
    );
};
