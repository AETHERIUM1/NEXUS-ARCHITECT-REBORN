import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { PromptEnhancerDropdown } from './PromptEnhancerDropdown';

interface PromptInputProps {
  onSend: (prompt: string) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

type MicPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

const ToolMenuItem: React.FC<{ icon: string; title: string; onClick: () => void; }> = ({ icon, title, onClick }) => (
    <li>
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700"
        >
            <span className="text-lg w-5 text-center">{icon}</span>
            <span>{title}</span>
        </button>
    </li>
);

export const PromptInput: React.FC<PromptInputProps> = ({ onSend, isListening, setIsListening }) => {
  const { 
    isLoading, 
    isSearchEnabled, 
    setIsSearchEnabled, 
    uploadedFiles, 
    setUploadedFiles,
    setCameraModalOpen,
    setCanvasModalOpen,
  } = useContext(AppContext);
  const [prompt, setPrompt] = useState('');
  const [micPermission, setMicPermission] = useState<MicPermissionStatus>('prompt');
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Cap the height to a maximum of 100px (around 4-5 lines)
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicPermission('unsupported');
      return;
    }

    if (!recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') setMicPermission('denied');
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
                finalTranscript += event.results[i][0].transcript;
            }
            setPrompt(finalTranscript);
            if (event.results[0].isFinal) {
              onSend(finalTranscript);
              setPrompt('');
            }
        };
        recognitionRef.current = recognition;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
            setIsUploadMenuOpen(false);
        }
        if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
            setIsToolsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleToggleListening = useCallback(() => {
    if (!recognitionRef.current || isLoading) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setPrompt('');
      recognitionRef.current.start();
    }
  }, [isListening, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && (prompt.trim() || uploadedFiles.length > 0)) {
      onSend(prompt.trim());
      setPrompt('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setUploadedFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
    // Reset file input to allow selecting the same file again
    if(fileInputRef.current) fileInputRef.current.value = "";
    if(folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleRemoveFile = (indexToRemove: number) => {
      setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleTakeScreenshot = async () => {
    setIsToolsMenuOpen(false);
    if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("Your browser does not support screen capture.");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as any, audio: false });
        const track = stream.getVideoTracks()[0];
        
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        track.stop();
        video.srcObject = null;
        
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'screenshot.png', { type: 'image/png' });
                setUploadedFiles(prev => [...prev, file]);
            }
        }, 'image/png');
    } catch (err) {
        console.error("Screenshot failed:", err);
    }
  };

  const isMicDisabled = isLoading || micPermission === 'denied' || micPermission === 'unsupported';
  const canSend = !isLoading && (prompt.trim().length > 0 || uploadedFiles.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500">
            {uploadedFiles.length > 0 && (
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                            <div key={`${file.name}-${index}-${file.lastModified}`} className="flex items-center justify-between text-xs bg-slate-100 dark:bg-slate-700 p-2 rounded-md overflow-hidden">
                                <span className="truncate text-slate-700 dark:text-slate-300" title={file.name}>{file.name}</span>
                                <button onClick={() => handleRemoveFile(index)} disabled={isLoading} className="text-slate-500 hover:text-red-400 dark:hover:text-red-400 ml-2 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="relative">
                <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={isListening ? "Listening..." : "Initiate command, ask a question, or drop files..."}
                rows={1}
                className="w-full bg-transparent p-4 pr-28 pl-48 prompt-input-text glow-placeholder focus:ring-0 focus:border-transparent border-none resize-none leading-tight overflow-y-auto"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {/* Upload Menu */}
                    <div className="relative" ref={uploadMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsUploadMenuOpen(prev => !prev)}
                            disabled={isLoading}
                            title="Attach files or folders from disk"
                            className="p-2 rounded-full text-slate-400 bg-slate-700 dark:bg-slate-700 light:bg-slate-200 hover:bg-slate-600 transition-colors"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </button>
                        {isUploadMenuOpen && (
                            <div className="absolute bottom-full mb-2 w-48 bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-lg shadow-2xl z-40 p-2">
                                <ul className="space-y-1">
                                    <li><button type="button" onClick={() => { fileInputRef.current?.click(); setIsUploadMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3 hover:bg-slate-700 light:hover:bg-slate-100 text-slate-300 light:text-slate-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg><span>Upload Files</span></button></li>
                                    <li><button type="button" onClick={() => { folderInputRef.current?.click(); setIsUploadMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3 hover:bg-slate-700 light:hover:bg-slate-100 text-slate-300 light:text-slate-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg><span>Upload Folder</span></button></li>
                                </ul>
                            </div>
                        )}
                    </div>
                    {/* Tools Menu */}
                    <div className="relative" ref={toolsMenuRef}>
                         <button type="button" onClick={() => setIsToolsMenuOpen(p => !p)} disabled={isLoading} title="Open tools menu" className="p-2 rounded-full text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        </button>
                        {isToolsMenuOpen && (
                            <div className="absolute bottom-full mb-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-40 p-2">
                                <ul className="space-y-1">
                                    <ToolMenuItem icon="🖥️" title="Take Screenshot" onClick={handleTakeScreenshot} />
                                    <ToolMenuItem icon="📷" title="Take Photo" onClick={() => { setCameraModalOpen(true); setIsToolsMenuOpen(false); }} />
                                    <ToolMenuItem icon="✏️" title="Canvas" onClick={() => { setCanvasModalOpen(true); setIsToolsMenuOpen(false); }} />
                                    <hr className="border-slate-700 my-1"/>
                                    <ToolMenuItem icon="🎨" title="Create Image" onClick={() => { setPrompt('Generate an image of '); textareaRef.current?.focus(); setIsToolsMenuOpen(false); }} />
                                    <ToolMenuItem icon="📚" title="Study & Learn" onClick={() => { setPrompt('Please study the attached document and prepare to answer questions about it.'); textareaRef.current?.focus(); setIsToolsMenuOpen(false); }} />
                                    <ToolMenuItem icon="⏳" title="Think Longer" onClick={() => { setPrompt(p => p + '\n\nPlease provide a more detailed and comprehensive response.'); textareaRef.current?.focus(); setIsToolsMenuOpen(false); }} />
                                    <ToolMenuItem icon="🔬" title="Deep Research" onClick={() => { setIsSearchEnabled(true); setPrompt('Conduct a deep research report on: '); textareaRef.current?.focus(); setIsToolsMenuOpen(false); }} />
                                    <ToolMenuItem icon="🌐" title="Web Search" onClick={() => { setIsSearchEnabled(!isSearchEnabled); setIsToolsMenuOpen(false); }} />
                                </ul>
                            </div>
                        )}
                    </div>
                    {/* Control Buttons */}
                    <button type="button" onClick={() => setIsSearchEnabled(!isSearchEnabled)} disabled={isLoading} title={isSearchEnabled ? "Disable Google Search" : "Enable Google Search"} className={`p-2 rounded-full transition-colors duration-200 ${isSearchEnabled ? 'text-white bg-blue-500' : 'text-slate-400 bg-slate-700 hover:bg-slate-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </button>
                    <PromptEnhancerDropdown />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button type="button" onClick={handleToggleListening} disabled={isMicDisabled} aria-label={isListening ? 'Stop listening' : 'Start listening'} className={`p-2 rounded-full text-white transition-colors duration-200 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-slate-700 hover:bg-slate-600'} ${isMicDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 9v1a4 4 0 004 4h.01a4 4 0 004-4V9a.5.5 0 011 0v1a5 5 0 01-4.5 4.975V17h1.5a.5.5 0 010 1h-4a.5.5 0 010-1H9v-2.025A5 5 0 014.5 10V9a.5.5 0 01.5-.5z" clipRule="evenodd" /></svg>
                </button>
                <button type="submit" disabled={!canSend} aria-label="Send message" className="p-2 rounded-full bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
                </div>
            </form>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
        {/* @ts-ignore */}
        <input type="file" ref={folderInputRef} onChange={handleFileChange} className="hidden" multiple webkitdirectory="true" directory="true" />
    </div>
  );
};