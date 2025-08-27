import React from 'react';
import { ViewContainer } from './ViewContainer';
import { NEXUS_TEXT_MODEL, NEXUS_IMAGE_MODEL, NEXUS_VIDEO_MODEL } from '../constants';

const ArchBox: React.FC<{ title: string; subtitle: string; children?: React.ReactNode; className?: string }> = ({ title, subtitle, children, className }) => (
    <div className={`bg-slate-900/70 border border-slate-700 rounded-lg p-4 text-center transform hover:scale-105 hover:border-cyan-400 transition-all duration-300 shadow-lg ${className}`}>
        <h3 className="text-lg font-bold text-cyan-400">{title}</h3>
        <p className="text-xs text-slate-400 mb-2">{subtitle}</p>
        <div className="text-sm text-slate-300">{children}</div>
    </div>
);

const Arrow: React.FC<{ direction?: 'down' | 'right'; className?: string }> = ({ direction = 'down', className }) => (
  <div className={`flex items-center justify-center text-cyan-500/50 ${className}`}>
    {direction === 'down' ? (
      <svg className="w-8 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 5v14m0 0l-4-4m4 4l4-4" /></svg>
    ) : (
      <svg className="w-12 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 12h14m0 0l-4-4m4 4l4 4" /></svg>
    )}
  </div>
);


export const ArchitectureMatrix: React.FC = () => {
  return (
    <ViewContainer title="Architecture Matrix">
      <div className="flex flex-col items-center">

        <ArchBox title="AETHERIUM (User)" subtitle="Input Layer">
            Voice, Text, Files
        </ArchBox>

        <Arrow />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            <ArchBox title="Interface" subtitle="React & TailwindCSS">
                Header, Chat, Modals, Views
            </ArchBox>
            <ArchBox title="State Core" subtitle="React Context API">
                Messages, Settings, Conversations, Active View
            </ArchBox>
            <ArchBox title="Local Memory" subtitle="Browser localStorage">
                Persists Settings & Conversations
            </ArchBox>
        </div>

        <Arrow />

        <ArchBox title="NEXUS Core Logic" subtitle="TypeScript Services" className="w-full max-w-md">
            nexusService.ts, speechService.ts
        </ArchBox>
        
        <Arrow />

        <div className="w-full h-px bg-slate-700 my-4"></div>
        <p className="text-slate-500 text-sm -mt-8 mb-4 bg-slate-800/20 px-2">API Boundary</p>
        <div className="w-full h-px bg-slate-700 -mt-4 mb-4"></div>

        <ArchBox title="Nexus Cloud AI Platform" subtitle="Cloud AI Layer" className="w-full max-w-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs">
                <span className="bg-slate-700 p-1 rounded">{NEXUS_TEXT_MODEL}</span>
                <span className="bg-slate-700 p-1 rounded">{NEXUS_IMAGE_MODEL}</span>
                <span className="bg-slate-700 p-1 rounded">{NEXUS_VIDEO_MODEL}</span>
            </div>
        </ArchBox>

      </div>
    </ViewContainer>
  );
};