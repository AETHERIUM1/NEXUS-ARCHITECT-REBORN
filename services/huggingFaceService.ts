// Hugging Face API Service for GGUF repos, quants inspection, and streaming in-browser pull

export interface HFModelSummary {
  id: string; // e.g. "bartowski/Llama-3.2-3B-Instruct-GGUF"
  author?: string;
  downloads: number;
  likes: number;
  lastModified?: string;
  tags: string[];
  description?: string;
}

export interface GGUFFileInfo {
  fileName: string;
  size: number; // in bytes (0 if unknown)
  formattedSize: string;
  quant: string;
  recommendation: 'balanced' | 'fast' | 'quality' | 'compact' | 'standard';
  badgeLabel: string;
  downloadUrl: string;
}

export interface HFRepoDetails {
  id: string;
  author?: string;
  downloads: number;
  likes: number;
  lastModified?: string;
  ggufFiles: GGUFFileInfo[];
}

export interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number;
  percent: number;
  speedBytesPerSec: number;
  speedFormatted: string;
  elapsedSec: number;
  status: 'connecting' | 'downloading' | 'assembling' | 'saving' | 'complete' | 'error';
  errorMessage?: string;
}

export const POPULAR_GGUF_REPOS: HFModelSummary[] = [
  {
    id: 'bartowski/Llama-3.2-3B-Instruct-GGUF',
    author: 'bartowski',
    downloads: 145000,
    likes: 620,
    tags: ['gguf', 'llama-3.2', 'meta', 'text-generation'],
    description: 'Meta Llama 3.2 3B Instruct quantized to GGUF format for local execution.',
  },
  {
    id: 'bartowski/DeepSeek-R1-Distill-Qwen-7B-GGUF',
    author: 'bartowski',
    downloads: 320000,
    likes: 1250,
    tags: ['gguf', 'deepseek', 'reasoning', 'qwen'],
    description: 'DeepSeek-R1 reasoning distillation in compact GGUF quantization.',
  },
  {
    id: 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
    author: 'TheBloke',
    downloads: 580000,
    likes: 2410,
    tags: ['gguf', 'mistral', 'instruct', 'text-generation'],
    description: 'The industry-standard Mistral 7B Instruct v0.2 quantized in all GGUF variants.',
  },
  {
    id: 'Qwen/Qwen2.5-Coder-7B-Instruct-GGUF',
    author: 'Qwen',
    downloads: 210000,
    likes: 890,
    tags: ['gguf', 'qwen2.5', 'coder', 'programming'],
    description: 'Qwen 2.5 Coder 7B Instruct specialized for code synthesis and debugging.',
  },
  {
    id: 'unsloth/Phi-4-GGUF',
    author: 'unsloth',
    downloads: 95000,
    likes: 540,
    tags: ['gguf', 'microsoft', 'phi-4', 'reasoning'],
    description: 'Microsoft Phi-4 14B state-of-the-art synthetic reasoning model.',
  },
  {
    id: 'bartowski/gemma-2-9b-it-GGUF',
    author: 'bartowski',
    downloads: 110000,
    likes: 480,
    tags: ['gguf', 'google', 'gemma-2', 'instruction'],
    description: 'Google Gemma 2 9B Instruction model with high benchmark performance.',
  },
];

// Helper to format bytes
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Helper to determine quant type and recommendation
export function analyzeGGUFQuant(fileName: string): {
  quant: string;
  recommendation: 'balanced' | 'fast' | 'quality' | 'compact' | 'standard';
  badgeLabel: string;
} {
  const upper = fileName.toUpperCase();

  if (upper.includes('Q4_K_M')) {
    return { quant: 'Q4_K_M', recommendation: 'balanced', badgeLabel: 'Recommended (Balanced)' };
  }
  if (upper.includes('Q5_K_M')) {
    return { quant: 'Q5_K_M', recommendation: 'quality', badgeLabel: 'High Quality' };
  }
  if (upper.includes('Q8_0')) {
    return { quant: 'Q8_0', recommendation: 'quality', badgeLabel: 'Near-Lossless (High RAM)' };
  }
  if (upper.includes('Q4_K_S') || upper.includes('Q4_0')) {
    return { quant: 'Q4_0', recommendation: 'fast', badgeLabel: 'Fast & Lightweight' };
  }
  if (upper.includes('Q3_K_M') || upper.includes('Q3_K_S') || upper.includes('Q2_K')) {
    return { quant: 'Q3_K', recommendation: 'compact', badgeLabel: 'Ultra-Compact (Low RAM)' };
  }
  if (upper.includes('Q6_K')) {
    return { quant: 'Q6_K', recommendation: 'quality', badgeLabel: 'Very High Quality' };
  }
  if (upper.includes('F16') || upper.includes('BF16')) {
    return { quant: 'FP16', recommendation: 'quality', badgeLabel: 'Full Precision' };
  }

  // Fallback regex match for Q[0-9]
  const match = upper.match(/Q[0-9]_[A-Z0-9_]+/);
  if (match) {
    return { quant: match[0], recommendation: 'standard', badgeLabel: match[0] };
  }

  return { quant: 'GGUF', recommendation: 'standard', badgeLabel: 'Standard' };
}

