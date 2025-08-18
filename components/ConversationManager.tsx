import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { exportToMarkdown } from '../utils/export';

export const ConversationManager: React.FC = () => {
    const { conversations, currentConversationId, createNewConversation, loadConversation, deleteConversation, renameConversation, messages } = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameText, setRenameText] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const sortedConversations = [...conversations].sort((a, b) => b.lastModified - a.lastModified);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setRenamingId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRename = (id: string, currentTitle: string) => {
        setRenamingId(id);
        setRenameText(currentTitle);
    };

    const submitRename = (e: React.FormEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (renameText.trim()) {
            renameConversation(id, renameText.trim());
        }
        setRenamingId(null);
    };

    const handleExport = () => {
        const currentTitle = conversations.find(c => c.id === currentConversationId)?.title || 'Untitled Conversation';
        exportToMarkdown(messages, currentTitle);
        setIsOpen(false);
    }
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-slate-700/50 dark:bg-slate-700/50 light:bg-slate-300/70 hover:bg-slate-600/50 dark:hover:bg-slate-600/50 light:hover:bg-slate-400/70 transition-colors">
                <span>Sessions</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-72 bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-lg shadow-2xl z-40 overflow-hidden">
                    <div className="p-2">
                         <button onClick={createNewConversation} className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 transition-colors flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            New Session
                         </button>
                         <button onClick={handleExport} className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 transition-colors flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            Export as Markdown
                         </button>
                    </div>
                    <hr className="border-slate-700 dark:border-slate-700 light:border-slate-200"/>
                    <div className="p-2 max-h-60 overflow-y-auto">
                        {sortedConversations.map(conv => (
                            <div key={conv.id} className={`group flex items-center justify-between p-2 rounded-md text-sm transition-colors ${currentConversationId === conv.id ? 'bg-cyan-600/50' : 'hover:bg-slate-700/80 dark:hover:bg-slate-700/80 light:hover:bg-slate-100'}`}>
                                {renamingId === conv.id ? (
                                    <form onSubmit={(e) => submitRename(e, conv.id)} className="flex-grow">
                                        <input
                                            type="text"
                                            value={renameText}
                                            onChange={(e) => setRenameText(e.target.value)}
                                            onBlur={(e: any) => submitRename(e, conv.id)}
                                            className="w-full bg-slate-900 text-white p-1 rounded"
                                            autoFocus
                                        />
                                    </form>
                                ) : (
                                    <button onClick={() => loadConversation(conv.id)} className="flex-grow text-left truncate">
                                        {conv.title}
                                    </button>
                                )}
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleRename(conv.id, conv.title); }} className="p-1 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-1 hover:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
