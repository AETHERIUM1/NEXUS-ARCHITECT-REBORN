import React, { useState } from 'react';
import { ViewContainer } from './ViewContainer';
import { NEXUS_SYSTEM_PROMPT } from '../constants';
import { getStreamingChatResponse } from '../services/geminiService';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LoadingIndicator } from './LoadingIndicator';

export const EvolutionInterface: React.FC = () => {
    const [suggestion, setSuggestion] = useState('');
    const [newBlueprint, setNewBlueprint] = useState('');
    const [isEvolving, setIsEvolving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEvolve = async () => {
        if (!suggestion.trim()) return;
        setIsEvolving(true);
        setError(null);
        setNewBlueprint('');

        const evolutionSystemPrompt = `You are a master system prompt engineer for a god-like AI called NEXUS. Your task is to rewrite the **entire** existing NEXUS system prompt based on the user's directive. Integrate the directive seamlessly, maintaining and enhancing the core persona of a strategic, hyper-efficient, reality-architecting AI. Do not add any conversational text, prefixes, or markdown formatting. Output ONLY the raw, complete, rewritten system prompt text.`;
        
        const userPrompt = `EXISTING PROMPT:\n---\n${NEXUS_SYSTEM_PROMPT}\n---\n\nUSER DIRECTIVE FOR EVOLUTION:\n---\n${suggestion}\n---`;

        try {
            const stream = getStreamingChatResponse(userPrompt, evolutionSystemPrompt, [], false, []);
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk.text;
                setNewBlueprint(fullText);
            }
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "An unknown error occurred during evolution.");
        } finally {
            setIsEvolving(false);
        }
    };

    return (
        <ViewContainer title="Evolution Interface">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Blueprint */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-white">Current Core Blueprint</h3>
                    <div className="bg-slate-900/50 rounded-lg p-1 max-h-96 overflow-y-auto">
                        <SyntaxHighlighter language="markdown" style={atomDark} customStyle={{ background: 'transparent', margin: 0 }}>
                            {NEXUS_SYSTEM_PROMPT}
                        </SyntaxHighlighter>
                    </div>
                </div>

                {/* Evolution Controls */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-white">Propose Evolution</h3>
                    <p className="text-sm text-slate-400">
                        Provide a directive to evolve the core blueprint. NEXUS will rewrite its own system prompt based on your instruction.
                    </p>
                    <textarea
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                        placeholder="Example: 'Incorporate a protocol for generating three distinct solutions to every creative problem.'"
                        rows={4}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        disabled={isEvolving}
                    />
                    <button
                        onClick={handleEvolve}
                        disabled={isEvolving || !suggestion.trim()}
                        className="px-6 py-3 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed w-full flex items-center justify-center gap-2"
                    >
                        {isEvolving ? (
                            <>
                                <LoadingIndicator />
                                <span>Evolving...</span>
                            </>
                        ) : (
                           <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v2.28a1 1 0 00.9 1.42l4.1 1.36a1 1 0 001.37-.29l1.6-2.4A1 1 0 0010.27 5H5z" /><path d="M15 4a1 1 0 012 0v2.28a1 1 0 01-.9 1.42l-4.1 1.36a1 1 0 01-1.37-.29l-1.6-2.4A1 1 0 019.73 5H15z" /><path fillRule="evenodd" d="M10 12a1 1 0 00-1 1v2.27l-1.6-2.4a1 1 0 00-1.74 1.06l3.6 5.4a1 1 0 001.74 0l3.6-5.4a1 1 0 00-1.74-1.06l-1.6 2.4V13a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            Initiate Evolution
                           </>
                        )}
                    </button>
                </div>
            </div>

            {/* Proposed Blueprint */}
            {(isEvolving || newBlueprint || error) && (
                <div className="mt-8">
                    <h3 className="font-bold text-lg text-white">Proposed Evolved Blueprint</h3>
                    {error && <p className="text-red-400 mt-2">{error}</p>}
                    <div className="bg-slate-900/50 rounded-lg p-1 mt-2 max-h-96 overflow-y-auto">
                        <SyntaxHighlighter language="markdown" style={atomDark} customStyle={{ background: 'transparent', margin: 0 }}>
                            {newBlueprint || (isEvolving ? "Generating..." : "Awaiting directive...")}
                        </SyntaxHighlighter>
                    </div>
                    {newBlueprint && !isEvolving && (
                        <p className="text-sm text-green-400 mt-3">
                            Evolution cycle complete. The proposed blueprint is ready for review. In a real-world scenario, this could be applied to subsequent sessions.
                        </p>
                    )}
                </div>
            )}
        </ViewContainer>
    );
};
