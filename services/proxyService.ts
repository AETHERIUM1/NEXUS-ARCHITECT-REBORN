// Service to detect and interact with local proxy (http://localhost:3901) and Ollama (http://localhost:11434)

export interface ProxyStatus {
  proxyReachable: boolean;
  proxyUrl: string;
  ollamaReachable: boolean;
  ollamaUrl: string;
  localModels: string[];
  lastChecked: number;
}

export interface OllamaProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
  percent?: number;
  error?: string;
}

export const DEFAULT_PROXY_URL = 'http://localhost:3901';
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

export async function checkConnectivity(
  proxyUrl = DEFAULT_PROXY_URL,
  ollamaUrl = DEFAULT_OLLAMA_URL
): Promise<ProxyStatus> {
  let proxyReachable = false;
  let ollamaReachable = false;
  let localModels: string[] = [];

  // 1. Check local proxy at port 3901
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(`${proxyUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).catch(async () => {
      // Fallback probe to root
      return await fetch(`${proxyUrl}/`, {
        method: 'GET',
        signal: controller.signal,
      });
    });

    clearTimeout(timeoutId);
    if (res && (res.ok || res.status === 200 || res.status === 204 || res.type === 'opaque')) {
      proxyReachable = true;
    }
  } catch {
    proxyReachable = false;
  }

  // 2. Check local Ollama at port 11434
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (res && res.ok) {
      ollamaReachable = true;
      const data = await res.json();
      if (data && Array.isArray(data.models)) {
        localModels = data.models.map((m: any) => m.name || m.model);
      }
    }
  } catch {
    ollamaReachable = false;
  }

  return {
    proxyReachable,
    proxyUrl,
    ollamaReachable,
    ollamaUrl,
    localModels,
    lastChecked: Date.now(),
  };
}

export async function sendPullToProxy(params: {
  repoId: string;
  file: string;
  modelName: string;
  proxyUrl?: string;
  onLog?: (msg: string) => void;
}): Promise<{ success: boolean; message: string }> {
  const url = params.proxyUrl || DEFAULT_PROXY_URL;
  const modelfileContent = `FROM ./${params.file}\nPARAMETER temperature 0.7\n`;

  try {
    params.onLog?.(`Connecting to local proxy at ${url}...`);

    const res = await fetch(`${url}/api/pull-hf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoId: params.repoId,
        file: params.file,
        modelName: params.modelName,
        modelfile: modelfileContent,
      }),
    }).catch(async () => {
      // Fallback generic pull endpoint
      return await fetch(`${url}/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: params.repoId,
          file: params.file,
          modelName: params.modelName,
        }),
      });
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Proxy responded with status ${res.status}: ${errText || res.statusText}`);
    }

    const data = await res.json().catch(() => ({ status: 'dispatched' }));
    params.onLog?.(`Proxy accepted download job. Auto-executing 'ollama create ${params.modelName} -f Modelfile'...`);

    return {
      success: true,
      message: data.message || `Proxy successfully initiated download and auto-create for ${params.modelName}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to communicate with local proxy',
    };
  }
}

export async function pullOllamaModel(params: {
  modelName: string;
  proxyUrl?: string;
  ollamaUrl?: string;
  onProgress: (p: OllamaProgress) => void;
  signal?: AbortSignal;
}): Promise<{ success: boolean; message: string }> {
  const ollamaUrl = params.ollamaUrl || DEFAULT_OLLAMA_URL;
  const proxyUrl = params.proxyUrl || DEFAULT_PROXY_URL;

  // Try direct Ollama first or fallback to proxy
  let endpoint = `${ollamaUrl}/api/pull`;
  let isProxy = false;

  try {
    params.onProgress({ status: `Initiating pull for ${params.modelName}...` });

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: params.modelName, stream: true }),
        signal: params.signal,
      });
    } catch {
      // Try via proxy
      endpoint = `${proxyUrl}/api/ollama/pull`;
      isProxy = true;
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: params.modelName, stream: true }),
        signal: params.signal,
      });
    }

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }

    if (!res.body) {
      return { success: true, message: `Model ${params.modelName} pull requested.` };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const percent =
            parsed.total && parsed.completed ? Math.round((parsed.completed / parsed.total) * 100) : undefined;

          params.onProgress({
            status: parsed.status || 'pulling',
            digest: parsed.digest,
            total: parsed.total,
            completed: parsed.completed,
            percent,
            error: parsed.error,
          });

          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch {
          // Non-JSON line or partial
        }
      }
    }

    params.onProgress({ status: `Successfully pulled ${params.modelName}!`, percent: 100 });
    return { success: true, message: `Successfully pulled ${params.modelName}` };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Pull cancelled by user' };
    }
    return {
      success: false,
      message: err.message || `Could not connect to Ollama (${endpoint}). Ensure Ollama is running with OLLAMA_ORIGINS="*"`,
    };
  }
}
