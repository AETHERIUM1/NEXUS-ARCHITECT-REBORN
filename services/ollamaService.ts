// Ollama Library model definitions and utilities

export interface OllamaModelTag {
  tag: string; // e.g. "3b", "7b", "latest"
  size: string; // e.g. "2.0 GB"
  contextLength?: string; // e.g. "128k"
  quant?: string; // e.g. "Q4_K_M"
}

export interface OllamaCatalogItem {
  name: string; // e.g. "llama3.2"
  displayName: string; // e.g. "Llama 3.2"
  creator: string; // e.g. "Meta"
  description: string;
  category: 'general' | 'reasoning' | 'code' | 'vision' | 'embedding';
  recommendedTag: string;
  tags: OllamaModelTag[];
  pulls: string;
}

export const OLLAMA_CATALOG: OllamaCatalogItem[] = [
  {
    name: 'llama3.2',
    displayName: 'Llama 3.2',
    creator: 'Meta',
    description: 'Meta\'s latest compact powerhouse models optimized for speed, low memory, and edge execution.',
    category: 'general',
    recommendedTag: '3b',
    pulls: '4.8M+',
    tags: [
      { tag: '1b', size: '1.3 GB', contextLength: '128k', quant: 'Q4_K_M' },
      { tag: '3b', size: '2.0 GB', contextLength: '128k', quant: 'Q4_K_M' },
      { tag: 'latest', size: '2.0 GB', contextLength: '128k', quant: 'Q4_K_M' },
      { tag: '3b-instruct-fp16', size: '6.4 GB', contextLength: '128k', quant: 'F16' },
    ],
  },
  {
    name: 'deepseek-r1',
    displayName: 'DeepSeek-R1',
    creator: 'DeepSeek',
    description: 'State-of-the-art open-weights reasoning model using chain-of-thought distillation.',
    category: 'reasoning',
    recommendedTag: '7b',
    pulls: '7.2M+',
    tags: [
      { tag: '1.5b', size: '1.1 GB', contextLength: '128k', quant: 'Q4_K_M' },
      { tag: '7b', size: '4.7 GB', contextLength: '128k', quant: 'Q4_K_M' },
      { tag: '8b', size: '4.9 GB', contextLength: '128k', quant: 'Q4_K_M' },
      { tag: '14b', size: '9.0 GB', contextLength: '128k', quant: 'Q4_K_M' },
      { tag: '32b', size: '20 GB', contextLength: '128k', quant: 'Q4_K_M' },
      { tag: '70b', size: '43 GB', contextLength: '128k', quant: 'Q4_K_M' },
    ],
  },
  {
    name: 'qwen2.5-coder',
    displayName: 'Qwen 2.5 Coder',
    creator: 'Alibaba Cloud',
    description: 'Specialized code synthesizer, debugging assistant, and multi-file architect.',
    category: 'code',
    recommendedTag: '7b',
    pulls: '2.4M+',
    tags: [
      { tag: '1.5b', size: '1.0 GB', contextLength: '32k', quant: 'Q4_K_M' },
      { tag: '7b', size: '4.7 GB', contextLength: '32k', quant: 'Q4_K_M' },
      { tag: '14b', size: '9.0 GB', contextLength: '32k', quant: 'Q4_K_M' },
      { tag: '32b', size: '20 GB', contextLength: '32k', quant: 'Q4_K_M' },
      { tag: 'latest', size: '4.7 GB', contextLength: '32k', quant: 'Q4_K_M' },
    ],
  },
  {
    name: 'mistral',
    displayName: 'Mistral 7B',
    creator: 'Mistral AI',
    description: 'High performance instruction model with exceptional benchmark speed and multilingual fluency.',
    category: 'general',
    recommendedTag: '7b',
    pulls: '5.1M+',
    tags: [
      { tag: '7b', size: '4.1 GB', contextLength: '32k', quant: 'Q4_0' },
      { tag: '7b-instruct-q5_K_M', size: '5.1 GB', contextLength: '32k', quant: 'Q5_K_M' },
      { tag: 'latest', size: '4.1 GB', contextLength: '32k', quant: 'Q4_0' },
    ],
  },
  {
    name: 'phi4',
    displayName: 'Phi-4',
    creator: 'Microsoft',
    description: 'Microsoft\'s breakthrough 14B model achieving math, reasoning, and coding benchmarks of larger models.',
    category: 'reasoning',
    recommendedTag: '14b',
    pulls: '1.2M+',
    tags: [
      { tag: '14b', size: '9.1 GB', contextLength: '16k', quant: 'Q4_K_M' },
      { tag: 'latest', size: '9.1 GB', contextLength: '16k', quant: 'Q4_K_M' },
      { tag: '14b-q8_0', size: '15 GB', contextLength: '16k', quant: 'Q8_0' },
    ],
  },
  {
    name: 'gemma2',
    displayName: 'Gemma 2',
    creator: 'Google',
    description: 'Google\'s lightweight, state-of-the-art open models built from the same research as Gemini.',
    category: 'general',
    recommendedTag: '9b',
    pulls: '2.9M+',
    tags: [
      { tag: '2b', size: '1.6 GB', contextLength: '8k', quant: 'Q4_K_M' },
      { tag: '9b', size: '5.5 GB', contextLength: '8k', quant: 'Q4_K_M' },
      { tag: '27b', size: '16 GB', contextLength: '8k', quant: 'Q4_K_M' },
      { tag: 'latest', size: '5.5 GB', contextLength: '8k', quant: 'Q4_K_M' },
    ],
  },
  {
    name: 'llama3.3',
    displayName: 'Llama 3.3 70B',
    creator: 'Meta',
    description: 'Flagship open intelligence delivering industry-leading performance comparable to top commercial models.',
    category: 'general',
    recommendedTag: '70b',
    pulls: '1.8M+',
    tags: [
      { tag: '70b', size: '43 GB', contextLength: '128k', quant: 'Q4_K_M' },
      { tag: 'latest', size: '43 GB', contextLength: '128k', quant: 'Q4_K_M' },
    ],
  },
  {
    name: 'llava',
    displayName: 'LLaVA (Vision)',
    creator: 'haotian-liu',
    description: 'Multimodal visual instruction model combining vision encoders with language reasoning.',
    category: 'vision',
    recommendedTag: '7b',
    pulls: '1.6M+',
    tags: [
      { tag: '7b', size: '4.7 GB', contextLength: '4k', quant: 'Q4_0' },
      { tag: '13b', size: '8.0 GB', contextLength: '4k', quant: 'Q4_0' },
    ],
  },
  {
    name: 'nomic-embed-text',
    displayName: 'Nomic Embed Text',
    creator: 'Nomic',
    description: 'High-performing text embedding model with 8192 context window.',
    category: 'embedding',
    recommendedTag: 'latest',
    pulls: '3.1M+',
    tags: [
      { tag: 'latest', size: '274 MB', contextLength: '8192', quant: 'Q4_K_M' },
      { tag: 'v1.5', size: '274 MB', contextLength: '8192', quant: 'Q4_K_M' },
    ],
  },
];

export function searchOllamaCatalog(query: string, categoryFilter?: string): OllamaCatalogItem[] {
  const q = query.trim().toLowerCase();

  return OLLAMA_CATALOG.filter((item) => {
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || item.category === categoryFilter;
    if (!matchesCategory) return false;

    if (!q) return true;

    return (
      item.name.toLowerCase().includes(q) ||
      item.displayName.toLowerCase().includes(q) ||
      item.creator.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.tag.toLowerCase().includes(q))
    );
  });
}
