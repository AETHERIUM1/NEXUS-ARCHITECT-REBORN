import React, { useState } from 'react';
import { ViewContainer } from './ViewContainer';

const mockLocalModels = [
    { name: 'llama3:8b-instruct-q5_K_M', size: '5.1 GB' },
    { name: 'mistral:7b-instruct-v0.2-q6_K', size: '5.2 GB' },
    { name: 'codellama:13b-instruct-q4_K_M', size: '7.4 GB' },
    { name: 'deepseek-coder:6.7b-instruct-q5_K_S', size: '4.7 GB' },
];

export const LocalAIInterface: React.FC = () => {
    const [url, setUrl] = useState('http://localhost:11434');
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [discoveredModels, setDiscoveredModels] = useState<typeof mockLocalModels>([]);
    const [error, setError] = useState('');

    const handleConnect = () => {
        setStatus('connecting');
        setError('');
        setDiscoveredModels([]);

        setTimeout(() => {
            if (url.includes('localhost')) {
                setStatus('connected');
                setDiscoveredModels(mockLocalModels);
            } else {
                setStatus('error');
                setError('Connection failed: Could not reach the host. Please check the URL and ensure the local server is running.');
            }
        }, 1500);
    };

    return (
        <ViewContainer title="Local AI Hub">
            <p className="text-slate-400 mb-2 max-w-3xl">
                Connect NEXUS to a self-hosted AI model server (like Ollama or LocalAI) for 100% private and offline inference. Your data never leaves your machine.
            </p>
            <p className="text-xs text-yellow-400 bg-yellow-900/30 p-2 rounded-md mb-8 max-w-3xl">
                Note: This is a functional demonstration. Connecting to a real local server would require backend support.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Connection Settings */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="text-xl font-bold text-white">Connection</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div>
                            <label htmlFor="server-url" className="block text-sm font-medium mb-2">Server URL</label>
                            <input
                                type="text"
                                id="server-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="e.g., http://localhost:11434"
                                className="w-full bg-slate-900/80 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                disabled={status === 'connecting'}
                            />
                        </div>
                        <button
                            onClick={handleConnect}
                            disabled={status === 'connecting'}
                            className="mt-4 w-full px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-wait"
                        >
                            {status === 'connecting' ? 'Connecting...' : 'Connect to Local Server'}
                        </button>
                    </div>
                </div>

                {/* Status and Discovered Models */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-white">Status</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 min-h-[200px]">
                        {status === 'disconnected' && (
                            <p className="text-slate-500">Awaiting connection...</p>
                        )}
                        {status === 'connecting' && (
                             <div className="flex items-center gap-2 text-slate-400">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Pinging local server at {url}...</span>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="text-red-400 bg-red-900/30 p-3 rounded-md">
                                <p className="font-bold">Connection Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {status === 'connected' && (
                             <div>
                                <div className="flex items-center gap-2 text-green-400 bg-green-900/30 p-3 rounded-md mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    <span>Successfully connected. Discovered {discoveredModels.length} models.</span>
                                </div>
                                <h4 className="font-semibold mb-2">Available Models:</h4>
                                <ul className="space-y-2">
                                    {discoveredModels.map(model => (
                                        <li key={model.name} className="flex justify-between items-center bg-slate-800 p-2 rounded-md text-sm">
                                            <span className="font-mono text-cyan-300">{model.name}</span>
                                            <span className="text-slate-400">{model.size}</span>
                                        </li>
                                    ))}
                                </ul>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </ViewContainer>
    );
};
