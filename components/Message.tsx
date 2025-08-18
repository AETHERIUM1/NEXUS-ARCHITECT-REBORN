import React, { useState, useContext } from 'react';
import { Message as MessageType, MessageRole } from '../types';
import { AppContext } from '../contexts/AppContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageProps {
  message: MessageType;
  index: number;
}

const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-600 light:bg-blue-500 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
        U
    </div>
);

const NexusAvatarIcon = () => (
    <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-700 light:bg-slate-300 flex-shrink-0 flex items-center justify-center">
        <svg className="w-5 h-5 text-cyan-400 dark:text-cyan-400 light:text-cyan-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g className="animate-[nexus-icon-pulse_2s_ease-in-out_infinite]">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="5" opacity="0.5"/>
                <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="5" opacity="0.75"/>
                <circle cx="50" cy="50" r="15" fill="currentColor"/>
            </g>
        </svg>
    </div>
);

const CopyButton = ({ onClick, status }: { onClick: () => void; status: 'idle' | 'copied' }) => (
    <button
        onClick={onClick}
        aria-label={status === 'idle' ? 'Copy message text' : 'Copied to clipboard'}
        title={status === 'idle' ? 'Copy message text' : 'Copied to clipboard'}
        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors"
    >
        {status === 'idle' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        )}
    </button>
);


const DeleteButton = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={onClick}
        aria-label="Delete message"
        title="Delete message"
        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    </button>
);

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [copyText, setCopyText] = useState('Copy');
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString).then(() => {
            setCopyText('Copied!');
            setTimeout(() => setCopyText('Copy'), 2000);
        });
    };

    return !inline ? (
        <div className="relative my-2 bg-slate-950 rounded-lg overflow-hidden border border-slate-800/50 light:border-slate-300/50">
            <div className="flex justify-between items-center px-4 py-1 bg-slate-800 light:bg-slate-200 text-xs text-slate-400 light:text-slate-600">
                <span>{match ? match[1] : 'code'}</span>
                <button onClick={handleCopy} className="font-mono hover:text-cyan-400 dark:hover:text-cyan-400 light:hover:text-cyan-600 transition-colors">
                    {copyText}
                </button>
            </div>
            <SyntaxHighlighter
                style={atomDark}
                language={match ? match[1] : undefined}
                PreTag="div"
                {...props}
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className="bg-slate-700 light:bg-slate-200 text-cyan-300 light:text-indigo-600 rounded-sm px-1.5 py-0.5 text-sm font-mono" {...props}>
            {children}
        </code>
    );
};

const MessageBubble = ({ message }: { message: MessageType }) => {
    const isUser = message.role === MessageRole.USER;
    return (
        <div className={`max-w-xl rounded-lg px-4 py-3 shadow-lg ${isUser ? 'bg-blue-600 dark:bg-blue-600 light:bg-blue-500' : 'bg-slate-800 dark:bg-slate-800 light:bg-white'}`}>
            <div className={`prose prose-sm prose-invert dark:prose-invert light:prose-p:text-slate-800 light:prose-li:text-slate-800 light:prose-strong:text-slate-900 light:prose-headings:text-slate-900 max-w-none text-base leading-relaxed ${isUser ? 'text-white dark:text-glow-on-dark' : 'dark:text-slate-200'}`}>
                {message.text && (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{ code: CodeBlock }}
                    >
                        {message.text}
                    </ReactMarkdown>
                )}
            </div>
            {message.files && message.files.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-500/30 dark:border-blue-500/30 light:border-blue-300">
                    <ul className="space-y-1">
                        {message.files.map((file, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs bg-blue-500/80 dark:bg-blue-500/80 light:bg-blue-400 p-1.5 rounded-md text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                <span className="truncate" title={file.name}>{file.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {message.imageUrl && (
                <div className="mt-2">
                    <img src={message.imageUrl} alt="Generated content" className="rounded-lg max-w-full h-auto" />
                </div>
            )}
            {message.videoUrl && (
                <div className="mt-2">
                    <video 
                        src={message.videoUrl} 
                        controls 
                        autoPlay 
                        muted 
                        loop
                        playsInline
                        className="rounded-lg max-w-full h-auto bg-black"
                    />
                </div>
            )}
            {message.sources && message.sources.length > 0 && (
                <div className="mt-3 border-t border-slate-700/50 light:border-slate-200 pt-3">
                    <h4 className="text-xs font-bold text-slate-400 light:text-slate-500 mb-2">Sources:</h4>
                    <ul className="space-y-1">
                        {message.sources.map((source, i) => (
                            <li key={i} className="flex items-center">
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 light:text-cyan-600 hover:underline truncate">
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


export const Message: React.FC<MessageProps> = ({ message, index }) => {
  const { deleteMessage } = useContext(AppContext);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const isUser = message.role === MessageRole.USER;
  const canBeDeleted = index > 0;

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    }).catch(err => console.error("Could not copy text: ", err));
  };

  const MessageActions = (
    <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <CopyButton onClick={handleCopy} status={copyStatus} />
        {canBeDeleted && <DeleteButton onClick={() => deleteMessage(index)} />}
    </div>
  );

  return (
    <div className={`group flex w-full items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser ? (
        <>
          {MessageActions}
          <MessageBubble message={message} />
          <UserIcon />
        </>
      ) : (
        <>
          <NexusAvatarIcon />
          <MessageBubble message={message} />
          {MessageActions}
        </>
      )}
    </div>
  );
};
