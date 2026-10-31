import React, { useState, useEffect, useRef, useContext } from 'react';
import { ViewContainer } from './ViewContainer';
import { AppContext } from '../contexts/AppContext';
import { ActiveView } from '../types';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';
import {
  searchHFModels,
  fetchHFRepoDetails,
  downloadGGUFStreaming,
  generateModelfile,
  formatBytes,
  HFModelSummary,
  HFRepoDetails,
  GGUFFileInfo,
  DownloadProgress,
  POPULAR_GGUF_REPOS,
} from '../services/huggingFaceService';
import {
  checkConnectivity,
  sendPullToProxy,
  pullOllamaModel,
  ProxyStatus,
  OllamaProgress,
  DEFAULT_PROXY_URL,
  DEFAULT_OLLAMA_URL,
} from '../services/proxyService';
import {
  saveModelToStorage,
  getStoredModels,
  deleteStoredModel,
  getModelBlob,
  getStorageQuotaInfo,
  StoredModel,
} from '../services/modelStorage';
import {
  OLLAMA_CATALOG,
  OllamaCatalogItem,
  searchOllamaCatalog,
} from '../services/ollamaService';

type ActiveTab = 'huggingface' | 'ollama' | 'library';

export const ModelPullerInterface: React.FC = () => {
  const { useModelInChat, setActiveView } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<ActiveTab>('huggingface');

  // Proxy & Ollama connectivity state
  const [proxyStatus, setProxyStatus] = useState<ProxyStatus>({
    proxyReachable: false,
    proxyUrl: DEFAULT_PROXY_URL,
    ollamaReachable: false,
    ollamaUrl: DEFAULT_OLLAMA_URL,
    localModels: [],
    lastChecked: 0,
  });
  const [isCheckingProxy, setIsCheckingProxy] = useState(false);
  const [storageQuota, setStorageQuota] = useState<{ usage: number; quota: number; formatted: string }>({
    usage: 0,
    quota: 0,
    formatted: 'Loading storage quota...',
  });

  // Hugging Face state
  const [hfSearchQuery, setHfSearchQuery] = useState('');
  const [hfSearchResults, setHfSearchResults] = useState<HFModelSummary[]>(POPULAR_GGUF_REPOS);
  const [isSearchingHF, setIsSearchingHF] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<HFRepoDetails | null>(null);
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Hugging Face Download / Pull state
  const [currentHfPullFile, setCurrentHfPullFile] = useState<GGUFFileInfo | null>(null);
  const [hfDownloadProgress, setHfDownloadProgress] = useState<DownloadProgress | null>(null);
  const [proxyLog, setProxyLog] = useState<string[]>([]);
  const [isPullingToProxy, setIsPullingToProxy] = useState(false);
  const [completedPullModel, setCompletedPullModel] = useState<StoredModel | null>(null);
  const hfAbortControllerRef = useRef<AbortController | null>(null);

  // Ollama state
  const [ollamaSearchQuery, setOllamaSearchQuery] = useState('');
  const [ollamaCategory, setOllamaCategory] = useState<string>('all');
  const [customOllamaTag, setCustomOllamaTag] = useState('');
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<OllamaCatalogItem>(OLLAMA_CATALOG[0]);
  const [selectedTag, setSelectedTag] = useState<string>(OLLAMA_CATALOG[0].recommendedTag);
  const [ollamaPullProgress, setOllamaPullProgress] = useState<OllamaProgress | null>(null);
  const [isPullingOllama, setIsPullingOllama] = useState(false);
  const [ollamaPullMessage, setOllamaPullMessage] = useState<string | null>(null);
  const ollamaAbortControllerRef = useRef<AbortController | null>(null);

  // Stored Library state
  const [storedModels, setStoredModels] = useState<StoredModel[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [selectedLibraryModel, setSelectedLibraryModel] = useState<StoredModel | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Initial checks
  useEffect(() => {
    refreshConnectivity();
    refreshStorageInfo();
    loadStoredModels();
  }, []);

  const refreshConnectivity = async () => {
    setIsCheckingProxy(true);
    try {
      const status = await checkConnectivity();
      setProxyStatus(status);
    } catch {
      // Ignored
    } finally {
      setIsCheckingProxy(false);
    }
  };

  const refreshStorageInfo = async () => {
    const quota = await getStorageQuotaInfo();
    setStorageQuota(quota);
  };

  const loadStoredModels = async () => {
    setIsLoadingLibrary(true);
    try {
      const models = await getStoredModels();
      setStoredModels(models);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ------------------ Hugging Face Handlers ------------------

  const handleSearchHF = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchingHF(true);
    try {
      const results = await searchHFModels(hfSearchQuery);
      setHfSearchResults(results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearchingHF(false);
    }
  };

  const handleOpenRepo = async (repoId: string) => {
    setIsLoadingRepo(true);
    setRepoError(null);
    setSelectedRepo(null);
    try {
      const details = await fetchHFRepoDetails(repoId);
      setSelectedRepo(details);
    } catch (err: any) {
      setRepoError(err.message || 'Failed to fetch repository files');
    } finally {
      setIsLoadingRepo(false);
    }
  };

  const handlePullHFFile = async (file: GGUFFileInfo) => {
    if (!selectedRepo) return;
    setCurrentHfPullFile(file);
    setCompletedPullModel(null);
    setProxyLog([]);

    const cleanModelName = `${selectedRepo.id.split('/')[1] || selectedRepo.id}-${file.quant}`
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');

    // Case 1: Local proxy at localhost:3901 is reachable
    if (proxyStatus.proxyReachable) {
      setIsPullingToProxy(true);
      setProxyLog((prev) => [...prev, `[PROXY] Connecting to ${proxyStatus.proxyUrl}...`]);

      const result = await sendPullToProxy({
        repoId: selectedRepo.id,
        file: file.fileName,
        modelName: cleanModelName,
        proxyUrl: proxyStatus.proxyUrl,
        onLog: (msg) => setProxyLog((prev) => [...prev, msg]),
      });

      setIsPullingToProxy(false);

      if (result.success) {
        setProxyLog((prev) => [
          ...prev,
          `[SUCCESS] Proxy downloaded ${file.fileName} and executed: 'ollama create ${cleanModelName} -f Modelfile'`,
          `[INFO] Model is now available in your local Ollama runtime. Test with: ollama run ${cleanModelName}`,
        ]);

        const modelfileContent = generateModelfile(file.fileName);
        const storedModel: StoredModel = {
          id: `hf:${selectedRepo.id}:${file.fileName}`,
          provider: 'huggingface',
          name: cleanModelName,
          fileName: file.fileName,
          repoId: selectedRepo.id,
          quant: file.quant,
          size: file.size,
          downloadedAt: Date.now(),
          hasBlob: false,
          status: 'proxy-managed',
          modelfile: modelfileContent,
        };
        await saveModelToStorage(storedModel);
        loadStoredModels();
        setCompletedPullModel(storedModel);
      } else {
        setProxyLog((prev) => [
          ...prev,
          `[ERROR] Proxy dispatch failed: ${result.message}`,
          `[FALLBACK] Initiating in-browser direct streaming download...`,
        ]);
        // Fallback to in-browser pull
        await startInBrowserHFDownload(file, cleanModelName);
      }
    } else {
      // Case 2: No proxy - download directly in-browser via ReadableStream
      await startInBrowserHFDownload(file, cleanModelName);
    }
  };

  const startInBrowserHFDownload = async (file: GGUFFileInfo, cleanModelName: string) => {
    if (!selectedRepo) return;
    hfAbortControllerRef.current = new AbortController();

    try {
      setHfDownloadProgress({
        receivedBytes: 0,
        totalBytes: file.size,
        percent: 0,
        speedBytesPerSec: 0,
        speedFormatted: '0 MB/s',
        elapsedSec: 0,
        status: 'connecting',
      });

      const blob = await downloadGGUFStreaming({
        repoId: selectedRepo.id,
        fileName: file.fileName,
        expectedSize: file.size,
        onProgress: (p) => setHfDownloadProgress(p),
        signal: hfAbortControllerRef.current.signal,
      });

      setHfDownloadProgress((prev) => (prev ? { ...prev, status: 'saving' } : null));

      const modelfileContent = generateModelfile(file.fileName);
      const storedModel: StoredModel = {
        id: `hf:${selectedRepo.id}:${file.fileName}`,
        provider: 'huggingface',
        name: cleanModelName,
        fileName: file.fileName,
        repoId: selectedRepo.id,
        quant: file.quant,
        size: blob.size || file.size,
        downloadedAt: Date.now(),
        hasBlob: true,
        status: 'ready',
        modelfile: modelfileContent,
      };

      const saveResult = await saveModelToStorage(storedModel, blob);
      if (saveResult.error) {
        console.warn('Storage warning:', saveResult.error);
      }

      setHfDownloadProgress((prev) => (prev ? { ...prev, status: 'complete', percent: 100 } : null));
      setCompletedPullModel(storedModel);
      loadStoredModels();
      refreshStorageInfo();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setHfDownloadProgress(null);
      } else {
        setHfDownloadProgress((prev) =>
          prev
            ? { ...prev, status: 'error', errorMessage: err.message || 'Download failed' }
            : {
                receivedBytes: 0,
                totalBytes: 0,
                percent: 0,
                speedBytesPerSec: 0,
                speedFormatted: '0 MB/s',
                elapsedSec: 0,
                status: 'error',
                errorMessage: err.message || 'Download failed',
              }
        );
      }
    }
  };

  const handleCancelHFDownload = () => {
    if (hfAbortControllerRef.current) {
      hfAbortControllerRef.current.abort();
      setHfDownloadProgress(null);
    }
  };

  // ------------------ Ollama Handlers ------------------

  const handleSelectOllamaModel = (item: OllamaCatalogItem) => {
    setSelectedOllamaModel(item);
    setSelectedTag(item.recommendedTag);
    setOllamaPullMessage(null);
    setOllamaPullProgress(null);
  };

  const handlePullOllama = async (modelTagToPull?: string) => {
    const fullModelName = modelTagToPull || `${selectedOllamaModel.name}:${selectedTag}`;
    setIsPullingOllama(true);
    setOllamaPullMessage(null);
    ollamaAbortControllerRef.current = new AbortController();

    try {
      const result = await pullOllamaModel({
        modelName: fullModelName,
        proxyUrl: proxyStatus.proxyUrl,
        ollamaUrl: proxyStatus.ollamaUrl,
        onProgress: (p) => setOllamaPullProgress(p),
        signal: ollamaAbortControllerRef.current.signal,
      });

      if (result.success) {
        setOllamaPullMessage(`✅ Successfully pulled '${fullModelName}' into your Ollama instance.`);
        const storedModel: StoredModel = {
          id: `ollama:${fullModelName}`,
          provider: 'ollama',
          name: fullModelName,
          fileName: fullModelName,
          size: 0,
          downloadedAt: Date.now(),
          hasBlob: false,
          status: 'proxy-managed',
        };
        await saveModelToStorage(storedModel);
        loadStoredModels();
      } else {
        setOllamaPullMessage(
          `⚠️ Auto-pull couldn't reach local Ollama directly (CORS or server offline). Run this command manually in your terminal:\n\nollama run ${fullModelName}`
        );
      }
    } catch (err: any) {
      setOllamaPullMessage(
        `⚠️ Pull failed: ${err.message}. To run manually, use:\n\nollama run ${fullModelName}`
      );
    } finally {
      setIsPullingOllama(false);
    }
  };

  const handleExportBlob = async (model: StoredModel) => {
    const blob = await getModelBlob(model.id);
    if (!blob) {
      alert('Model weight blob is not in local cache or was forwarded to proxy.');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = model.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteModel = async (id: string) => {
    if (confirm('Remove this model from your local library?')) {
      await deleteStoredModel(id);
      loadStoredModels();
      refreshStorageInfo();
      if (selectedLibraryModel?.id === id) {
        setSelectedLibraryModel(null);
      }
    }
  };

  return (
    <ViewContainer title="Model Hub: Pull from Hugging Face & Ollama">
      {/* 0. Active Chat Model & Quick Jump to Chatbox */}
      <div className="mb-6 bg-slate-900 border-2 border-cyan-500/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-extrabold flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            Active Chat Model:
          </span>
          <ModelSelectorDropdown direction="down" />
        </div>
        <button
          type="button"
          onClick={() => setActiveView(ActiveView.CHAT)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow transition"
        >
          <span>💬</span>
          <span>Open Chatbox →</span>
        </button>
      </div>

      {/* 1. Mandatory Runtime Execution Disclaimer */}
      <div className="mb-6 bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 text-amber-300 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl mt-0.5">⚠️</div>
          <div>
            <h4 className="font-bold text-amber-200 uppercase tracking-wider text-xs mb-1">
              Browser Runtime Execution Notice
            </h4>
            <p className="text-sm text-amber-300/90 leading-relaxed">
              Web browsers cannot natively execute raw GGUF weights. These models require a native backend runtime
              such as <strong>Ollama</strong> or <strong>llama.cpp</strong> with hardware acceleration.
              Files pulled here are downloaded directly into your browser's IndexedDB library (or forwarded to your
              local proxy at <code>http://localhost:3901</code>) so you can register and run them natively on your device.
            </p>
          </div>
        </div>
      </div>

      {/* 2. System Connectivity Bar (Proxy, Ollama, Storage) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* Local Proxy Status */}
        <div className="bg-slate-900/60 border border-slate-700/80 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                proxyStatus.proxyReachable ? 'bg-emerald-400 shadow-glow-green animate-pulse' : 'bg-rose-400'
              }`}
            />
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">Local Proxy (:3901)</div>
              <div className="text-sm font-semibold text-white">
                {proxyStatus.proxyReachable ? 'Proxy Connected' : 'No Proxy Found'}
              </div>
            </div>
          </div>
          <button
            onClick={refreshConnectivity}
            disabled={isCheckingProxy}
            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition"
          >
            {isCheckingProxy ? 'Probing...' : 'Recheck'}
          </button>
        </div>

        {/* Ollama Native Status */}
        <div className="bg-slate-900/60 border border-slate-700/80 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                proxyStatus.ollamaReachable ? 'bg-emerald-400 shadow-glow-green' : 'bg-slate-500'
              }`}
            />
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">Ollama API (:11434)</div>
              <div className="text-sm font-semibold text-white">
                {proxyStatus.ollamaReachable
                  ? `${proxyStatus.localModels.length} Local Models`
                  : 'Ollama Offline / Standby'}
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {proxyStatus.proxyReachable ? 'Auto-Create Ready' : 'IndexedDB Mode'}
          </span>
        </div>

        {/* Storage Quota */}
        <div className="bg-slate-900/60 border border-slate-700/80 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">IndexedDB Model Storage</div>
            <div className="text-xs text-cyan-300 font-medium truncate max-w-[220px]">
              {storageQuota.formatted}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('library')}
            className="text-xs px-2.5 py-1 bg-cyan-900/50 hover:bg-cyan-800/60 text-cyan-300 rounded border border-cyan-700/50 transition"
          >
            {storedModels.length} Stored
          </button>
        </div>
      </div>

      {/* 3. Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('huggingface')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'huggingface'
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-glow-cyan'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span className="text-lg">🤗</span>
          <span>Hugging Face (GGUF)</span>
        </button>

        <button
          onClick={() => setActiveTab('ollama')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ollama'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span className="text-lg">🦙</span>
          <span>Ollama Library & Pull</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'library'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span className="text-lg">💾</span>
          <span>Local Model Registry ({storedModels.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: HUGGING FACE GGUF SEARCH & PULL                   */}
      {/* ======================================================== */}
      {activeTab === 'huggingface' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-4">
            <form onSubmit={handleSearchHF} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={hfSearchQuery}
                  onChange={(e) => setHfSearchQuery(e.target.value)}
                  placeholder="Search Hugging Face GGUF repos (e.g., bartowski/Llama-3.2-3B, mistral-7b, deepseek-r1)..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-sans text-sm"
                />
                <span className="absolute left-3.5 top-3 text-slate-500 text-sm">🔍</span>
              </div>
              <button
                type="submit"
                disabled={isSearchingHF}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm rounded-lg shadow-md transition disabled:opacity-50"
              >
                {isSearchingHF ? 'Searching...' : 'Search HF'}
              </button>
            </form>

            {/* Quick suggested chips */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 flex-wrap text-xs text-slate-400">
              <span className="font-mono text-slate-500">Popular:</span>
              {['bartowski/Llama-3.2-3B', 'deepseek-r1', 'mistral-7b', 'qwen2.5-coder', 'phi-4', 'gemma-2'].map(
                (q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setHfSearchQuery(q);
                      searchHFModels(q).then((res) => setHfSearchResults(res));
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300/80 border border-slate-700/60 transition"
                  >
                    {q}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Active Download Progress Card */}
          {hfDownloadProgress && currentHfPullFile && (
            <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-xl p-5 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs uppercase font-mono tracking-wider text-cyan-400 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    In-Browser Streaming Download (ReadableStream)
                  </div>
                  <h4 className="text-lg font-bold text-white mt-1 break-all">{currentHfPullFile.fileName}</h4>
                  <p className="text-xs text-slate-400">Target Quant: {currentHfPullFile.quant}</p>
                </div>
                <button
                  onClick={handleCancelHFDownload}
                  className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs rounded border border-red-700"
                >
                  Cancel
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800 mb-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, hfDownloadProgress.percent)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-300 font-mono">
                <span>
                  {formatBytes(hfDownloadProgress.receivedBytes)} /{' '}
                  {formatBytes(hfDownloadProgress.totalBytes || currentHfPullFile.size)} ({hfDownloadProgress.percent}%)
                </span>
                <span>Speed: {hfDownloadProgress.speedFormatted}</span>
                <span>Elapsed: {hfDownloadProgress.elapsedSec}s</span>
              </div>

              {hfDownloadProgress.status === 'assembling' && (
                <div className="mt-3 text-xs text-yellow-300 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Assembling GGUF binary chunks and caching to IndexedDB...</span>
                </div>
              )}

              {hfDownloadProgress.errorMessage && (
                <div className="mt-3 p-2 bg-red-950/80 border border-red-800 text-red-300 rounded text-xs">
                  {hfDownloadProgress.errorMessage}
                </div>
              )}
            </div>
          )}

          {/* Proxy Auto-create Logs */}
          {proxyLog.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-bold text-cyan-400">⚡ Local Proxy Execution Log</span>
                <span className="text-[10px] text-slate-500">http://localhost:3901</span>
              </div>
              <div className="space-y-1 text-slate-300 max-h-40 overflow-y-auto">
                {proxyLog.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post-pull Success Instructions & Modelfile Generator */}
          {completedPullModel && (
            <div className="bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/50 rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  <h4 className="text-base font-bold text-emerald-300">
                    Model Ready:{' '}
                    <span className="font-mono text-white">{completedPullModel.name}</span>
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => useModelInChat(completedPullModel.name, 'huggingface')}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold shadow flex items-center gap-1.5 transition"
                  >
                    <span>💬</span> Use in Chat
                  </button>
                  {completedPullModel.hasBlob && (
                    <button
                      onClick={() => handleExportBlob(completedPullModel)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium shadow flex items-center gap-1.5"
                    >
                      <span>💾</span> Export .gguf to Disk
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-3">
                Since web browsers cannot run GGUF weights directly, copy the generated Modelfile or terminal command
                below to load this model into your local Ollama:
              </p>

              {/* Terminal Command Snippet */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                  <span>Run in your Terminal:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `ollama create ${completedPullModel.name} -f Modelfile && ollama run ${completedPullModel.name}`,
                        'cmd'
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 text-xs"
                  >
                    {copiedKey === 'cmd' ? 'Copied!' : 'Copy Command'}
                  </button>
                </div>
                <code className="text-xs text-cyan-300 font-mono block select-all">
                  ollama create {completedPullModel.name} -f Modelfile && ollama run {completedPullModel.name}
                </code>
              </div>

              {/* Modelfile preview */}
              {completedPullModel.modelfile && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Generated Modelfile:</span>
                    <button
                      onClick={() => copyToClipboard(completedPullModel.modelfile || '', 'mf')}
                      className="text-cyan-400 hover:text-cyan-300 text-xs"
                    >
                      {copiedKey === 'mf' ? 'Copied!' : 'Copy Modelfile'}
                    </button>
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {completedPullModel.modelfile}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Repo Files / Quants Inspector Modal or Section */}
          {selectedRepo && (
            <div className="bg-slate-900 border border-amber-500/50 rounded-xl p-5 shadow-2xl">
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-700/50 font-mono">
                      GGUF Repository
                    </span>
                    <h3 className="text-xl font-bold text-white font-mono">{selectedRepo.id}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Found {selectedRepo.ggufFiles.length} GGUF quantized variants. Choose a quant below to pull.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="text-slate-400 hover:text-white text-sm px-2.5 py-1 bg-slate-800 rounded hover:bg-slate-700"
                >
                  ✕ Close Repo
                </button>
              </div>

              {selectedRepo.ggufFiles.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No <code>.gguf</code> files detected in this repository branch.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {selectedRepo.ggufFiles.map((file) => (
                    <div
                      key={file.fileName}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-cyan-300 font-semibold truncate">
                            {file.fileName}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              file.recommendation === 'balanced'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : file.recommendation === 'quality'
                                ? 'bg-purple-950 text-purple-300 border border-purple-700'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {file.badgeLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Quant: <strong className="text-slate-200">{file.quant}</strong></span>
                          <span>•</span>
                          <span>Size: <strong className="text-slate-200">{file.formattedSize}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                        <button
                          onClick={() => useModelInChat(file.fileName, 'huggingface')}
                          className="w-full sm:w-auto px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-lg text-xs font-semibold border border-cyan-500/40 transition flex items-center justify-center gap-1.5"
                          title="Set this model as active in the Chatbox"
                        >
                          <span>💬</span>
                          <span>Use in Chat</span>
                        </button>

                        <button
                          onClick={() => handlePullHFFile(file)}
                          disabled={
                            isPullingToProxy ||
                            (hfDownloadProgress !== null && hfDownloadProgress.status === 'downloading')
                          }
                          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition flex items-center justify-center gap-2 ${
                            proxyStatus.proxyReachable
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                          } disabled:opacity-50`}
                        >
                          {proxyStatus.proxyReachable ? (
                            <>
                              <span>⚡</span> Pull via Proxy (Auto-Create)
                            </>
                          ) : (
                            <>
                              <span>📥</span> Pull In-Browser (Save to IDB)
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Repo Error Notice */}
          {repoError && (
            <div className="p-3 bg-red-950/70 border border-red-800 text-red-300 text-xs rounded-lg">
              {repoError}
            </div>
          )}

          {/* Repository Results Grid */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-white">
                {hfSearchQuery ? `Search Results for "${hfSearchQuery}"` : 'Recommended GGUF Repositories'}
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {hfSearchResults.length} repositories listed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hfSearchResults.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-slate-900/60 border border-slate-700/80 hover:border-amber-500/60 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-sm hover:shadow-lg"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold text-white group-hover:text-amber-300 transition text-sm break-all font-mono">
                        {repo.id}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {repo.description || 'GGUF model repository ready for quantization download.'}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <span>⬇️</span> {repo.downloads ? repo.downloads.toLocaleString() : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>❤️</span> {repo.likes ? repo.likes.toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {repo.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRepo(repo.id)}
                    disabled={isLoadingRepo}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-amber-600/80 hover:text-white text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 group-hover:border-amber-500/50 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Inspect GGUF Quants</span>
                    <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: OLLAMA SEARCH & AUTO-PULL                         */}
      {/* ======================================================== */}
      {activeTab === 'ollama' && (
        <div className="space-y-6">
          {/* Ollama Pull Progress Panel */}
          {ollamaPullProgress && (
            <div className="bg-slate-900 border-2 border-cyan-500/80 rounded-xl p-5 shadow-2xl">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs uppercase font-mono tracking-wider text-cyan-400 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Ollama Auto-Pull Stream
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {selectedOllamaModel.name}:{selectedTag}
                  </h4>
                  <p className="text-xs text-slate-400">{ollamaPullProgress.status}</p>
                </div>
                {isPullingOllama && (
                  <button
                    onClick={() => {
                      if (ollamaAbortControllerRef.current) {
                        ollamaAbortControllerRef.current.abort();
                        setIsPullingOllama(false);
                      }
                    }}
                    className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs rounded border border-red-700"
                  >
                    Abort
                  </button>
                )}
              </div>

              {ollamaPullProgress.percent !== undefined && (
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800 mt-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${ollamaPullProgress.percent}%` }}
                  />
                </div>
              )}

              {ollamaPullProgress.total && ollamaPullProgress.completed ? (
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>
                    {formatBytes(ollamaPullProgress.completed)} / {formatBytes(ollamaPullProgress.total)} (
                    {ollamaPullProgress.percent}%)
                  </span>
                  <span>Digest: {ollamaPullProgress.digest?.slice(0, 14)}...</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Ollama Message / Terminal Instructions */}
          {ollamaPullMessage && (
            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-4 text-xs font-mono">
              <div className="flex justify-between items-center mb-2">
                <span className="text-cyan-300 font-bold">Ollama Pull Status</span>
                <button
                  onClick={() =>
                    copyToClipboard(`ollama run ${selectedOllamaModel.name}:${selectedTag}`, 'ol-cmd')
                  }
                  className="text-xs text-cyan-400 hover:underline"
                >
                  {copiedKey === 'ol-cmd' ? 'Copied!' : 'Copy ollama run'}
                </button>
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">{ollamaPullMessage}</pre>
            </div>
          )}

          {/* Ollama Search & Category Filter */}
          <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={ollamaSearchQuery}
                  onChange={(e) => setOllamaSearchQuery(e.target.value)}
                  placeholder="Search Ollama library (e.g., llama3.2, deepseek-r1, qwen, mistral)..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans text-sm"
                />
                <span className="absolute left-3.5 top-3 text-slate-500 text-sm">🔍</span>
              </div>

              {/* Direct Custom Tag Pull */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customOllamaTag}
                  onChange={(e) => setCustomOllamaTag(e.target.value)}
                  placeholder="custom/model:tag"
                  className="w-48 bg-slate-950/80 border border-slate-700 rounded-lg py-2.5 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
                />
                <button
                  onClick={() => {
                    if (customOllamaTag.trim()) {
                      handlePullOllama(customOllamaTag.trim());
                    }
                  }}
                  disabled={isPullingOllama || !customOllamaTag.trim()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  Pull Tag
                </button>
              </div>
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-mono">Category:</span>
              {[
                { id: 'all', label: 'All Models' },
                { id: 'reasoning', label: '🧠 Reasoning (DeepSeek/Phi)' },
                { id: 'general', label: '💬 General (Llama/Mistral)' },
                { id: 'code', label: '💻 Coding (Qwen 2.5 Coder)' },
                { id: 'vision', label: '👁️ Vision (LLaVA)' },
                { id: 'embedding', label: '🔢 Embeddings (Nomic)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setOllamaCategory(cat.id)}
                  className={`px-3 py-1 rounded-md transition ${
                    ollamaCategory === cat.id
                      ? 'bg-cyan-600 text-white font-medium shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection & Tag Details Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Catalog List (Left 2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Ollama Official Library Catalog
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchOllamaCatalog(ollamaSearchQuery, ollamaCategory).map((item) => (
                  <div
                    key={item.name}
                    onClick={() => handleSelectOllamaModel(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedOllamaModel.name === item.name
                        ? 'bg-slate-800/90 border-cyan-500 shadow-glow-cyan'
                        : 'bg-slate-900/50 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="font-bold text-white text-base">{item.displayName}</h4>
                        <span className="text-[11px] font-mono text-cyan-400">{item.name}</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                        {item.pulls} pulls
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 mb-3">{item.description}</p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.tags.map((t) => (
                        <span
                          key={t.tag}
                          className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-slate-300 rounded border border-slate-800"
                        >
                          {t.tag} ({t.size})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Model Tag Inspector & Auto-Pull Action (Right col) */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 space-y-4 h-fit sticky top-24">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
                  Model Selected
                </span>
                <h3 className="text-2xl font-bold text-white mt-0.5">{selectedOllamaModel.displayName}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedOllamaModel.description}</p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Select Quant / Parameter Tag:
                </label>
                <div className="space-y-2">
                  {selectedOllamaModel.tags.map((t) => (
                    <button
                      key={t.tag}
                      onClick={() => setSelectedTag(t.tag)}
                      className={`w-full p-2.5 rounded-lg border text-left flex justify-between items-center transition ${
                        selectedTag === t.tag
                          ? 'bg-cyan-950/70 border-cyan-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-mono text-xs font-semibold">{t.tag}</div>
                      <div className="text-xs text-slate-400 font-mono">{t.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => useModelInChat(`${selectedOllamaModel.name}:${selectedTag}`, 'ollama')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  <span>Use in Chat ({selectedOllamaModel.name}:{selectedTag})</span>
                </button>

                <button
                  onClick={() => handlePullOllama()}
                  disabled={isPullingOllama}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold text-xs shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>🦙</span>
                  <span>{isPullingOllama ? 'Pulling Model...' : `Auto-Pull ${selectedOllamaModel.name}:${selectedTag}`}</span>
                </button>

                <button
                  onClick={() =>
                    copyToClipboard(
                      `ollama run ${selectedOllamaModel.name}:${selectedTag}`,
                      'quick-cmd'
                    )
                  }
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono border border-slate-700 transition"
                >
                  {copiedKey === 'quick-cmd' ? 'Copied Command!' : `Copy: ollama run ${selectedOllamaModel.name}:${selectedTag}`}
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300 block mb-1">Ollama CORS Configuration:</strong>
                If running Ollama locally and the browser cannot connect directly, launch Ollama with CORS permissions:
                <code className="text-cyan-400 block mt-1 select-all font-mono">
                  OLLAMA_ORIGINS="*" ollama serve
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: STORED MODEL LIBRARY & INDEXEDDB                  */}
      {/* ======================================================== */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900/60 border border-slate-700/80 rounded-xl p-4">
            <div>
              <h3 className="text-base font-bold text-white">Browser Model Library (IndexedDB Cache)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved GGUF files and pulled model configurations stored on this device.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-cyan-400">{storageQuota.formatted}</span>
              <button
                onClick={loadStoredModels}
                disabled={isLoadingLibrary}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700"
              >
                Refresh
              </button>
            </div>
          </div>

          {storedModels.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-xl">
              <div className="text-4xl mb-3">📦</div>
              <h4 className="text-base font-semibold text-white">No Models in Local Library</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Pull a GGUF model from Hugging Face or Ollama using the tabs above. Models downloaded in-browser are cached here.
              </p>
              <button
                onClick={() => setActiveTab('huggingface')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow"
              >
                Search Hugging Face GGUFs
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {storedModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:border-slate-600"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">
                        {model.provider === 'huggingface' ? '🤗' : '🦙'}
                      </span>
                      <span className="font-mono text-sm font-bold text-white truncate">{model.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-mono">
                        {model.provider}
                      </span>
                      {model.hasBlob && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                          GGUF Binary Cached
                        </span>
                      )}
                      {model.status === 'proxy-managed' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                          Managed by Local Proxy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                      <span>File: {model.fileName}</span>
                      {model.size > 0 && <span>• Size: {formatBytes(model.size)}</span>}
                      <span>• Added: {new Date(model.downloadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    <button
                      onClick={() => useModelInChat(model.name, model.provider)}
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition"
                      title="Set this model as active in the Chatbox"
                    >
                      <span>💬</span> Use in Chat
                    </button>

                    {model.hasBlob && (
                      <button
                        onClick={() => handleExportBlob(model)}
                        className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs rounded font-medium flex items-center gap-1 shadow"
                      >
                        <span>💾</span> Export .gguf
                      </button>
                    )}

                    {model.modelfile && (
                      <button
                        onClick={() => setSelectedLibraryModel(model)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700"
                      >
                        View Modelfile
                      </button>
                    )}

                    <button
                      onClick={() =>
                        copyToClipboard(`ollama run ${model.name}`, `lib-${model.id}`)
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700 font-mono"
                    >
                      {copiedKey === `lib-${model.id}` ? 'Copied!' : 'Copy ollama run'}
                    </button>

                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs rounded border border-red-800"
                      title="Delete from local cache"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modelfile Inspector Modal */}
          {selectedLibraryModel && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-base">
                    Modelfile for {selectedLibraryModel.name}
                  </h4>
                  <button
                    onClick={() => setSelectedLibraryModel(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {selectedLibraryModel.modelfile}
                </pre>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() =>
                      copyToClipboard(selectedLibraryModel.modelfile || '', 'modal-mf')
                    }
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                  >
                    {copiedKey === 'modal-mf' ? 'Copied!' : 'Copy Modelfile'}
                  </button>
                  <button
                    onClick={() => setSelectedLibraryModel(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ViewContainer>
  );
};
