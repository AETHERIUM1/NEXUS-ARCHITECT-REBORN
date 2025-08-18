import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

export const StopButton: React.FC = () => {
  const { stopGeneration } = useContext(AppContext);

  return (
    <div className="flex items-center justify-center gap-2 mb-3">
        <button
          onClick={stopGeneration}
          className="flex items-center gap-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 font-mono text-sm px-4 py-2 rounded-lg transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Stop Generation
        </button>
    </div>
  );
};