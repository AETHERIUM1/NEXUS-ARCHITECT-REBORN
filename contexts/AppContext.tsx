import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import { Message, Settings, Conversation, PromptEnhancerMode, ActiveView, AvatarState } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { INITIAL_MESSAGE } from '../constants';

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

  // Actions
  addMessage: (message: Message) => void;
  updateLastMessage: (updates: Partial<Message>) => void;
  deleteMessage: (index: number) => void;
  setMessages: (messages: Message[]) => void;
  
  loadConversation: (id: string) => void;
  saveCurrentConversation: () => void;
  createNewConversation: () => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  importConversation: (conversationData: Partial<Conversation>) => void;
  
  updateSettings: (newSettings: Partial<Settings>) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsSearchEnabled: (enabled: boolean) => void;
  setSettingsModalOpen: (isOpen: boolean) => void;
  setCameraModalOpen: (isOpen: boolean) => void;
  setCanvasModalOpen: (isOpen: boolean) => void;
  stopGeneration: () => void;
  openSettingsModal: () => void;
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  clearUploadedFiles: () => void;
  setActiveView: (view: ActiveView) => void;
  setAvatarState: React.Dispatch<React.SetStateAction<AvatarState>>;
}

export const AppContext = createContext<AppContextType>(null!);

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  voiceURI: null,
  enableVoice: true,
  notificationSoundURI: null,
  speechRate: 1,
  speechPitch: 1.1,
  promptEnhancerMode: 'off',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<Settings>('nexus-settings', DEFAULT_SETTINGS);
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('nexus-conversations', []);
  const [currentConversationId, setCurrentConversationId] = useLocalStorage<string | null>('nexus-current-conversation-id', null);
  
  const [messages, setMessagesState] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchEnabled, setIsSearchEnabled] = useState<boolean>(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isCameraModalOpen, setCameraModalOpen] = useState(false);
  const [isCanvasModalOpen, setCanvasModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>(ActiveView.LANDING);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  
  const stopGenerationRef = useRef<boolean>(false);

  // Load current conversation from storage on startup
  useEffect(() => {
    // We only load conversation data if we are NOT on the landing page initially.
    // The user will load a conversation by clicking on it.
    if (activeView !== ActiveView.LANDING) {
      const activeConversation = conversations.find(c => c.id === currentConversationId);
      if (activeConversation) {
        setMessagesState(activeConversation.messages);
      } else if (conversations.length > 0) {
        const mostRecent = conversations.sort((a, b) => b.lastModified - a.lastModified)[0];
        setCurrentConversationId(mostRecent.id);
        setMessagesState(mostRecent.messages);
      } else {
        createNewConversation();
      }
    }
  }, []); // Run once on mount

  const saveCurrentConversation = useCallback(() => {
    if (!currentConversationId) return;

    const now = Date.now();
    const updatedConversations = conversations.map(c =>
      c.id === currentConversationId
        ? { ...c, messages: messages, lastModified: now }
        : c
    );
    setConversations(updatedConversations);
  }, [messages, currentConversationId, conversations, setConversations]);

  // Auto-save whenever messages change
  useEffect(() => {
    if (currentConversationId && activeView === ActiveView.CHAT) {
      saveCurrentConversation();
    }
  }, [messages, currentConversationId, saveCurrentConversation, activeView]);
  
  const setMessages = (newMessages: Message[]) => {
    setMessagesState(newMessages);
  };

  const addMessage = (message: Message) => {
    setMessagesState(prev => [...prev, message]);
  };

  const updateLastMessage = (updates: Partial<Message>) => {
    setMessagesState(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], ...updates };
      }
      return newMessages;
    });
  };

  const deleteMessage = (indexToDelete: number) => {
    if (isLoading || indexToDelete === 0) return;
    setMessagesState(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  const loadConversation = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setCurrentConversationId(id);
      setMessagesState(conversation.messages);
      setActiveView(ActiveView.CHAT); // Switch to chat view when loading a conversation
      setIsLoading(false);
      setError(null);
    }
  };

  const createNewConversation = () => {
    const now = Date.now();
    const newConversation: Conversation = {
      id: `conv-${now}`,
      title: `New Session - ${new Date(now).toLocaleTimeString()}`,
      messages: [INITIAL_MESSAGE],
      createdAt: now,
      lastModified: now,
    };
    setConversations(prev => [...prev, newConversation]);
    setCurrentConversationId(newConversation.id);
    setMessagesState(newConversation.messages);
    setActiveView(ActiveView.CHAT);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remainingConversations = conversations.filter(c => c.id !== id);
      if (remainingConversations.length > 0) {
        loadConversation(remainingConversations.sort((a,b) => b.lastModified - a.lastModified)[0].id);
      } else {
        createNewConversation();
      }
    }
  };

  const renameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle, lastModified: Date.now() } : c));
  };
  
  const importConversation = (conversationData: Partial<Conversation>) => {
    if (!conversationData.messages || !conversationData.title) {
      console.error("Invalid conversation file: missing title or messages.");
      alert("Invalid conversation file: missing title or messages.");
      return;
    }

    const now = Date.now();
    const newConversation: Conversation = {
      id: `conv-${now}`,
      title: conversationData.title || `Imported - ${new Date(now).toLocaleTimeString()}`,
      messages: conversationData.messages,
      createdAt: now,
      lastModified: now,
    };
    
    // Use a functional update to ensure we have the latest conversations array
    setConversations(prev => [...prev, newConversation]);
    // Load the newly created conversation
    setCurrentConversationId(newConversation.id);
    setMessagesState(newConversation.messages);
    setActiveView(ActiveView.CHAT);
    setIsLoading(false);
    setError(null);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const stopGeneration = () => {
    stopGenerationRef.current = true;
  };
  
  const openSettingsModal = () => setSettingsModalOpen(true);
  
  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

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
    setCameraModalOpen,
    setCanvasModalOpen,
    stopGeneration,
    openSettingsModal,
    setUploadedFiles,
    clearUploadedFiles,
    setActiveView,
    setAvatarState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};