import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import { Message, Settings, Conversation, ActiveView, AvatarState, MessageRole, ModelOption } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { INITIAL_MESSAGE } from '../constants';
import { getStoredModels, StoredModel } from '../services/modelStorage';

export interface DiscoveredModel {
  name: string;
  size: string;
}

interface AppContextType {
  // State
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  isSearchEnabled: boolean;
  isSettingsModalOpen: boolean;
  isCameraModalOpen: boolean;
  isCanvasModalOpen: boolean;
  stopGenerationRef: React.MutableRefObject<boolean>;
  uploadedFiles: File[];
  activeView: ActiveView;
  avatarState: AvatarState;
  recentSearches: string[];
  activeModel: string;
  discoveredLocalModels: DiscoveredModel[];
  allModels: ModelOption[];

  // Actions
  setActiveModel: (id: string) => void;
  setDiscoveredLocalModels: React.Dispatch<React.SetStateAction<DiscoveredModel[]>>;
  useModelInChat: (modelName: string, provider?: 'ollama' | 'local' | 'huggingface') => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (updates: Partial<Message>) => void;
  deleteMessage: (index: number) => void;
  setMessages: (messages: Message[]) => void;
  
  loadConversation: (id: string) => void;
  saveCurrentConversation: () => void;
  createNewConversation: () => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  importConversation: (conversationData: { title: string; messages: Message[] }) => void;

  updateSettings: (newSettings: Partial<Settings>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setIsSearchEnabled: (isSearchEnabled: boolean) => void;
  setSettingsModalOpen: (isOpen: boolean) => void;
  openSettingsModal: () => void;
  
  stopGeneration: () => void;

  setUploadedFiles: (files: File[] | ((prevFiles: File[]) => File[])) => void;
  clearUploadedFiles: () => void;
  
  setActiveView: (view: ActiveView) => void;
  setAvatarState: (state: AvatarState) => void;
  setCameraModalOpen: (isOpen: boolean) => void;
  setCanvasModalOpen: (isOpen: boolean) => void;

  addRecentSearch: (query: string) => void;
}

const defaultAppContext: AppContextType = {
  messages: [],
  conversations: [],
  currentConversationId: null,
  settings: {
    theme: 'dark',
    voiceURI: null,
    notificationSoundURI: 'https://cdn.pixabay.com/audio/2022/03/15/audio_547ce6a6a5.mp3',
    speechRate: 1,
    speechPitch: 1.1,
    promptEnhancerMode: 'standard',
  },
  isLoading: false,
  error: null,
  isSearchEnabled: false,
  isSettingsModalOpen: false,
  isCameraModalOpen: false,
  isCanvasModalOpen: false,
  stopGenerationRef: { current: false },
  uploadedFiles: [],
  activeView: ActiveView.CHAT,
  avatarState: 'idle',
  recentSearches: [],
  activeModel: 'gemini-3.5-flash',
  discoveredLocalModels: [],
  allModels: [],
  setActiveModel: () => {},
  setDiscoveredLocalModels: () => {},
  useModelInChat: () => {},
  addMessage: () => {},
  updateLastMessage: () => {},
  deleteMessage: () => {},
  setMessages: () => {},
  loadConversation: () => {},
  saveCurrentConversation: () => {},
  createNewConversation: () => {},
  deleteConversation: () => {},
  renameConversation: () => {},
  importConversation: () => {},
  updateSettings: () => {},
  setIsLoading: () => {},
  setError: () => {},
  setIsSearchEnabled: () => {},
  setSettingsModalOpen: () => {},
  openSettingsModal: () => {},
  stopGeneration: () => {},
  setUploadedFiles: () => {},
  clearUploadedFiles: () => {},
  setActiveView: () => {},
  setAvatarState: () => {},
  setCameraModalOpen: () => {},
  setCanvasModalOpen: () => {},
  addRecentSearch: () => {},
};

export const AppContext = createContext<AppContextType>(defaultAppContext);

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  voiceURI: null,
  notificationSoundURI: 'https://cdn.pixabay.com/audio/2022/03/15/audio_547ce6a6a5.mp3',
  speechRate: 1,
  speechPitch: 1.1,
  promptEnhancerMode: 'standard',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('nexus-conversations', []);
  const [currentConversationId, setCurrentConversationId] = useLocalStorage<string | null>('nexus-current-conversation-id', null);
  const [settings, setSettings] = useLocalStorage<Settings>('nexus-settings', DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isCameraModalOpen, setCameraModalOpen] = useState(false);
  const [isCanvasModalOpen, setCanvasModalOpen] = useState(false);
  const stopGenerationRef = useRef(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeView, setActiveView] = useLocalStorage<ActiveView>('nexus-active-view', ActiveView.CHAT);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('nexus-recent-searches', []);
  const [activeModel, setActiveModel] = useLocalStorage<string>('nexus-active-model', 'gemini-3.5-flash');
  const [discoveredLocalModels, setDiscoveredLocalModels] = useLocalStorage<DiscoveredModel[]>('nexus-discovered-local-models', [
    { name: 'llama3:8b-instruct-q5_K_M', size: '5.1 GB' },
    { name: 'mistral:7b-instruct-v0.2-q6_K', size: '5.2 GB' },
    { name: 'codellama:13b-instruct-q4_K_M', size: '7.4 GB' },
    { name: 'deepseek-coder:6.7b-instruct-q5_K_S', size: '4.7 GB' },
  ]);
  const [storedModels, setStoredModels] = useState<StoredModel[]>([]);

