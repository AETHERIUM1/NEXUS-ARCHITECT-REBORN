import React, { useState } from 'react';
import { VoiceOption, Settings, PromptEnhancerMode, ApiKey } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  systemVoices: VoiceOption[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
  systemVoices
}) => {
  const [newApiKey, setNewApiKey] = useState('');

  if (!isOpen) return null;

  const maskApiKey = (key: string) => {
    if (key.length < 10) return key;
    return `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
  };

  const handleAddKey = () => {
    if (!newApiKey.trim() || !newApiKey.startsWith('AIza')) {
      alert("Please enter a valid Gemini API key. It should start with 'AIza'.");
      return;
    }
    const newKeyItem: ApiKey = { id: `key-${Date.now()}`, key: newApiKey.trim() };
    const newKeys = [...settings.apiKeys, newKeyItem];
    const newActiveId = settings.activeApiKeyId || newKeyItem.id;
    updateSettings({ apiKeys: newKeys, activeApiKeyId: newActiveId });
    setNewApiKey('');
  };

  const handleDeleteKey = (idToDelete: string) => {
    const newKeys = settings.apiKeys.filter(k => k.id !== idToDelete);
    let newActiveId = settings.activeApiKeyId;
    if (settings.activeApiKeyId === idToDelete) {
      newActiveId = newKeys.length > 0 ? newKeys[0].id : null;
    }
    updateSettings({ apiKeys: newKeys, activeApiKeyId: newActiveId });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg border border-slate-700 dark:border-slate-700 light:border-slate-300" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white dark:text-white light:text-slate-900">Configuration</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white dark:hover:text-white light:hover:text-black text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-6 text-slate-300 dark:text-slate-300 light:text-slate-700">
          
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="flex gap-2">
              <button onClick={() => updateSettings({ theme: 'dark' })} className={`px-4 py-2 rounded-md text-sm w-full ${settings.theme === 'dark' ? 'bg-cyan-600 text-white' : 'bg-slate-700 dark:bg-slate-700 light:bg-slate-200'}`}>Dark</button>
              <button onClick={() => updateSettings({ theme: 'light' })} className={`px-4 py-2 rounded-md text-sm w-full ${settings.theme === 'light' ? 'bg-cyan-600 text-white' : 'bg-slate-700 dark:bg-slate-700 light:bg-slate-200'}`}>Light</button>
            </div>
          </div>

          <hr className="border-slate-700 dark:border-slate-700 light:border-slate-200" />
          
          {/* API Keys */}
          <div>
            <h3 className="text-lg font-semibold text-white dark:text-white light:text-slate-800">API Keys</h3>
            <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-400 mt-2 mb-2">
              Manage your Google Gemini API keys. The active key will be used for all requests. Keys are stored locally in your browser.
            </p>
            <div className="flex gap-2 mt-4">
              <input
                type="password"
                value={newApiKey}
                onChange={e => setNewApiKey(e.target.value)}
                placeholder="Enter new Gemini API key"
                className="flex-grow bg-slate-700 dark:bg-slate-700 light:bg-slate-200 border border-slate-600 dark:border-slate-600 light:border-slate-300 rounded-md py-2 px-3 text-white dark:text-white light:text-black focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <button onClick={handleAddKey} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                Add
              </button>
            </div>
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
              {settings.apiKeys.length === 0 ? (
                <div className="text-center text-sm text-slate-500 p-4 bg-slate-700/50 rounded-lg">
                  No API keys configured. Add one to begin.
                </div>
              ) : (
                settings.apiKeys.map(apiKey => (
                  <div key={apiKey.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id={`key-radio-${apiKey.id}`}
                        name="active-api-key"
                        checked={settings.activeApiKeyId === apiKey.id}
                        onChange={() => updateSettings({ activeApiKeyId: apiKey.id })}
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 cursor-pointer"
                      />
                      <label htmlFor={`key-radio-${apiKey.id}`} className="font-mono text-sm text-slate-300 cursor-pointer">{maskApiKey(apiKey.key)}</label>
                    </div>
                    <button onClick={() => handleDeleteKey(apiKey.id)} className="text-slate-500 hover:text-red-400" title="Delete API Key">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="border-slate-700 dark:border-slate-700 light:border-slate-200" />

          {/* Prompt Enhancer */}
          <div>
            <h3 className="text-lg font-semibold text-white dark:text-white light:text-slate-800">Prompt Enhancement</h3>
             <label htmlFor="enhancer-select" className="block text-sm font-medium mb-2">
              Automatic Prompt Optimization
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-400 mt-2 mb-2">
              Automatically refines your prompts for better AI responses.
            </p>
             <select
              id="enhancer-select"
              value={settings.promptEnhancerMode || 'off'}
              onChange={e => updateSettings({ promptEnhancerMode: e.target.value as PromptEnhancerMode })}
              className="w-full bg-slate-700 dark:bg-slate-700 light:bg-slate-200 border border-slate-600 dark:border-slate-600 light:border-slate-300 rounded-md py-2 px-3 text-white dark:text-white light:text-black focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="off">Off</option>
              <option value="standard">Standard Enhancement</option>
              <option value="creative">Creative Expansion</option>
              <option value="technical">Technical Optimization</option>
            </select>
          </div>

          <hr className="border-slate-700 dark:border-slate-700 light:border-slate-200" />


          {/* Voice Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white dark:text-white light:text-slate-800 mb-2">AI Voice</h3>
            
            <div className="flex items-center justify-between bg-slate-700/50 dark:bg-slate-700/50 light:bg-slate-100 p-3 rounded-lg">
                <span className="font-medium text-white dark:text-white light:text-slate-800">Enable Voice Output</span>
                <label htmlFor="voice-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="voice-toggle" className="sr-only peer"
                        checked={settings.enableVoice}
                        onChange={e => updateSettings({ enableVoice: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-600 dark:bg-slate-600 light:bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
            </div>

            <div className={settings.enableVoice ? 'opacity-100 transition-opacity' : 'opacity-50 transition-opacity pointer-events-none'}>
              <div>
                <label htmlFor="voice-select" className="block text-sm font-medium mb-2">
                  Voice Personality
                </label>
                <select
                  id="voice-select"
                  value={settings.voiceURI || ''}
                  onChange={e => updateSettings({ voiceURI: e.target.value })}
                  className="w-full bg-slate-700 dark:bg-slate-700 light:bg-slate-200 border border-slate-600 dark:border-slate-600 light:border-slate-300 rounded-md py-2 px-3 text-white dark:text-white light:text-black focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="">Browser Default</option>
                  {systemVoices.map(voice => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="rate-slider" className="block text-sm font-medium mb-2">Rate: {settings.speechRate.toFixed(1)}</label>
                  <input type="range" id="rate-slider" min="0.5" max="2" step="0.1" value={settings.speechRate} onChange={e => updateSettings({ speechRate: parseFloat(e.target.value)})} 
                    className="w-full h-2 bg-slate-700 dark:bg-slate-700 light:bg-slate-300 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
                <div>
                  <label htmlFor="pitch-slider" className="block text-sm font-medium mb-2">Pitch: {settings.speechPitch.toFixed(1)}</label>
                  <input type="range" id="pitch-slider" min="0" max="2" step="0.1" value={settings.speechPitch} onChange={e => updateSettings({ speechPitch: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-slate-700 dark:bg-slate-700 light:bg-slate-300 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <hr className="border-slate-700 dark:border-slate-700 light:border-slate-200" />

          {/* Notification Sound Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white dark:text-white light:text-slate-800">Notifications</h3>
             <label htmlFor="notification-select" className="block text-sm font-medium mb-2">
              Response Notification Sound
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-400 mt-2 mb-2">
              A short audio cue that plays before the AI speaks.
            </p>
             <select
              id="notification-select"
              value={settings.notificationSoundURI || ''}
              onChange={e => updateSettings({ notificationSoundURI: e.target.value === 'null' ? null : e.target.value })}
              className="w-full bg-slate-700 dark:bg-slate-700 light:bg-slate-200 border border-slate-600 dark:border-slate-600 light:border-slate-300 rounded-md py-2 px-3 text-white dark:text-white light:text-black focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="null">None</option>
              <option value="https://cdn.pixabay.com/audio/2022/03/15/audio_547ce6a6a5.mp3">Subtle</option>
              <option value="https://cdn.pixabay.com/audio/2021/08/04/audio_9206ac32f5.mp3">Chime</option>
              <option value="https://cdn.pixabay.com/audio/2022/11/17/audio_835741d523.mp3">Data</option>
            </select>
          </div>
        </div>
        
        <div className="mt-8 text-right">
          <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};