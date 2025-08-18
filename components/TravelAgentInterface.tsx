import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ViewContainer } from './ViewContainer';
import { getAiInstance } from '../services/geminiService';
import { 
    TRAVEL_AGENT_SYSTEM_PROMPT, 
    TRAVEL_AGENT_PRESETS, 
    RECOMMEND_PLACE_FUNCTION_DECLARATION, 
    GOOGLE_MAPS_EMBED_API_KEY 
} from '../constants';
import { LoadingIndicator } from './LoadingIndicator';
import { TravelPreset } from '../types';

export const TravelAgentInterface: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mapQuery, setMapQuery] = useState<string>('World');
    const [caption, setCaption] = useState<string>('');
    const [responseText, setResponseText] = useState<string>('Select a preset to begin your journey.');
    
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handlePresetClick = useCallback(async (preset: TravelPreset) => {
        setIsLoading(true);
        setError(null);
        setCaption('');
        setResponseText('');
        let fullText = '';
        
        try {
            const ai = getAiInstance();
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: preset.prompt }] }],
                config: {
                    systemInstruction: TRAVEL_AGENT_SYSTEM_PROMPT,
                    temperature: 2,
                    tools: [{ functionDeclarations: [RECOMMEND_PLACE_FUNCTION_DECLARATION] }],
                },
            });

            for await (const chunk of stream) {
                if (chunk.text) {
                    fullText += chunk.text;
                    setResponseText(fullText);
                }

                const fns = chunk.functionCalls ?? [];
                for (const fn of fns) {
                    if (fn.name === 'recommendPlace') {
                        const location = fn.args.location;
                        const cap = fn.args.caption;
                        if (typeof location === 'string') {
                            setMapQuery(location);
                        }
                        if (typeof cap === 'string') {
                            setCaption(cap);
                        }
                    }
                }
            }

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`System Error: ${errorMessage}`);
            setResponseText(`An error occurred while contacting the travel agent. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_EMBED_API_KEY}&q=${encodeURIComponent(mapQuery)}`;

    return (
        <ViewContainer title="Global Travel Agent">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Map and Caption */}
                <div className="lg:w-2/3 flex flex-col gap-4">
                    <div className="aspect-video w-full bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
                        <iframe
                            ref={iframeRef}
                            src={mapSrc}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={false}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Recommended Location Map"
                        ></iframe>
                    </div>
                    {caption && (
                        <div id="caption" className="p-4 bg-slate-900/50 rounded-lg text-cyan-300 text-center font-semibold italic border border-slate-700">
                            {caption}
                        </div>
                    )}
                </div>

                {/* Right Column: Controls and Response */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                    <div id="presets" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
                        {TRAVEL_AGENT_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePresetClick(preset)}
                                disabled={isLoading}
                                className="p-3 bg-slate-700/80 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center aspect-square"
                            >
                                <span className="text-3xl">{preset.label.split(' ')[0]}</span>
                                <span className="text-sm mt-1">{preset.label.split(' ')[1]}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex-grow p-4 bg-slate-900/50 rounded-lg border border-slate-700 min-h-[150px]">
                        <h4 className="font-bold text-white mb-2">Agent's Log</h4>
                        {isLoading && !responseText && <LoadingIndicator />}
                        {error && <p className="text-red-400">{error}</p>}
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{responseText}</p>
                    </div>
                </div>
            </div>
        </ViewContainer>
    );
};