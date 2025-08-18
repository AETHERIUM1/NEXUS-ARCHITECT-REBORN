import React, { useState, useEffect, useContext } from 'react';
import { ConversationManager } from './ConversationManager';
import { SettingsButton } from './SettingsButton';
import { FeaturesDropdown } from './FeaturesDropdown';
import { AppContext } from '../contexts/AppContext';
import { InterfaceSwitcher } from './InterfaceSwitcher';
import { Avatar } from './Avatar';

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

export const Header: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(formatDateTime(new Date()));
  const { isLoading, openSettingsModal, avatarState } = useContext(AppContext);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDateTime(formatDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <header className="bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-200/70 backdrop-blur-sm border-b border-slate-700/50 dark:border-slate-700/50 light:border-slate-300/50 p-4 sticky top-0 z-30 flex justify-between items-center text-glow-blue">
      {/* LEFT: Interface Switcher and DateTime */}
      <div className="w-1/3 flex justify-start items-center gap-4">
         <InterfaceSwitcher />
         <div className="text-sm font-mono text-slate-800 dark:text-slate-200 hidden lg:block">
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
            Architect Edition
          </p>
        </div>
      </div>
      
      {/* RIGHT: User controls, with Conversation Manager moved here */}
      <div className="w-1/3 flex items-center justify-end gap-4">
        <FeaturesDropdown />
        <ConversationManager />
        <SettingsButton onClick={openSettingsModal} disabled={isLoading} />
      </div>
    </header>
  );
};