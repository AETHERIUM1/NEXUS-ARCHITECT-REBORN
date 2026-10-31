import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ActiveView, ModelOption } from '../types';

export type ModelSelectorVariant = 'sticky-banner' | 'input-bar' | 'compact';

export interface ModelSelectorProps {
  variant?: ModelSelectorVariant;
  className?: string;
  onModelChange?: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  variant = 'sticky-banner',
  className = '',
  onModelChange,
}) => {
  const {
    activeModel,
    setActiveModel,
    allModels,
    isLoading,
    setActiveView,
  } = useContext(AppContext);

  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'gemini' | 'local' | 'huggingface'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current active model object
  const currentModel: ModelOption =
    allModels.find((m) => m.id === activeModel || m.name === activeModel) ||
    allModels[0] || {
      id: activeModel,
      name: activeModel,
      provider: 'gemini',
    };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'gemini':
        return '⚡';
      case 'ollama':
      case 'local':
        return '🦙';
      case 'huggingface':
        return '🤗';
      default:
        return '🤖';
    }
  };

  const getProviderLabel = (provider?: string) => {
    switch (provider) {
      case 'gemini':
        return 'Cloud';
      case 'ollama':
      case 'local':
        return 'Local';
      case 'huggingface':
        return 'Hugging Face';
      default:
        return 'AI';
    }
  };

  const getProviderColorClasses = (provider?: string) => {
    switch (provider) {
      case 'gemini':
        return {
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-700/80',
          dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
          border: 'border-cyan-500/50',
          hoverBg: 'hover:bg-cyan-950/40',
          activeBg: 'bg-cyan-950/80 border-cyan-400 text-cyan-100',
        };
      case 'ollama':
      case 'local':
        return {
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/80',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
          border: 'border-emerald-500/50',
          hoverBg: 'hover:bg-emerald-950/40',
          activeBg: 'bg-emerald-950/80 border-emerald-400 text-emerald-100',
        };
      case 'huggingface':
        return {
          badge: 'bg-amber-950 text-amber-300 border-amber-700/80',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
          border: 'border-amber-500/50',
          hoverBg: 'hover:bg-amber-950/40',
          activeBg: 'bg-amber-950/80 border-amber-400 text-amber-100',
        };
      default:
        return {
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
          border: 'border-slate-600',
          hoverBg: 'hover:bg-slate-800',
          activeBg: 'bg-slate-800 border-slate-500 text-white',
        };
    }
  };

  // Group models into the 3 explicit categories
  const cloudModels = allModels.filter((m) => m.provider === 'gemini');
  const localModels = allModels.filter((m) => m.provider === 'local' || m.provider === 'ollama');
  const hfModels = allModels.filter((m) => m.provider === 'huggingface');

  // Filtered lists based on search
  const filterList = (list: ModelOption[]) => {
    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.size && m.size.toLowerCase().includes(q))
    );
  };

  const filteredCloud = filterList(cloudModels);
  const filteredLocal = filterList(localModels);
  const filteredHf = filterList(hfModels);

  const handleSelectModel = (model: ModelOption) => {
    const modelKey = model.provider === 'gemini' ? model.id : model.name;
    setActiveModel(modelKey);
    if (onModelChange) {
      onModelChange(modelKey);
    }
    setIsOpen(false);
  };

  const activeColors = getProviderColorClasses(currentModel.provider);

  // -------------------------------------------------------------
  // Render Popover Dropdown Menu (Shared across variants)
  // -------------------------------------------------------------
  const renderDropdownMenu = (positionClasses: string) => {
    return (
      <div
        className={`absolute z-50 w-80 sm:w-[440px] bg-slate-900/98 border border-cyan-500/50 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden text-left ${positionClasses}`}
      >
        {/* Dropdown Header */}
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Model Selector
                </h4>
                <p className="text-[10px] text-slate-400">
                  Select active chat engine from Cloud, Local, or Hugging Face
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {allModels.length} Total
            </span>
          </div>

          {/* Search Bar inside Dropdown */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search models..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* 3 Category Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 pt-1 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setActiveCategoryTab('all')}
              className={`py-1 px-1.5 rounded text-center transition font-semibold ${
                activeCategoryTab === 'all'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All ({allModels.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryTab('gemini')}
              className={`py-1 px-1.5 rounded text-center transition flex items-center justify-center gap-1 font-semibold ${
                activeCategoryTab === 'gemini'
                  ? 'bg-cyan-900/90 text-cyan-200 border border-cyan-500 shadow'
                  : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40'
              }`}
            >
              <span>⚡</span>
              <span>Cloud ({cloudModels.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryTab('local')}
              className={`py-1 px-1.5 rounded text-center transition flex items-center justify-center gap-1 font-semibold ${
                activeCategoryTab === 'local'
                  ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500 shadow'
                  : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40'
              }`}
            >
              <span>🦙</span>
              <span>Local ({localModels.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryTab('huggingface')}
              className={`py-1 px-1.5 rounded text-center transition flex items-center justify-center gap-1 font-semibold ${
                activeCategoryTab === 'huggingface'
                  ? 'bg-amber-900/90 text-amber-200 border border-amber-500 shadow'
                  : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/40'
              }`}
            >
              <span>🤗</span>
              <span>HF ({hfModels.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Model Lists */}
        <div className="max-h-72 sm:max-h-80 overflow-y-auto p-2.5 space-y-3.5">
          {/* CATEGORY 1: CLOUD MODELS */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'gemini') && (
            <div>
              <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center justify-between border-b border-cyan-900/40 pb-1">
                <span className="flex items-center gap-1.5">
                  <span>⚡</span> Cloud Models (NEXUS Engine)
                </span>
                <span className="text-[10px] text-cyan-400/80">{filteredCloud.length} available</span>
              </div>
              <div className="space-y-1 mt-1.5">
                {filteredCloud.length === 0 ? (
                  <div className="p-2 text-xs text-slate-500 italic">No cloud models match query.</div>
                ) : (
                  filteredCloud.map((m) => {
                    const isSelected = activeModel === m.id || activeModel === m.name;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m)}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-cyan-950/90 border border-cyan-400 text-white font-bold ring-1 ring-cyan-500/50'
                            : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-200">{m.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-cyan-500 text-slate-950 font-extrabold px-1.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          {m.description && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{m.description}</div>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-900 uppercase font-mono flex-shrink-0">
                          Cloud
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 2: DISCOVERED LOCAL MODELS */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'local') && (
            <div>
              <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center justify-between border-b border-emerald-900/40 pb-1">
                <span className="flex items-center gap-1.5">
                  <span>🦙</span> Discovered Local Models (Ollama / Local Server)
                </span>
                <span className="text-[10px] text-emerald-400/80">{filteredLocal.length} available</span>
              </div>
              <div className="space-y-1 mt-1.5">
                {filteredLocal.length === 0 ? (
                  <div className="p-2.5 bg-slate-800/40 rounded-lg text-xs text-slate-400 space-y-1.5">
                    <p className="italic">No local models discovered yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView(ActiveView.LOCAL_AI);
                        setIsOpen(false);
                      }}
                      className="text-xs text-emerald-300 hover:text-emerald-200 font-semibold underline flex items-center gap-1"
                    >
                      <span>💻</span> Open Local AI Hub to discover models →
                    </button>
                  </div>
                ) : (
                  filteredLocal.map((m) => {
                    const isSelected = activeModel === m.id || activeModel === m.name;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m)}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-emerald-950/90 border border-emerald-400 text-white font-bold ring-1 ring-emerald-500/50'
                            : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-300 font-semibold">{m.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-emerald-500 text-slate-950 font-extrabold px-1.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          {m.size && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Size: {m.size}</div>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-mono flex-shrink-0">
                          Local
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 3: HUGGING FACE PULLED MODELS */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'huggingface') && (
            <div>
              <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between border-b border-amber-900/40 pb-1">
                <span className="flex items-center gap-1.5">
                  <span>🤗</span> Hugging Face GGUF Pulled Models
                </span>
                <span className="text-[10px] text-amber-400/80">{filteredHf.length} available</span>
              </div>
              <div className="space-y-1 mt-1.5">
                {filteredHf.length === 0 ? (
                  <div className="p-2.5 bg-slate-800/40 rounded-lg text-xs text-slate-400 space-y-1.5">
                    <p className="italic">No Hugging Face models pulled yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView(ActiveView.MODEL_PULLER);
                        setIsOpen(false);
                      }}
                      className="text-xs text-amber-300 hover:text-amber-200 font-semibold underline flex items-center gap-1"
                    >
                      <span>🤗</span> Search HF & Pull GGUF models in Model Hub →
                    </button>
                  </div>
                ) : (
                  filteredHf.map((m) => {
                    const isSelected = activeModel === m.id || activeModel === m.name;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m)}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-amber-950/90 border border-amber-400 text-white font-bold ring-1 ring-amber-500/50'
                            : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-300 font-semibold">{m.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          {m.size && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Size: {m.size}</div>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase font-mono flex-shrink-0">
                          GGUF
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Hub Navigation Shortcuts Footer */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveView(ActiveView.MODEL_PULLER);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 bg-gradient-to-r from-amber-950/60 to-orange-950/60 hover:from-amber-900/70 hover:to-orange-900/70 text-amber-200 rounded-lg text-xs border border-amber-600/40 font-medium flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">🤗</span>
              <span>Model Hub (Pull from Hugging Face & Ollama)</span>
            </span>
            <span className="font-mono text-[10px] text-amber-400">Open Tab →</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView(ActiveView.LOCAL_AI);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 rounded-lg text-xs border border-cyan-800/50 font-medium flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">💻</span>
              <span>Local AI Hub (Connect Ollama / LM Studio)</span>
            </span>
            <span className="font-mono text-[10px] text-cyan-400">Open Hub →</span>
          </button>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // VARIANT 1: Sticky Top Banner in Chat Area
  // -------------------------------------------------------------
  if (variant === 'sticky-banner') {
    return (
      <div
        ref={containerRef}
        className={`sticky top-0 z-20 w-full bg-slate-900/95 backdrop-blur-md border-b-2 border-cyan-500/60 shadow-lg px-4 py-2.5 ${className}`}
      >
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Model Label & Dropdown Trigger */}
          <div className="relative flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-extrabold flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${activeColors.dot} animate-pulse`} />
              Chat Model:
            </span>

            {/* Clickable Model Selector Pill */}
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border-2 ${activeColors.border} text-xs text-white transition shadow-md cursor-pointer`}
              title="Click to switch between Cloud, Discovered Local, or Hugging Face GGUF models"
            >
              <span className="text-base flex-shrink-0">{getProviderIcon(currentModel.provider)}</span>
              <span className="font-mono text-white font-bold truncate max-w-[160px] sm:max-w-xs">
                {currentModel.name}
              </span>
              <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${activeColors.badge} font-bold`}>
                {getProviderLabel(currentModel.provider)}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-3.5 w-3.5 text-cyan-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Category Quick Chips right in the banner */}
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => {
                  setActiveCategoryTab('gemini');
                  setIsOpen(true);
                }}
                className={`px-2 py-1 rounded-md border flex items-center gap-1 transition ${
                  currentModel.provider === 'gemini'
                    ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200 font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-cyan-300'
                }`}
                title="Browse Cloud Models"
              >
                <span>⚡</span>
                <span>Cloud ({cloudModels.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategoryTab('local');
                  setIsOpen(true);
                }}
                className={`px-2 py-1 rounded-md border flex items-center gap-1 transition ${
                  currentModel.provider === 'local' || currentModel.provider === 'ollama'
                    ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-emerald-300'
                }`}
                title="Browse Discovered Local Models"
              >
                <span>🦙</span>
                <span>Local ({localModels.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategoryTab('huggingface');
                  setIsOpen(true);
                }}
                className={`px-2 py-1 rounded-md border flex items-center gap-1 transition ${
                  currentModel.provider === 'huggingface'
                    ? 'bg-amber-900/60 border-amber-400 text-amber-200 font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-amber-300'
                }`}
                title="Browse Hugging Face GGUF Models"
              >
                <span>🤗</span>
                <span>Hugging Face ({hfModels.length})</span>
              </button>
            </div>

            {/* Dropdown in sticky banner pops downward */}
            {isOpen && renderDropdownMenu('top-full left-0 mt-2')}
          </div>

          {/* Right: Hub Direct Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView(ActiveView.MODEL_PULLER)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition"
              title="Open Model Hub with Hugging Face & Ollama tabs"
            >
              <span>🤗</span>
              <span>Model Hub Tabs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView(ActiveView.LOCAL_AI)}
              className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition"
              title="View discovered local models in Local AI Hub"
            >
              <span>💻</span>
              <span>Local AI Hub</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 2: Secondary Selector directly above PromptInput textarea
  // -------------------------------------------------------------
  if (variant === 'input-bar') {
    return (
      <div
        ref={containerRef}
        className={`relative flex items-center justify-between px-3.5 py-2 border-b-2 border-cyan-500/40 bg-slate-900 rounded-t-lg ${className}`}
      >
        {/* Left: Model Label & Dropdown Trigger */}
        <div className="relative flex items-center gap-2.5">
          <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${activeColors.dot} animate-pulse`} />
            Model:
          </span>

          {/* Input Bar Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border ${activeColors.border} text-xs text-white transition shadow-sm cursor-pointer`}
            title="Switch active model for this prompt"
          >
            <span className="text-sm">{getProviderIcon(currentModel.provider)}</span>
            <span className="font-mono text-white font-bold truncate max-w-[130px] sm:max-w-xs">
              {currentModel.name}
            </span>
            <span className={`text-[10px] font-mono uppercase px-1 py-0.2 rounded border ${activeColors.badge}`}>
              {getProviderLabel(currentModel.provider)}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3 w-3 text-cyan-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Direct category chips */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => {
                setActiveCategoryTab('gemini');
                setIsOpen(true);
              }}
              className="text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 px-1.5 py-0.5 rounded border border-cyan-800/60 transition"
              title="Cloud Models"
            >
              ⚡ Cloud
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategoryTab('local');
                setIsOpen(true);
              }}
              className="text-emerald-400 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-800/60 transition"
              title="Discovered Local Models"
            >
              🦙 Local
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategoryTab('huggingface');
                setIsOpen(true);
              }}
              className="text-amber-400 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-800/60 transition"
              title="Hugging Face GGUFs"
            >
              🤗 HF
            </button>
          </div>

          {/* Popover pops upward above PromptInput */}
          {isOpen && renderDropdownMenu('bottom-full left-0 mb-2')}
        </div>

        {/* Right: Hub Navigation */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveView(ActiveView.MODEL_PULLER)}
            className="text-amber-200 hover:text-white flex items-center gap-1.5 text-xs font-bold bg-amber-600/30 hover:bg-amber-600/50 px-2.5 py-1 rounded-md border border-amber-500/60 transition shadow-sm"
            title="Search Hugging Face GGUF models or pull from Ollama"
          >
            <span>🤗</span>
            <span>Model Hub</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView(ActiveView.LOCAL_AI)}
            className="text-cyan-200 hover:text-white flex items-center gap-1.5 text-xs font-semibold bg-cyan-600/30 hover:bg-cyan-600/50 px-2.5 py-1 rounded-md border border-cyan-500/60 transition shadow-sm"
            title="Discover local server models"
          >
            <span>💻</span>
            <span>Local AI</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 3: Compact Dropdown (Header or custom placement)
  // -------------------------------------------------------------
  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border ${activeColors.border} text-xs text-white transition shadow-md cursor-pointer`}
        title="Switch active model"
      >
        <span className="text-sm">{getProviderIcon(currentModel.provider)}</span>
        <span className="font-mono text-white font-bold truncate max-w-[140px]">
          {currentModel.name}
        </span>
        <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${activeColors.badge}`}>
          {getProviderLabel(currentModel.provider)}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3 w-3 text-cyan-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && renderDropdownMenu('top-full left-0 mt-2')}
    </div>
  );
};
