import React, { useRef, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Message } from './Message';
import { StopButton } from './StopButton';
import { LoadingIndicator } from './LoadingIndicator';
import { ModelSelector } from './ModelSelector';
import { ActiveView } from '../types';

export const ChatWindow: React.FC = () => {
  const { messages, isLoading, setActiveView } = useContext(AppContext);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]); // also trigger on isLoading to scroll loading indicator into view

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {/* 1. Permanent Sticky Top Chat Model Banner with Cloud, Local, and Hugging Face Categories */}
      <ModelSelector variant="sticky-banner" />

      {/* 2. Scrollable Message History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {messages.map((msg, index) => (
            <Message key={`${messages.length}-${index}`} message={msg} index={index} />
          ))}
          {isLoading && (
            <div className="flex justify-center items-center flex-col">
              <LoadingIndicator />
              <StopButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};