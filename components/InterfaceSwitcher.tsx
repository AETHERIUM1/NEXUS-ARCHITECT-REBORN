import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ActiveView } from '../types';

const interfaceOptions = [
  { view: ActiveView.CHAT, label: 'NEXUS Architect', icon: '💬' },
  { view: ActiveView.TRAVEL_AGENT, label: 'Travel Agent', icon: '🗺️' },
  { view: ActiveView.AGENTS, label: 'Agents', icon: '🤖' },
  { view: ActiveView.WORKSPACE, label: 'Workspace', icon: '📂' },
  { view: ActiveView.LOCAL_AI, label: 'Local AI Hub', icon: '💻' },
  { view: ActiveView.DIAGNOSTICS, label: 'System Diagnostics', icon: '📈' },
  { view: ActiveView.EVOLUTION, label: 'Evolution Interface', icon: '🧬' },
  { view: ActiveView.ARCHITECTURE, label: 'Architecture Matrix', icon: '🕸️' },
  { view: ActiveView.BLUEPRINT, label: 'Sovereign Blueprint', icon: '📜' },
  { view: ActiveView.BUILDS, label: 'Builds Matrix', icon: '🏗️' },
  { view: ActiveView.TEAMS, label: 'Teams Interface', icon: '👥' },
  { view: ActiveView.TRANSCENDENCE, label: 'Transcendence', icon: '🌌' },
];

export const InterfaceSwitcher: React.FC = () => {
    const { activeView, setActiveView, isLoading } = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentInterface = interfaceOptions.find(opt => opt.view === activeView) || interfaceOptions[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-slate-700/50 dark:bg-slate-700/50 light:bg-slate-300/70 hover:bg-slate-600/50 dark:hover:bg-slate-600/50 light:hover:bg-slate-400/70 transition-colors text-white dark:text-white light:text-slate-800 disabled:opacity-50"
            >
                <span className="font-mono text-cyan-400">{currentInterface.icon}</span>
                <span className="hidden sm:inline">{currentInterface.label}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-64 bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-lg shadow-2xl z-40 overflow-hidden">
                    <div className="p-2 max-h-96 overflow-y-auto">
                        {interfaceOptions.map(opt => (
                            <button
                                key={opt.view}
                                onClick={() => {
                                    setActiveView(opt.view);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left text-sm px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${activeView === opt.view ? 'bg-cyan-600/50 text-white' : 'hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700'}`}
                            >
                                <span className="w-5 text-center">{opt.icon}</span>
                                <span className="flex-grow">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};