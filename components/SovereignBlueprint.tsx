import React from 'react';
import { ViewContainer } from './ViewContainer';

const BlueprintSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-6">
        <h3 className="text-xl font-semibold text-cyan-400 mb-3 border-l-4 border-cyan-500 pl-4">{title}</h3>
        <div className="pl-5 space-y-3">
            {children}
        </div>
    </div>
);

const BlueprintItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <strong className="font-semibold text-slate-100">{label}:</strong> 
        <p className="text-slate-300 pl-2">{children}</p>
    </div>
);

const BlueprintTable: React.FC<{ headers: string[]; rows: (string | React.ReactNode)[][] }> = ({ headers, rows }) => (
    <div className="my-2 border border-slate-700 rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 bg-slate-900/50 font-bold p-3 text-white">
            {headers.map(h => <div key={h as string}>{h}</div>)}
        </div>
        <div className="divide-y divide-slate-700 text-slate-300">
            {rows.map((row, index) => (
                <div key={index} className="grid grid-cols-3 p-3 items-center">
                    {row.map((cell, cellIndex) => <div key={cellIndex}>{cell}</div>)}
                </div>
            ))}
        </div>
    </div>
);

export const SovereignBlueprint: React.FC = () => {
  return (
    <ViewContainer title="Sovereign Blueprint">
        <p className="text-slate-400 mb-6">A detailed architectural plan for constructing a hyper-capable, fully independent AI assistant using free and open-source software (FOSS). This blueprint ensures complete data privacy and infinite customizability by leveraging self-hostable components.</p>
      
      <BlueprintSection title="1. Core Brain (LLM Layer)">
        <BlueprintItem label="Model">LLaMA 3, Mistral 7B, DeepSeek Coder — locally hosted with Ollama or Text Generation WebUI.</BlueprintItem>
        <BlueprintItem label="Middleware">LangChain or Haystack for orchestration, memory, and tool calling.</BlueprintItem>
        <BlueprintItem label="Vector Database">ChromaDB or Weaviate for long-term memory.</BlueprintItem>
      </BlueprintSection>
  
      <BlueprintSection title="2. Multimodal Processing">
        <BlueprintTable
          headers={['Mode', 'Tool', 'Function']}
          rows={[
            ['Speech-to-Text', 'Vosk / Coqui STT', 'Real-time voice input'],
            ['Text-to-Speech', 'Coqui TTS / OpenTTS', 'Natural voice output'],
            ['Image Recognition', 'OpenCV + Tesseract OCR', 'Object/text extraction'],
            ['Image Generation', 'Stable Diffusion + ControlNet', 'AI images, avatars, edits'],
            ['Video Analysis', 'FFmpeg + OpenCV + PySceneDetect', 'Scene detection, video summaries'],
          ]}
        />
      </BlueprintSection>
      
      <BlueprintSection title="3. Productivity & Automation">
          <BlueprintItem label="Email Automation">Python IMAP/SMTP scripts + Postal or Mailu self-hosted mail server.</BlueprintItem>
          <BlueprintItem label="Calendar Scheduling">Radicale (CalDAV server) + integration with assistant.</BlueprintItem>
          <BlueprintItem label="Task Automation">n8n.io (self-hosted workflow automation).</BlueprintItem>
          <BlueprintItem label="Document Creation">Pandoc, ReportLab, LibreOffice API.</BlueprintItem>
          <BlueprintItem label="Web Scraping & Monitoring">Playwright, Selenium, BeautifulSoup.</BlueprintItem>
      </BlueprintSection>
      
      <BlueprintSection title="4. Knowledge & Research">
          <BlueprintItem label="Local Document Q&A">LangChain + ChromaDB (offline) for PDFs, DOCX, TXT.</BlueprintItem>
          <BlueprintItem label="Web Search Aggregation">SearXNG self-hosted meta-search engine.</BlueprintItem>
          <BlueprintItem label="Research Tools">arXiv API, Semantic Scholar API for academic papers.</BlueprintItem>
          <BlueprintItem label="Fact Verification">Wikipedia/Wikidata API.</BlueprintItem>
      </BlueprintSection>
      
       <BlueprintSection title="5. Creativity Suite">
          <BlueprintItem label="AI Copywriting">Open LLM fine-tuned with LoRA for marketing tone.</BlueprintItem>
          <BlueprintItem label="Music AI">Magenta / Riffusion for generative audio.</BlueprintItem>
          <BlueprintItem label="Meme Maker">Pillow (Python image processing) + AI captions.</BlueprintItem>
          <BlueprintItem label="Video Avatar">Wav2Lip + SadTalker for talking heads.</BlueprintItem>
      </BlueprintSection>
  
      <BlueprintSection title="6. Collaboration & Communication">
          <BlueprintItem label="Chat Integration">Matrix or Rocket.Chat API for real-time messaging.</BlueprintItem>
          <BlueprintItem label="Video Calls">Jitsi Meet or BigBlueButton self-hosted.</BlueprintItem>
          <BlueprintItem label="Collaborative Docs">Etherpad or CryptPad integration.</BlueprintItem>
          <BlueprintItem label="AI Note-Taking">Whisper + summarization pipeline.</BlueprintItem>
      </BlueprintSection>
  
      <BlueprintSection title="7. Privacy & Security">
          <BlueprintItem label="Local Processing">Run LLMs and STT/TTS on-device with Ollama.</BlueprintItem>
          <BlueprintItem label="E2E Encrypted Storage">Cryptomator or VeraCrypt volumes.</BlueprintItem>
          <BlueprintItem label="Password Manager">Self-hosted Bitwarden Vaultwarden.</BlueprintItem>
          <BlueprintItem label="Biometric Auth">OpenCV facial recognition or voiceprint verification.</BlueprintItem>
      </BlueprintSection>
  
      <BlueprintSection title="8. Data & Analytics">
          <BlueprintItem label="User Analytics">Matomo (self-hosted Google Analytics alternative).</BlueprintItem>
          <BlueprintItem label="Performance Monitoring">Grafana + Prometheus dashboards.</BlueprintItem>
          <BlueprintItem label="Interaction Tracking">Heatmap.js for UI usage tracking.</BlueprintItem>
      </BlueprintSection>
  
      <BlueprintSection title="9. Extensibility">
          <BlueprintItem label="Plugin System">Python entry points or Node.js plugin architecture.</BlueprintItem>
          <BlueprintItem label="Custom UI">TailwindCSS + ShadCN UI + React or Svelte.</BlueprintItem>
          <BlueprintItem label="Workflow Builder">n8n.io as a visual automation layer.</BlueprintItem>
      </BlueprintSection>

    </ViewContainer>
  );
};
