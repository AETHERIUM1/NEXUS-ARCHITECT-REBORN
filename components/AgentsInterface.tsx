import React, { useState } from 'react';
import { ViewContainer } from './ViewContainer';
import { getStreamingChatResponse } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LoadingIndicator } from './LoadingIndicator';
import { RESEARCH_AGENT_SYSTEM_PROMPT, CODEX_AGENT_SYSTEM_PROMPT } from '../constants';

const AgentRunner: React.FC<{
  title: string;
  description: string;
  placeholder: string;
  systemPrompt: string;
  enableSearch?: boolean;
}> = ({ title, description, placeholder, systemPrompt, enableSearch = false }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResponse('');
    setError(null);

    try {
      const stream = getStreamingChatResponse(prompt, systemPrompt, [], enableSearch, []);
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk.text;
        setResponse(fullText);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline ? (
      <SyntaxHighlighter style={atomDark} language={match ? match[1] : undefined} PreTag="div" {...props}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="bg-slate-700 text-cyan-300 rounded-sm px-1.5 py-0.5" {...props}>{children}</code>
    );
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 mb-4">{description}</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-slate-900/80 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="mt-3 px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed w-full flex items-center justify-center gap-2"
        >
          {isLoading ? <LoadingIndicator /> : 'Execute'}
        </button>
      </form>

      {(isLoading || response || error) && (
        <div className="mt-6">
          <h4 className="font-bold text-white">Agent Output</h4>
          <div className="prose prose-sm prose-invert max-w-none mt-2 bg-slate-900 border border-slate-700 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
            {error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                {response || "Generating..."}
              </ReactMarkdown>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AgentsInterface: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<'research' | 'codex'>('research');

  return (
    <ViewContainer title="Agents Interface">
      <div className="mb-6 flex justify-center border-b border-slate-700">
        <button
          onClick={() => setActiveAgent('research')}
          className={`px-6 py-3 text-sm font-bold transition-colors ${activeAgent === 'research' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          Deep Research Agent
        </button>
        <button
          onClick={() => setActiveAgent('codex')}
          className={`px-6 py-3 text-sm font-bold transition-colors ${activeAgent === 'codex' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          Codex Agent
        </button>
      </div>

      <div>
        {activeAgent === 'research' && (
          <AgentRunner
            title="Deep Research Agent"
            description="Initiates a web-grounded search to gather, synthesize, and report on any topic with cited sources."
            placeholder="Enter a research topic, e.g., 'The impact of quantum computing on cryptography'"
            systemPrompt={RESEARCH_AGENT_SYSTEM_PROMPT}
            enableSearch={true}
          />
        )}
        {activeAgent === 'codex' && (
          <AgentRunner
            title="Codex Agent"
            description="An expert programming agent for code generation, analysis, and debugging."
            placeholder="Enter a coding request, e.g., 'Write a Python script to parse a CSV file and find the average of a specific column.'"
            systemPrompt={CODEX_AGENT_SYSTEM_PROMPT}
          />
        )}
      </div>
    </ViewContainer>
  );
};