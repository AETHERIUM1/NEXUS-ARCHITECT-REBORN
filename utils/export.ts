import { Message, MessageRole } from '../types';

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

export function exportToJson(messages: Message[], title: string) {
  const exportData = {
    title,
    exportedAt: new Date().toISOString(),
    messages,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${sanitizedTitle}_${new Date().toISOString()}.json`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseMarkdownToConversation(markdownContent: string): { title: string; messages: Message[] } {
  const lines = markdownContent.split('\n');
  
  const title = lines[0]?.startsWith('# ') ? lines[0].substring(2).trim() : 'Imported Markdown';
  const content = lines[0]?.startsWith('# ') ? lines.slice(1).join('\n') : markdownContent;
  
  const messages: Message[] = [];
  const messageBlocks = content.split(/\n---\n/);

  for (const block of messageBlocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    if (trimmedBlock.startsWith('> **User**')) {
      const text = trimmedBlock.replace('> **User**', '').trim();
      messages.push({ role: MessageRole.USER, text });
    } else if (trimmedBlock.startsWith('### **NEXUS**')) {
      let textContent = trimmedBlock.replace('### **NEXUS**', '').trim();
      
      const imageUrlMatch = textContent.match(/!\[Generated Image\]\((.*?)\)/);
      const imageUrl = imageUrlMatch ? imageUrlMatch[1] : undefined;
      if (imageUrlMatch) {
        textContent = textContent.replace(imageUrlMatch[0], '').trim();
      }

      const sourcesMatch = textContent.match(/\*\*Sources:\*\*\n([\s\S]*)/);
      const sources: { title: string; uri: string }[] = [];
      if (sourcesMatch) {
        textContent = textContent.replace(sourcesMatch[0], '').trim();
        const sourceLines = sourcesMatch[1].trim().split('\n');
        for (const line of sourceLines) {
          const sourceLinkMatch = line.match(/\* \[(.*?)\]\((.*?)\)/);
          if (sourceLinkMatch) {
            sources.push({ title: sourceLinkMatch[1], uri: sourceLinkMatch[2] });
          }
        }
      }

      const message: Message = { role: MessageRole.MODEL, text: textContent };
      if (imageUrl) message.imageUrl = imageUrl;
      if (sources.length > 0) message.sources = sources;

      messages.push(message);
    }
  }

  return { title, messages };
}