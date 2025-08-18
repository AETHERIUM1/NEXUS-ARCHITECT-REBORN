import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ActiveView } from '../types';

const FeatureMenuButton: React.FC<{
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}> = ({ title, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-3 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 transition-colors"
  >
    <div className="flex items-center gap-4">
      <div className="text-2xl">{icon}</div>
      <div className="flex-grow">
        <h4 className="font-bold text-white dark:text-white light:text-slate-800">{title}</h4>
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">{description}</p>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  </button>
);

export const FeaturesDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setActiveView } = useContext(AppContext);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigate = (view: ActiveView) => {
    setActiveView(view);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-slate-700/50 dark:bg-slate-700/50 light:bg-slate-300/70 hover:bg-slate-600/50 dark:hover:bg-slate-600/50 light:hover:bg-slate-400/70 transition-colors"
      >
        <span>Features</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 max-w-lg bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-lg shadow-2xl z-40 overflow-hidden">
          <div className="p-2 max-h-[70vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white dark:text-white light:text-black p-3">NEXUS Capabilities</h3>
            <div className="space-y-1">
              <FeatureMenuButton
                icon="🤖"
                title="AI Agents"
                description="Deploy specialized agents for research and coding."
                onClick={() => navigate(ActiveView.AGENTS)}
              />
              <FeatureMenuButton
                icon="📂"
                title="Team Workspace"
                description="Manage projects and tasks on a collaborative board."
                onClick={() => navigate(ActiveView.WORKSPACE)}
              />
              <FeatureMenuButton
                icon="💻"
                title="Local AI Hub"
                description="Connect to a self-hosted model for full privacy."
                onClick={() => navigate(ActiveView.LOCAL_AI)}
              />
              <FeatureMenuButton
                icon="🏗️"
                title="Builds Matrix"
                description="Review all generated images and videos."
                onClick={() => navigate(ActiveView.BUILDS)}
              />
               <FeatureMenuButton
                icon="📜"
                title="Sovereign Blueprint"
                description="Explore the FOSS blueprint for self-hosting."
                onClick={() => navigate(ActiveView.BLUEPRINT)}
              />
            </div>
            <hr className="border-slate-700 dark:border-slate-700 light:border-slate-300 my-2" />
            <div className="p-3 text-xs text-slate-400 light:text-slate-500">
              Core features like Image Generation, Video Generation, and Web Search are available in the main <button onClick={() => navigate(ActiveView.CHAT)} className="text-cyan-400 light:text-cyan-600 hover:underline">NEXUS Architect</button> chat.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};