import React, { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { PromptInput } from './components/PromptInput';
import { SettingsModal } from './components/SettingsModal';
import { speak, playSound, primeSpeechEngine } from './services/speechService';
import { Message, MessageRole, VoiceOption, History, UploadedFileInfo, ActiveView } from './types';
import { AppContext } from './contexts/AppContext';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { EvolutionInterface } from './components/EvolutionInterface';
import { ArchitectureMatrix } from './components/ArchitectureMatrix';
import { SovereignBlueprint } from './components/SovereignBlueprint';
import { BuildsMatrix } from './components/BuildsMatrix';
import { TeamsInterface } from './components/TeamsInterface';
import { TranscendenceInterface } from './components/TranscendenceInterface';
import { AgentsInterface } from './components/AgentsInterface';
import { WorkspaceInterface } from './components/WorkspaceInterface';
import { LocalAIInterface } from './components/LocalAIInterface';
import { TravelAgentInterface } from './components/TravelAgentInterface';
import { LandingPage } from './components/LandingPage';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { CanvasModal } from './components/CanvasModal';
import { enhancePrompt, generateImage, generateVideo, getStreamingChatResponse } from './services/geminiService';
import { NEXUS_SYSTEM_PROMPT } from './constants';
import { WorkspaceContext } from './contexts/WorkspaceContext';
import { workspaceTools } from './services/workspaceTools';

const App: React.FC = () => {
  const {
    settings,
    updateSettings,
    messages,
    addMessage,
    updateLastMessage,
    isLoading,
    setIsLoading,
    error,
    setError,
    activeView,
    isSettingsModalOpen,
    setSettingsModalOpen,
    isCameraModalOpen,
    setCameraModalOpen,
    isCanvasModalOpen,
    setCanvasModalOpen,
    setAvatarState,
    isSearchEnabled,
    addRecentSearch,
    stopGenerationRef,
    uploadedFiles,
    clearUploadedFiles,
  } = useContext(AppContext);
  const { addTask, moveTask, listTasks } = useContext(WorkspaceContext);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [systemVoices, setSystemVoices] = useState<VoiceOption[]>([]);
  const greetingSpokenRef = useRef(false);

  useEffect(() => {
      const loadVoices = async () => {
        // Dynamically import getVoices to handle environments where speech an APIs might not be available.
        const { getVoices } = await import('./services/speechService');
        const voices = await getVoices();
        setSystemVoices(voices);
      };
      loadVoices();
  }, []);
  
  // Apply theme on initial mount
  useEffect(() => {
    document.documentElement.className = settings.theme;
  }, []);

  useEffect(() => {
    // Speak initial message if it's the only one and hasn't been spoken
    if (messages.length === 1 && !greetingSpokenRef.current && activeView === ActiveView.CHAT) {
      greetingSpokenRef.current = true;
      setTimeout(() => speak(
        messages[0].text, 
        settings.voiceURI, 
        settings.speechRate, 
        settings.speechPitch,
        () => setAvatarState('speaking'),
        () => setAvatarState('idle')
      ), 500);
    }
  }, [messages, settings, activeView, setAvatarState]);

  // Effect to apply theme when it changes in settings
  useEffect(() => {
    document.documentElement.className = settings.theme;
  }, [settings.theme]);

  // Effect to manage avatar state based on app status
  useEffect(() => {
    if (isLoading) {
      setAvatarState('processing');
    } else if (isListening) {
      setAvatarState('listening');
    } else {
      setAvatarState('idle');
    }
  }, [isLoading, isListening, setAvatarState]);

  const handleSendMessage = useCallback(async (prompt: string, systemPromptOverride?: string) => {
    primeSpeechEngine(); // Ensure speech engine is ready
    if ((!prompt && uploadedFiles.length === 0) || isLoading) return;

    if (isSearchEnabled && prompt) {
        addRecentSearch(prompt);
    }

    setIsLoading(true);
    setError(null);
    stopGenerationRef.current = false;

    const fileInfos: UploadedFileInfo[] = uploadedFiles.map(f => ({ name: f.name, type: f.type, size: f.size }));
    const userMessage: Message = { role: MessageRole.USER, text: prompt, files: fileInfos };
    addMessage(userMessage);

    let executedPrompt = prompt;

    // --- PROMPT ENHANCEMENT LOGIC ---
    if (settings.promptEnhancerMode !== 'off' && executedPrompt && !systemPromptOverride) {
      const enhancerStatusMessage: Message = { role: MessageRole.MODEL, text: 'NEXUS: Analyzing and enhancing prompt...' };
      addMessage(enhancerStatusMessage);

      try {
        const enhancedPromptResult = await enhancePrompt(prompt, settings.promptEnhancerMode);
        
        if (enhancedPromptResult.trim().toLowerCase() !== prompt.trim().toLowerCase()) {
            const enhancementDetails = `**Prompt Enhancement Protocol Activated**\n\n**Mode:** \`${settings.promptEnhancerMode}\`\n\n**Original Directive:**\n> ${prompt}\n\n**Optimized Directive:**\n> ${enhancedPromptResult}\n\n---\n*Proceeding with optimized directive...*`;
            updateLastMessage({ text: enhancementDetails });
            executedPrompt = enhancedPromptResult;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Pause for user to read
        } else {
            updateLastMessage({ text: 'NEXUS: Prompt is optimal. Proceeding with original directive.' });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error("Prompt enhancement failed:", err);
        const errorText = `System Error: Prompt enhancement failed. Proceeding with original prompt.`;
        updateLastMessage({text: errorText});
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    // --- END OF ENHANCEMENT LOGIC ---
    
    const modelMessage: Message = { role: MessageRole.MODEL, text: '' };
    addMessage(modelMessage);

    try {
      const lowerCasePrompt = executedPrompt.toLowerCase();
      const imagePromptKeywords = ['generate image of', 'create an image of', 'draw a picture of', 'generate an image', 'create an image', 'generate a meme of'];
      const videoPromptKeywords = ['generate video of', 'create a video of', 'make a video of', 'generate a video', 'create a video'];

      const imageKeyword = imagePromptKeywords.find(k => lowerCasePrompt.includes(k));
      const videoKeyword = videoPromptKeywords.find(k => lowerCasePrompt.includes(k));
      
      const extractDescription = (fullPrompt: string, keyword: string) => {
          return fullPrompt.substring(fullPrompt.toLowerCase().indexOf(keyword) + keyword.length).trim();
      }

      // --- MULTIMODAL GENERATION LOGIC ---
      // Precedence: Video > Image > Text
      if (videoKeyword) {
        const videoDescription = extractDescription(executedPrompt, videoKeyword);
        const imageFileForVideo = uploadedFiles.find(f => f.type.startsWith('image/'));

        const onProgress = (progressText: string) => {
            updateLastMessage({ text: progressText });
        };
        
        const videoUrl = await generateVideo(videoDescription, onProgress, imageFileForVideo);

        const modelMessageText = imageFileForVideo
            ? `Generated video from uploaded image: ${videoDescription}`
            : `Generated video: ${videoDescription}`;

        updateLastMessage({ text: modelMessageText, videoUrl });
        speak(modelMessageText, settings.voiceURI, settings.speechRate, settings.speechPitch, () => setAvatarState('speaking'), () => setAvatarState('idle'));

      } else if (imageKeyword && uploadedFiles.length === 0) {
        const imageDescription = extractDescription(executedPrompt, imageKeyword);
        updateLastMessage({ text: 'Image generation protocol initiated...' });
        const imageUrl = await generateImage(imageDescription);
        const modelMessageText = `Generated image: ${imageDescription}`;
        updateLastMessage({ text: modelMessageText, imageUrl });
        speak(modelMessageText, settings.voiceURI, settings.speechRate, settings.speechPitch, () => setAvatarState('speaking'), () => setAvatarState('idle'));

      } else { // Default to text/chat/tool response
        const history: History[] = messages
          .slice(0, -2) // Exclude user's new prompt and the empty model message
          .map(msg => ({
              role: msg.role,
              parts: [{ text: msg.text }]
          }));

        // --- TOOL USAGE LOGIC ---
        const workspaceKeywords = ['task', 'workspace', 'board', 'kanban', 'todo', 'in progress', 'done'];
        const useWorkspaceTools = workspaceKeywords.some(kw => lowerCasePrompt.includes(kw));
        
        const stream = getStreamingChatResponse(executedPrompt, systemPromptOverride || NEXUS_SYSTEM_PROMPT, history, isSearchEnabled, uploadedFiles, useWorkspaceTools ? workspaceTools : []);
        
        let fullText = '';
        let finalSources: any[] = [];
        let functionCalls: any[] = [];
        
        for await (const chunk of stream) {
          if (stopGenerationRef.current) {
            console.log("Stream stopped by user.");
            break;
          }
          fullText += chunk.text;
          if (chunk.sources) {
            finalSources = [...chunk.sources];
          }
          if (chunk.functionCalls) {
            functionCalls.push(...chunk.functionCalls);
          }
          updateLastMessage({ text: fullText, sources: finalSources });
        }

        // --- FUNCTION CALL HANDLING ---
        if (functionCalls.length > 0) {
            updateLastMessage({ text: `Executing tools...` });
            
            const functionResponses: any[] = [];
            
            for (const call of functionCalls) {
                let result: any;
                try {
                    switch (call.name) {
                        case 'addTask':
                            result = addTask(call.args.content, call.args.status || 'todo');
                            break;
                        case 'moveTask':
                            result = moveTask(call.args.taskId, call.args.newStatus);
                            break;
                        case 'listTasks':
                            result = listTasks(call.args.status);
                            break;
                        default:
                           throw new Error(`Unknown tool called: ${call.name}`);
                    }
                    functionResponses.push({
                        functionResponse: { name: call.name, response: result }
                    });
                } catch (toolError: any) {
                     functionResponses.push({
                        functionResponse: { name: call.name, response: { error: toolError.message } }
                    });
                }
            }

            // Send function responses back to the model for a final summary
            const historyForFunctionResponse = [
                ...history,
                { role: 'user', parts: [{ text: executedPrompt }] },
                { role: 'model', parts: [{ functionCall: functionCalls[0] }] }, // Simplified for now
            ];
            
            const contentsOverride = [...historyForFunctionResponse, { role: 'function', parts: functionResponses }];
            const finalStream = getStreamingChatResponse(null, systemPromptOverride || NEXUS_SYSTEM_PROMPT, [], false, [], [], contentsOverride);

            let finalText = '';
            for await (const chunk of finalStream) {
                 if (stopGenerationRef.current) break;
                 finalText += chunk.text;
                 updateLastMessage({ text: finalText });
            }
            fullText = finalText; // Set full text for voice output
        }
        // --- END OF FUNCTION CALL HANDLING ---

        if (fullText) {
          playSound(settings.notificationSoundURI);
          speak(fullText, settings.voiceURI, settings.speechRate, settings.speechPitch, () => setAvatarState('speaking'), () => setAvatarState('idle'));
        }
      }
    } catch (err: any) {
      console.error("Error in handleSendMessage:", err);
      let displayError = 'An unexpected system error occurred. Please check the console for details.';
      
      const getErrStr = () => {
        if (typeof err?.message === 'string') return err.message;
        try { return JSON.stringify(err); } catch { return String(err); }
      }
      
      const errorMessage = getErrStr();
      
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error) {
          const { code, message, status } = parsedError.error;
          
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const displayMessage = (message || '').replace(urlRegex, (url: string) => {
            const cleanUrl = url.replace(/[.,)!?]+$/, '');
            return `[${cleanUrl}](${cleanUrl})`;
          });

          if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
            displayError = `**System Error: API Quota Exceeded (${status})**\n\n${displayMessage}\n\n*NEXUS is aware of this limit and will evolve to handle it more gracefully.*`;
          } else if (message && message.toLowerCase().includes('api key')) {
             displayError = '**System Error: Invalid API Key**\n\nPlease check your system configuration. The API key is either missing, invalid, or has been revoked.';
          } else {
             displayError = `**System Error: ${status || 'Unknown'} (Code: ${code || 'N/A'})**\n\n${displayMessage}`;
          }
        } else {
           // Parsed, but not the structure we expected, fall through to string matching
           throw new Error("Parsed JSON has no 'error' property");
        }
      } catch (jsonParseError) {
        // Fallback to string matching for non-JSON errors or unexpected JSON structure
        const lowerCaseError = errorMessage.toLowerCase();
        if (lowerCaseError.includes('api key not configured')) {
          displayError = '**System Error: API Key Not Configured**\n\nThe application is missing the required API key in its environment configuration. Please contact the administrator.';
        } else if (lowerCaseError.includes('api key')) {
          displayError = '**System Error: Invalid API Key**\n\nPlease check your system configuration. The active API key is either missing, invalid, or has been revoked.';
        } else if (lowerCaseError.includes('quota') || lowerCaseError.includes('429') || lowerCaseError.includes('resource_exhausted')) {
          displayError = '**System Error: API Quota or Rate Limit Exceeded**\n\nYour request could not be processed due to API limits. Please check your plan and billing details with the Nexus Cloud AI Platform.\n\n*NEXUS is aware of this limit and will evolve to handle it more gracefully.*';
        } else {
           displayError = `System Error: ${errorMessage}`;
        }
      }

      setError(displayError);
      updateLastMessage({ text: displayError });
      speak(displayError, settings.voiceURI, settings.speechRate, settings.speechPitch, () => setAvatarState('speaking'), () => setAvatarState('idle'));

    } finally {
      setIsLoading(false);
      stopGenerationRef.current = false;
      clearUploadedFiles();
    }
  }, [isLoading, messages, addMessage, updateLastMessage, setIsLoading, setError, stopGenerationRef, isSearchEnabled, settings, uploadedFiles, clearUploadedFiles, setAvatarState, addTask, moveTask, listTasks, addRecentSearch]);


  const renderContent = () => {
    // Full-screen interfaces
    if (activeView === ActiveView.TRANSCENDENCE) {
        return <TranscendenceInterface onSend={handleSendMessage} />;
    }

    // Standard view container for other interfaces
    const viewMap: Partial<Record<ActiveView, React.ReactNode>> = {
        [ActiveView.TRAVEL_AGENT]: <TravelAgentInterface />,
        [ActiveView.AGENTS]: <AgentsInterface />,
        [ActiveView.WORKSPACE]: <WorkspaceInterface />,
        [ActiveView.LOCAL_AI]: <LocalAIInterface />,
        [ActiveView.DIAGNOSTICS]: <SystemDiagnostics />,
        [ActiveView.EVOLUTION]: <EvolutionInterface />,
        [ActiveView.ARCHITECTURE]: <ArchitectureMatrix />,
        [ActiveView.BLUEPRINT]: <SovereignBlueprint />,
        [ActiveView.BUILDS]: <BuildsMatrix />,
        [ActiveView.TEAMS]: <TeamsInterface />,
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {activeView === ActiveView.CHAT ? <ChatWindow /> : (
                <div className="flex-1 overflow-y-auto">
                    {viewMap[activeView]}
                </div>
            )}
            {activeView === ActiveView.CHAT && (
                <div className="p-4 pt-2 border-t border-slate-300 dark:border-transparent">
                    {error && <div className="text-center text-sm mb-2 text-red-600 dark:text-glow-red">{error}</div>}
                    <PromptInput onSend={handleSendMessage} isListening={isListening} setIsListening={setIsListening} />
                </div>
            )}
        </div>
    );
  };
  
  if (activeView === ActiveView.LANDING) {
    return <LandingPage />;
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900 font-sans text-glow-blue transition-colors duration-300">
      <Header onSendMessage={handleSendMessage} />
      {renderContent()}
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
        systemVoices={systemVoices}
      />
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
      />
      <CanvasModal
        isOpen={isCanvasModalOpen}
        onClose={() => setCanvasModalOpen(false)}
      />
    </div>
  );
};


// Main component that provides context to the App
const AppContainer: React.FC = () => {
    const { setSettingsModalOpen } = useContext(AppContext);

    useEffect(() => {
        // Expose a global function to open the settings modal from anywhere
        (window as any).openNexusSettings = () => setSettingsModalOpen(true);
        return () => {
            delete (window as any).openNexusSettings;
        };
    }, [setSettingsModalOpen]);
    
    return <App />;
};

export default AppContainer;