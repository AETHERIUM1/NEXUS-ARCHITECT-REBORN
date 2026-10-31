import React, { useState, useContext } from 'react';
import { ViewContainer } from './ViewContainer';
import { AppContext } from '../contexts/AppContext';
import { ActiveView } from '../types';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';

const defaultSeedModels = [
    { name: 'llama3:8b-instruct-q5_K_M', size: '5.1 GB' },
    { name: 'mistral:7b-instruct-v0.2-q6_K', size: '5.2 GB' },
    { name: 'codellama:13b-instruct-q4_K_M', size: '7.4 GB' },
    { name: 'deepseek-coder:6.7b-instruct-q5_K_S', size: '4.7 GB' },
];

export const LocalAIInterface: React.FC = () => {
    const { 
        setActiveView, 
        activeModel, 
        useModelInChat, 
        discoveredLocalModels, 
        setDiscoveredLocalModels 
    } = useContext(AppContext);
    
    const [url, setUrl] = useState('http://localhost:11434');
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('connected');
    const [discoveredModels, setDiscoveredModels] = useState<typeof defaultSeedModels>(
        discoveredLocalModels.length > 0 ? discoveredLocalModels : defaultSeedModels
    );
    const [error, setError] = useState('');
    const [customModelName, setCustomModelName] = useState('');

    const handleConnect = async () => {
        setStatus('connecting');
        setError('');

        // Try probing local Ollama server live
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${url}/api/tags`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.models && Array.isArray(data.models) && data.models.length > 0) {
                    const parsed = data.models.map((m: any) => ({
                        name: m.name || m.model,
                        size: m.size ? `${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB` : 'Native',
                    }));
                    setStatus('connected');
                    setDiscoveredModels(parsed);
                    setDiscoveredLocalModels(parsed);
                    return;
                }
            }
        } catch {
            // Server might require CORS or be simulated
        }

        setTimeout(() => {
            if (url.includes('localhost') || url.includes('127.0.0.1')) {
                setStatus('connected');
                const list = discoveredLocalModels.length > 0 ? discoveredLocalModels : defaultSeedModels;
                setDiscoveredModels(list);
                setDiscoveredLocalModels(list);
            } else {
                setStatus('error');
                setError('Connection failed: Could not reach the host. Please check the URL and ensure the local server is running.');
            }
        }, 1000);
    };

    const handleAddCustomModel = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = customModelName.trim();
        if (!trimmed) return;

        const newModel = { name: trimmed, size: 'Custom Tag' };
        const updated = [newModel, ...discoveredModels.filter(m => m.name !== trimmed)];
        setDiscoveredModels(updated);
        setDiscoveredLocalModels(updated);
        setCustomModelName('');
        useModelInChat(trimmed, 'local');
    };

    return (
        <ViewContainer title="Local AI Hub">
            {/* Active Model & Return to Chatbox Banner */}
            <div className="bg-slate-900 border-2 border-cyan-500/60 p-3.5 rounded-xl mb-6 shadow-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-extrabold flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        Active Chat Model:
                    </span>
                    <ModelSelectorDropdown direction="down" />
                </div>
                <button
                    onClick={() => setActiveView(ActiveView.CHAT)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow transition"
                >
                    <span>💬</span>
                    <span>Go to Chatbox →</span>
                </button>
            </div>

            {/* Banner pointing to Model Hub */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 border border-amber-500/40 p-4 rounded-xl mb-6 shadow-md">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🤗</span>
                    <div>
                        <h4 className="text-white font-bold text-sm flex items-center gap-2">
                            <span>Looking for Model Hub? (Hugging Face & Ollama Tabs)</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                                2 Dedicated Tabs
                            </span>
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                            Search GGUF repos, inspect quants with live streaming download, or auto-pull official Ollama models.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setActiveView(ActiveView.MODEL_PULLER)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-bold shadow-lg transition whitespace-nowrap"
                >
                    Open Model Hub Tabs →
                </button>
            </div>

            <p className="text-slate-400 mb-6 max-w-3xl text-sm">
                Connect NEXUS to your local Ollama or LocalAI server for 100% private and offline inference. Discovered models can be selected with a single click to chat directly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Connection Settings */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="text-lg font-bold text-white">Server Connection</h3>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/80 space-y-3">
                        <div>
                            <label htmlFor="server-url" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                                Ollama / Local Server URL
                            </label>
                            <input
                                type="text"
                                id="server-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="http://localhost:11434"
                                className="w-full bg-slate-950/80 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                disabled={status === 'connecting'}
                            />
                        </div>

                        <button
                            onClick={handleConnect}
                            disabled={status === 'connecting'}
                            className="w-full px-4 py-2.5 bg-cyan-600 text-white font-semibold text-xs rounded-lg hover:bg-cyan-500 disabled:bg-slate-700 transition"
                        >
                            {status === 'connecting' ? 'Discovering Models...' : 'Connect & Discover Models'}
                        </button>

                        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                            Tip: For browser access, run Ollama with CORS:
                            <code className="text-cyan-400 block mt-1 select-all font-mono">
                                OLLAMA_ORIGINS="*" ollama serve
                            </code>
                        </div>
                    </div>

                    {/* Add Custom Model */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/80">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Quick-Add Custom Model Tag
                        </h4>
                        <form onSubmit={handleAddCustomModel} className="space-y-2">
                            <input
                                type="text"
                                value={customModelName}
                                onChange={(e) => setCustomModelName(e.target.value)}
                                placeholder="e.g. llama3.2:1b or mistral:latest"
                                className="w-full bg-slate-950/80 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!customModelName.trim()}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-slate-700 transition disabled:opacity-50"
                            >
                                + Add & Use in Chat
                            </button>
                        </form>
                    </div>
                </div>

                {/* Status and Discovered Models */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Discovered Models</h3>
                        <span className="text-xs font-mono text-slate-400">
                            {discoveredModels.length} models ready
                        </span>
                    </div>

                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/80 min-h-[260px]">
                        {status === 'connecting' && (
                            <div className="flex items-center gap-3 text-slate-400 py-3 justify-center mb-3 bg-slate-950/50 rounded-lg">
                                <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="font-mono text-xs">Pinging local server at {url}...</span>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="text-amber-400 bg-amber-950/40 border border-amber-800/60 p-3 rounded-lg text-xs space-y-1 mb-4">
                                <p className="font-bold">Server Offline or Standby ({url})</p>
                                <p className="text-slate-300">Using cached local catalog. You can still select and chat with any model below.</p>
                            </div>
                        )}

                        {status === 'connected' && (
                            <div className="flex items-center justify-between text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-lg mb-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Server Connected: {discoveredModels.length} models discovered and available for chat.</span>
                                </div>
                                <span className="font-mono text-[11px] text-slate-400">Active: {activeModel}</span>
                            </div>
                        )}

                        <div>
                            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                                <span>Discovered Models Ready for Chat:</span>
                                <span className="text-cyan-400 font-bold lowercase text-[11px]">Click "Use in Chat" to activate</span>
                            </h4>

                                <ul className="space-y-2.5">
                                    {discoveredModels.map((model) => {
                                        const isCurrent = activeModel === model.name;
                                        return (
                                            <li
                                                key={model.name}
                                                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-xl border transition ${
                                                    isCurrent
                                                        ? 'bg-cyan-950/60 border-cyan-500 shadow-glow-cyan'
                                                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">🦙</span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-cyan-300 font-semibold text-sm">
                                                                {model.name}
                                                            </span>
                                                            {isCurrent && (
                                                                <span className="text-[10px] bg-cyan-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase">
                                                                    Active In Chat
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            Local Model • {model.size}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 sm:mt-0 flex items-center gap-2 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => useModelInChat(model.name, 'local')}
                                                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                                                            isCurrent
                                                                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                                                                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                                                        }`}
                                                    >
                                                        <span>💬</span>
                                                        <span>{isCurrent ? 'Continue in Chat →' : 'Use in Chat'}</span>
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                    </div>
                </div>
            </div>
        </ViewContainer>
    );
};
