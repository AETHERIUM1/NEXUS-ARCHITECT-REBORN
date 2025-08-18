import React from 'react';
import { VoiceOption, Settings, PromptEnhancerMode } from '../types';

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
  if (!isOpen) return null;

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