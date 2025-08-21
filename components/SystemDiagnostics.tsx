import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ViewContainer } from './ViewContainer';
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL, GEMINI_VIDEO_MODEL } from '../constants';
import { getAiInstance } from '../services/geminiService';

const StatusPill: React.FC<{
  label: string;
  value: string | number | boolean;
  status?: 'ok' | 'warn' | 'error' | 'neutral';
}> = ({ label, value, status = 'neutral' }) => {
  const statusClasses = {
    ok: 'bg-green-500/30 text-green-300',
    warn: 'bg-yellow-500/30 text-yellow-300',
    error: 'bg-red-500/30 text-red-300',
    neutral: 'bg-slate-600/50 text-slate-300',
  };
  return (
    <div className={`flex justify-between items-center p-3 rounded-lg ${statusClasses[status]}`}>
      <span className="font-semibold text-sm text-white">{label}</span>
      <span className="font-mono text-sm">{String(value)}</span>
    </div>
  );
};

export const SystemDiagnostics: React.FC = () => {
  const { settings, messages, conversations, error, isLoading } = useContext(AppContext);
  const [latency, setLatency] = useState<number | null>(null);
  const [latencyError, setLatencyError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testLatency = async () => {
    setIsTesting(true);
    setLatency(null);
    setLatencyError(null);
    const startTime = performance.now();
    try {
      const ai = getAiInstance();
      await ai.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: 'ping' });
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
    } catch (e) {
      console.error(e);
      setLatencyError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <ViewContainer title="System Diagnostics">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Core Status */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
          <h3 className="font-bold text-lg text-white border-b border-slate-700 pb-2">Core Status</h3>
          <StatusPill label="Overall Status" value={error ? 'Error' : 'Operational'} status={error ? 'error' : 'ok'} />
          <StatusPill label="Active Task" value={isLoading ? 'Processing...' : 'Idle'} status={isLoading ? 'warn' : 'ok'} />
          <StatusPill label="Last Error" value={error || 'None'} status={error ? 'error' : 'neutral'} />
        </div>

        {/* Configuration */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
           <h3 className="font-bold text-lg text-white border-b border-slate-700 pb-2">Configuration</h3>
          <StatusPill label="Theme" value={settings.theme} />
          <StatusPill label="Voice Always On" value={true} status={'ok'}/>
          <StatusPill label="Prompt Enhancer" value={settings.promptEnhancerMode} status={settings.promptEnhancerMode !== 'off' ? 'ok' : 'neutral'} />
        </div>

        {/* Models & API */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
          <h3 className="font-bold text-lg text-white border-b border-slate-700 pb-2">Models & API</h3>
          <StatusPill label="Text Model" value={GEMINI_TEXT_MODEL} />
          <StatusPill label="Image Model" value={GEMINI_IMAGE_MODEL} />
          <StatusPill label="Video Model" value={GEMINI_VIDEO_MODEL} />
        </div>

        {/* Data & Memory */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
           <h3 className="font-bold text-lg text-white border-b border-slate-700 pb-2">Data & Memory</h3>
          <StatusPill label="Total Conversations" value={conversations.length} />
          <StatusPill label="Messages in Session" value={messages.length} />
          <StatusPill label="Browser Speech API" value={typeof window.speechSynthesis !== 'undefined' ? 'Supported' : 'Unsupported'} status={typeof window.speechSynthesis !== 'undefined' ? 'ok' : 'warn'}/>
        </div>

        {/* Latency Test */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg md:col-span-2">
            <h3 className="font-bold text-lg text-white border-b border-slate-700 pb-2">API Latency Test</h3>
            <div className="flex items-center gap-4">
                 <button onClick={testLatency} disabled={isTesting} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-wait">
                    {isTesting ? 'Testing...' : 'Run Latency Test'}
                 </button>
                 {latency !== null && (
                    <StatusPill label="API Ping" value={`${latency} ms`} status={latency < 1000 ? 'ok' : 'warn'} />
                 )}
            </div>
             {latencyError && (
                 <div className="mt-2">
                    <StatusPill label="Test Error" value={latencyError} status='error' />
                 </div>
             )}
        </div>
      </div>
    </ViewContainer>
  );
};