  // Automatically migrate from LANDING to CHAT so user immediately lands on the chat interface with model controls
  useEffect(() => {
    if (activeView === ActiveView.LANDING) {
      setActiveView(ActiveView.CHAT);
    }
  }, [activeView, setActiveView]);

  useEffect(() => {
    getStoredModels().then(models => setStoredModels(models)).catch(() => {});
  }, []);

  const allModels: ModelOption[] = [
    { id: 'gemini-3.5-flash', name: 'NEXUS 3.5 Flash (Cloud Default)', provider: 'gemini', description: 'DeepMind multimodal reasoning & code generation' },
    { id: 'gemini-3.1-pro', name: 'NEXUS 3.1 Pro (Deep Reasoning)', provider: 'gemini', description: 'Complex logic and multi-step synthesis' },
    ...discoveredLocalModels.map(m => ({
      id: m.name,
      name: m.name,
      provider: 'local' as const,
      size: m.size,
      description: `Discovered in Local AI Hub (${m.size})`,
    })),
    ...storedModels.filter(sm => !discoveredLocalModels.some(dm => dm.name === sm.name)).map(sm => ({
      id: sm.name,
      name: sm.name,
      provider: sm.provider as any,
      size: sm.size ? `${(sm.size / (1024*1024*1024)).toFixed(2)} GB` : undefined,
      description: `Model Hub Pulled (${sm.provider.toUpperCase()})`,
    })),
  ];