// 1. Search Hugging Face API for GGUF repos
export async function searchHFModels(query: string): Promise<HFModelSummary[]> {
  const trimmed = query.trim();
  const url = trimmed
    ? `https://huggingface.co/api/models?search=${encodeURIComponent(trimmed)}&filter=gguf&limit=24&full=true`
    : `https://huggingface.co/api/models?filter=gguf&sort=downloads&direction=-1&limit=24&full=true`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`HF API error: ${res.statusText}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) return POPULAR_GGUF_REPOS;

    return data.map((item: any) => ({
      id: item.id || item.modelId,
      author: item.author || (item.id ? item.id.split('/')[0] : 'Community'),
      downloads: item.downloads || 0,
      likes: item.likes || 0,
      lastModified: item.lastModified,
      tags: Array.isArray(item.tags) ? item.tags : ['gguf'],
      description: item.description || (item.tags ? `Tags: ${item.tags.slice(0, 4).join(', ')}` : ''),
    }));
  } catch (err) {
    console.warn('Failed to search HF API live, falling back to curated list:', err);
    if (!trimmed) return POPULAR_GGUF_REPOS;
    return POPULAR_GGUF_REPOS.filter((m) =>
      m.id.toLowerCase().includes(trimmed.toLowerCase()) ||
      m.description?.toLowerCase().includes(trimmed.toLowerCase())
    );
  }
}

// 2. Fetch repo details and extract .gguf files
export async function fetchHFRepoDetails(repoId: string): Promise<HFRepoDetails> {
  const url = `https://huggingface.co/api/models/${encodeURIComponent(repoId)}?blobs=true`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Failed to load repository details for ${repoId} (HTTP ${res.status})`);
  }

  const data = await res.json();
  const siblings = Array.isArray(data.siblings) ? data.siblings : [];

  const ggufFiles: GGUFFileInfo[] = siblings
    .filter((f: any) => f.rfilename && f.rfilename.toLowerCase().endsWith('.gguf'))
    .map((f: any) => {
      const fileName = f.rfilename;
      const size = f.size || (f.lfs && f.lfs.size) || 0;
      const quantAnalysis = analyzeGGUFQuant(fileName);
      const downloadUrl = `https://huggingface.co/${repoId}/resolve/main/${fileName}`;

      return {
        fileName,
        size,
        formattedSize: size > 0 ? formatBytes(size) : 'Calculated on pull',
        quant: quantAnalysis.quant,
        recommendation: quantAnalysis.recommendation,
        badgeLabel: quantAnalysis.badgeLabel,
        downloadUrl,
      };
    });

  // Sort files: recommended Q4_K_M first, then by size
  ggufFiles.sort((a, b) => {
    if (a.recommendation === 'balanced') return -1;
    if (b.recommendation === 'balanced') return 1;
    return a.size - b.size;
  });

  return {
    id: data.id || repoId,
    author: data.author || repoId.split('/')[0],
    downloads: data.downloads || 0,
    likes: data.likes || 0,
    lastModified: data.lastModified,
    ggufFiles,
  };
}

// 3. In-browser streaming download from Hugging Face resolve URL
export async function downloadGGUFStreaming(params: {
  repoId: string;
  fileName: string;
  expectedSize?: number;
  onProgress: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
}): Promise<Blob> {
  const downloadUrl = `https://huggingface.co/${params.repoId}/resolve/main/${params.fileName}`;
  const startTime = Date.now();

  params.onProgress({
    receivedBytes: 0,
    totalBytes: params.expectedSize || 0,
    percent: 0,
    speedBytesPerSec: 0,
    speedFormatted: '0 MB/s',
    elapsedSec: 0,
    status: 'connecting',
  });

  const res = await fetch(downloadUrl, {
    method: 'GET',
    signal: params.signal,
  });

  if (!res.ok) {
    throw new Error(`Download failed with HTTP ${res.status}: ${res.statusText}`);
  }

  const contentLengthHeader = res.headers.get('content-length');
  const totalBytes = contentLengthHeader
    ? parseInt(contentLengthHeader, 10)
    : (params.expectedSize || 0);

  if (!res.body) {
    throw new Error('ReadableStream not supported by response body in this browser environment');
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  let lastUpdateTime = Date.now();
  let lastBytes = 0;
  let speedBytesPerSec = 0;

  params.onProgress({
    receivedBytes: 0,
    totalBytes,
    percent: 0,
    speedBytesPerSec: 0,
    speedFormatted: '0 MB/s',
    elapsedSec: 0,
    status: 'downloading',
  });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (value) {
      chunks.push(value);
      receivedBytes += value.length;

      const now = Date.now();
      const timeSinceUpdate = now - lastUpdateTime;

      // Update speed every 350ms
      if (timeSinceUpdate > 350) {
        const bytesDiff = receivedBytes - lastBytes;
        speedBytesPerSec = (bytesDiff / timeSinceUpdate) * 1000;
        lastBytes = receivedBytes;
        lastUpdateTime = now;

        const percent = totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : 0;
        const elapsedSec = Math.round((now - startTime) / 1000);
        const speedFormatted = `${(speedBytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;

        params.onProgress({
          receivedBytes,
          totalBytes,
          percent,
          speedBytesPerSec,
          speedFormatted,
          elapsedSec,
          status: 'downloading',
        });
      }
    }
  }

  params.onProgress({
    receivedBytes,
    totalBytes: receivedBytes,
    percent: 100,
    speedBytesPerSec: 0,
    speedFormatted: 'Done',
    elapsedSec: Math.round((Date.now() - startTime) / 1000),
    status: 'assembling',
  });

  const blob = new Blob(chunks, { type: 'application/octet-stream' });
  return blob;
}

// Generate standard Modelfile content for Ollama
export function generateModelfile(fileName: string, template?: string): string {
  return `# Modelfile for Ollama
FROM ./${fileName}

# Inference parameters
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1

# System prompt template
TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
{{ .Response }}<|im_end|>"""
`;
}
