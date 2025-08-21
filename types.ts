import { FunctionDeclaration } from "@google/genai";

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface UploadedFileInfo {
  name:string;
  type: string;
  size: number;
}

export interface Message {
  role: MessageRole;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  sources?: GroundingSource[];
  files?: UploadedFileInfo[];
  toolCalls?: any[];
  toolResult?: any;
}

// Types for Gemini API conversation history
export interface Part {
  text: string;
}

export interface History {
  role: 'user' | 'model';
  parts: Part[];
}

export interface VoiceOption {
  voiceURI: string;
  name: string;
  lang?: string;
}

export type PromptEnhancerMode = 'off' | 'standard' | 'creative' | 'technical';

export interface Settings {
  theme: 'light' | 'dark';
  voiceURI: string | null;
  enableVoice: boolean;
  notificationSoundURI: string | null;
  speechRate: number;
  speechPitch: number;
  promptEnhancerMode: PromptEnhancerMode;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastModified: number;
}

export type AvatarState = 'idle' | 'processing' | 'listening' | 'speaking';

export enum ActiveView {
  LANDING = 'LANDING',
  CHAT = 'CHAT',
  AGENTS = 'AGENTS',
  WORKSPACE = 'WORKSPACE',
  LOCAL_AI = 'LOCAL_AI',
  DIAGNOSTICS = 'DIAGNOSTICS',
  EVOLUTION = 'EVOLUTION',
  ARCHITECTURE = 'ARCHITECTURE',
  BLUEPRINT = 'BLUEPRINT',
  BUILDS = 'BUILDS',
  TEAMS = 'TEAMS',
  TRANSCENDENCE = 'TRANSCENDENCE',
  TRAVEL_AGENT = 'TRAVEL_AGENT',
}

export interface TravelPreset {
  label: string;
  prompt: string;
}

// Workspace Types
export type Status = 'todo' | 'inProgress' | 'done';

export interface Task {
  id: string;
  content: string;
}

export interface Tasks {
  todo: Task[];
  inProgress: Task[];
  done: Task[];
}