import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ActiveView } from '../types';

interface RecentSearchesProps {
    onSendMessage: (prompt: string) => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({ onSendMessage }) => {
    const { recentSearches, setActiveView } = useContext(AppContext);
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

    const handleSearchClick = (query: string) => {
        setIsOpen(false);
        setActiveView(ActiveView.CHAT);
        onSendMessage(query);
    };

    if (recentSearches.length === 0) {
        return null; // Don't render if there's no history
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="View recent searches"
                title="Recent Searches"
                className="text-slate-400 hover:text-cyan-400 dark:hover:text-cyan-400 light:hover:text-cyan-600 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-lg shadow-2xl z-40 overflow-hidden">
                    <h3 className="p-3 text-sm font-bold text-white dark:text-white light:text-slate-900 border-b border-slate-700 dark:border-slate-700 light:border-slate-300">Recent Searches</h3>
                    <div className="max-h-80 overflow-y-auto">
                        {recentSearches.map((query, index) => (
                            <button
                                key={index}
                                onClick={() => handleSearchClick(query)}
                                className="w-full text-left text-sm px-3 py-2 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 transition-colors truncate"
                                title={query}
                            >
                                {query}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};