  const useModelInChat = useCallback((modelName: string, provider: 'ollama' | 'local' | 'huggingface' = 'local') => {
    setActiveModel(modelName);
    setActiveView(ActiveView.CHAT);
    setMessages(prev => [
      ...prev,
      {
        role: MessageRole.MODEL,
        text: `⚡ **Active model set to: \`${modelName}\`** (${provider.toUpperCase()})\n\nResponses will now be routed through this model. You can switch models anytime using the model selector dropdown in the chat prompt bar.`,
      }
    ]);
  }, [setActiveModel, setActiveView]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateLastMessage = useCallback((updates: Partial<Message>) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], ...updates };
      }
      return newMessages;
    });
  }, []);
  
  const deleteMessage = useCallback((index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const stopGeneration = useCallback(() => {
    stopGenerationRef.current = true;
    setIsLoading(false);
    console.log("Stop generation requested.");
  }, []);

  const openSettingsModal = useCallback(() => setSettingsModalOpen(true), []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const clearUploadedFiles = useCallback(() => setUploadedFiles([]), []);
  
  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
        const lowerCaseQuery = query.trim().toLowerCase();
        const filtered = prev.filter(s => s.toLowerCase() !== lowerCaseQuery);
        const newSearches = [query.trim(), ...filtered];
        return newSearches.slice(0, 15); // Keep last 15 searches
    });
  }, [setRecentSearches]);
  
  const saveCurrentConversation = useCallback(() => {
    if (!currentConversationId) return;

    if (messages.length <= 1 && messages[0]?.role === MessageRole.MODEL) {
      return;
    }

    setConversations(prev => {
      const existingConv = prev.find(c => c.id === currentConversationId);
      const updatedConv: Conversation = {
        id: currentConversationId,
        title: existingConv?.title || messages.find(m => m.role === MessageRole.USER)?.text.substring(0, 40) || 'Untitled Session',
        messages: messages,
        createdAt: existingConv?.createdAt || Date.now(),
        lastModified: Date.now(),
      };
      const otherConvs = prev.filter(c => c.id !== currentConversationId);
      return [...otherConvs, updatedConv];
    });
  }, [currentConversationId, messages, setConversations]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
        saveCurrentConversation();
    }, 1000);

    return () => {
        clearTimeout(handler);
    };
  }, [messages, saveCurrentConversation]);

  const loadConversation = useCallback((id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setMessages(conversation.messages);
      setCurrentConversationId(id);
      setActiveView(ActiveView.CHAT);
    }
  }, [conversations, setCurrentConversationId, setActiveView]);

  const createNewConversation = useCallback(() => {
    saveCurrentConversation();
    const newId = `conv-${Date.now()}`;
    setMessages([INITIAL_MESSAGE]);
    setCurrentConversationId(newId);
    setActiveView(ActiveView.CHAT);
  }, [saveCurrentConversation, setCurrentConversationId, setActiveView]);
  
  useEffect(() => {
    if (!currentConversationId) {
      createNewConversation();
    } else {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        setMessages(conversation.messages);
      } else {
        createNewConversation();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remainingConversations = conversations.filter(c => c.id !== id);
      if (remainingConversations.length > 0) {
          const mostRecent = [...remainingConversations].sort((a,b) => b.lastModified - a.lastModified)[0];
          loadConversation(mostRecent.id);
      } else {
          createNewConversation();
      }
    }
  }, [conversations, currentConversationId, setConversations, createNewConversation, loadConversation]);

  const renameConversation = useCallback((id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle, lastModified: Date.now() } : c));
  }, [setConversations]);
  
  const importConversation = useCallback((conversationData: { title: string; messages: Message[] }) => {
    const newId = `conv-${Date.now()}`;
    const newConversation: Conversation = {
        id: newId,
        title: conversationData.title,
        messages: conversationData.messages,
        createdAt: Date.now(),
        lastModified: Date.now(),
    };
    setConversations(prev => [...prev, newConversation]);
    loadConversation(newId);
  }, [setConversations, loadConversation]);

  const value = {
    messages,
    conversations,
    currentConversationId,
    settings,
    isLoading,
    error,
    isSearchEnabled,
    isSettingsModalOpen,
    isCameraModalOpen,
    isCanvasModalOpen,
    stopGenerationRef,
    uploadedFiles,
    activeView,
    avatarState,
    recentSearches,
    activeModel,
    discoveredLocalModels,
    allModels,
    setActiveModel,
    setDiscoveredLocalModels,
    useModelInChat,
    addMessage,
    updateLastMessage,
    deleteMessage,
    setMessages,
    loadConversation,
    saveCurrentConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    importConversation,
    updateSettings,
    setIsLoading,
    setError,
    setIsSearchEnabled,
    setSettingsModalOpen,
    openSettingsModal,
    stopGeneration,
    setUploadedFiles,
    clearUploadedFiles,
    setActiveView,
    setAvatarState,
    setCameraModalOpen,
    setCanvasModalOpen,
    addRecentSearch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};