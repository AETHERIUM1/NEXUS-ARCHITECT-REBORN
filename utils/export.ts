import { Message } from '../types';

export function exportToMarkdown(messages: Message[], title: string) {
  let markdownContent = `# ${title}\n\n`;

  messages.forEach(message => {
    const prefix = message.role === 'user' ? '> **User**' : '### **NEXUS**';
    markdownContent += `${prefix}\n\n${message.text}\n\n`;
    if (message.imageUrl) {
        markdownContent += `![Generated Image](${message.imageUrl})\n\n`;
    }
    if (message.sources && message.sources.length > 0) {
        markdownContent += `**Sources:**\n`;
        message.sources.forEach(source => {
            markdownContent += `* [${source.title}](${source.uri})\n`;
        });
        markdownContent += `\n`;
    }
    markdownContent += '---\n\n';
  });

  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${sanitizedTitle}_${new Date().toISOString()}.md`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
