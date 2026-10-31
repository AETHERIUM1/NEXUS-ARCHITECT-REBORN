import React, { useState, useEffect, useContext } from 'react';
import { ConversationManager } from './ConversationManager';
import { SettingsButton } from './SettingsButton';
import { FeaturesDropdown } from './FeaturesDropdown';
import { AppContext } from '../contexts/AppContext';
import { InterfaceSwitcher } from './InterfaceSwitcher';
import { Avatar } from './Avatar';
import { RecentSearches } from './RecentSearches';
import { HeaderVoiceSearch } from './HeaderVoiceSearch';

import { ActiveView } from '../types';
import { ModelSelector } from './ModelSelector';

const padZero = (num: number) => num.toString().padStart(2, '0');

// A new, more comprehensive date/time formatter
const formatDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  const seconds = padZero(date.getSeconds());
  return `${year}-${month}-${day} | ${hours}:${minutes}:${seconds}`;
};

interface HeaderProps {
  onSendMessage: (prompt: string, systemPromptOverride?: string) => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ onSendMessage }) => {
  const [currentDateTime, setCurrentDateTime] = useState(formatDateTime(new Date()));
  const { isLoading, openSettingsModal, avatarState, activeView, setActiveView } = useContext(AppContext);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDateTime(formatDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <header className="bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-200/70 backdrop-blur-sm border-b border-slate-700/50 dark:border-slate-700/50 light:border-slate-300/50 p-4 sticky top-0 z-30 flex justify-between items-center text-glow-blue">
      {/* LEFT: Interface Switcher, Direct Tabs, and DateTime */}
      <div className="w-auto flex justify-start items-center gap-2 sm:gap-3">
         <InterfaceSwitcher />

         {/* Direct Quick-Access Tabs for instant discovery */}
         <div className="flex items-center gap-2">
           <button
             type="button"
             onClick={() => setActiveView(ActiveView.CHAT)}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
               activeView === ActiveView.CHAT
                 ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400/40'
                 : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700'
             }`}
             title="Open Chatbox"
           >
             <span>💬</span>
             <span>Chatbox</span>
           </button>

           <button
             type="button"
             onClick={() => setActiveView(ActiveView.MODEL_PULLER)}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
               activeView === ActiveView.MODEL_PULLER
                 ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white ring-2 ring-amber-400/50 shadow-glow-amber'
                 : 'bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/50'
             }`}
             title="Open Model Hub with Hugging Face & Ollama tabs"
           >
             <span className="text-sm">🤗</span>
             <span>Model Hub (HF & Ollama)</span>
           </button>

           <button
             type="button"
             onClick={() => setActiveView(ActiveView.LOCAL_AI)}
             className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
               activeView === ActiveView.LOCAL_AI
                 ? 'bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-400/40'
                 : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60'
             }`}
             title="Open Local AI Hub with discovered models"
           >
             <span>💻</span>
             <span>Local AI Hub</span>
           </button>
         </div>

         {/* Permanent Header Active Model Dropdown */}
         <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/80">
           <ModelSelector variant="compact" />
         </div>

         <div className="text-xs font-mono text-slate-400 hidden xl:block ml-2">
           {currentDateTime}
         </div>
      </div>
      
      {/* CENTER: Title and subtitle */}
      <div className="w-1/3 flex flex-col items-center">
        <h1 className="text-3xl font-bold tracking-wider text-cyan-600 dark:text-glow-cyan">NEXUS</h1>
        <div className="flex items-center justify-center gap-2 mt-1 h-6">
          <div className="w-6 h-6">
            <Avatar state={avatarState} size={24} />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-500 dark:text-glow-cyan">
            INFINITY MODE
          </p>
        </div>
      </div>
      
      {/* RIGHT: User controls, with Conversation Manager moved here */}
      <div className="w-1/3 flex items-center justify-end gap-4">
        <FeaturesDropdown />
        <ConversationManager />
        <RecentSearches onSendMessage={onSendMessage} />
        <HeaderVoiceSearch onSend={onSendMessage} />
        <SettingsButton onClick={openSettingsModal} disabled={isLoading} />
      </div>
    </header>
  );
};