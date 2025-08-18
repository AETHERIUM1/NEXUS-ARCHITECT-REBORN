import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { PromptEnhancerMode } from '../types';

const modeDetails: Record<PromptEnhancerMode, { label: string; description: string }> = {
    off: { label: 'Off', description: 'No prompt enhancement.' },
    standard: { label: 'Standard', description: 'Improves clarity and detail.' },
    creative: { label: 'Creative', description: 'Expands with imaginative ideas.' },
    technical: { label: 'Technical', description: 'Optimizes for code or data tasks.' },
};

export const PromptEnhancerDropdown: React.FC = () => {
    const { settings, updateSettings, isLoading } = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentMode = settings.promptEnhancerMode || 'off';
    const isEnhancerActive = currentMode !== 'off';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleModeChange = (mode: PromptEnhancerMode) => {
        updateSettings({ promptEnhancerMode: mode });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                title={`Prompt Enhancer: ${modeDetails[currentMode].label}`}
                className={`p-2 rounded-full transition-colors duration-200 ${isEnhancerActive ? 'text-white bg-cyan-500' : 'text-slate-400 bg-slate-700 dark:bg-slate-700 light:bg-slate-200 hover:bg-slate-600'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.256 9a1 1 0 010 1.8l-3.11 1.8L13.033 17.256a1 1 0 01-1.932 0L9.854 12.8 6.744 11a1 1 0 010-1.8l3.11-1.8L11.033 2.744A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 w-64 bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-lg shadow-2xl z-40 p-2">
                    <div className="text-sm font-bold text-white dark:text-white light:text-slate-900 mb-2 px-2">Prompt Enhancer</div>
                    <ul className="space-y-1">
                        {(Object.keys(modeDetails) as PromptEnhancerMode[]).map(mode => (
                            <li key={mode}>
                                <button
                                    onClick={() => handleModeChange(mode)}
                                    className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3 ${currentMode === mode ? 'bg-cyan-600/80 text-white' : 'hover:bg-slate-700/80 dark:hover:bg-slate-700/80 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700'}`}
                                >
                                    <div className="flex-grow">
                                        <div className="font-semibold">{modeDetails[mode].label}</div>
                                        <div className="text-xs opacity-80">{modeDetails[mode].description}</div>
                                    </div>
                                    {currentMode === mode && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
