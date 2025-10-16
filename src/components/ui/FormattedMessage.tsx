import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Import required CSS
import 'katex/dist/katex.min.css';

interface FormattedMessageProps {
  content: string;
  className?: string;
}

// Copy to clipboard utility
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

// Enhanced Code Block Component with Copy Button
const CodeBlock: React.FC<{ 
  children: string; 
  className?: string; 
  language?: string;
}> = ({ children, className, language }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const success = await copyToClipboard(children);
    if (success) {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: "Failed",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  // Syntax highlighting removed to fix errors

  return (
    <div className="relative group my-4 overflow-hidden rounded-lg border border-border">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 text-xs font-mono border-b border-gray-700">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          {language && <span className="ml-2 text-gray-400">{language}</span>}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      
      {/* Code content */}
      <pre className={`bg-gray-900 dark:bg-gray-900 text-gray-100 p-4 overflow-x-auto font-mono text-sm ${className || ''}`}>
        <code className="text-gray-100">
          {children}
        </code>
      </pre>
    </div>
  );
};

// Mermaid Diagram Component - Simplified to prevent errors
const MermaidDiagram: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="my-4 p-4 bg-muted border border-border rounded-lg">
      <p className="text-sm text-muted-foreground mb-2">Mermaid Diagram:</p>
      <pre className="text-xs bg-background p-3 rounded overflow-x-auto font-mono">
        {content}
      </pre>
    </div>
  );
};

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ 
  content, 
  className = "" 
}) => {
  // Process content for Mermaid diagrams
  const processedContent = content.replace(
    /```mermaid\n([\s\S]*?)\n```/g,
    (match, diagramContent) => {
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return `<div data-mermaid-id="${id}" data-mermaid-content="${encodeURIComponent(diagramContent)}"></div>`;
    }
  );

  return (
    <div className={`formatted-response prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom styling for different elements
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-foreground border-b border-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-3 mt-4 first:mt-0 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-foreground">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold mb-2 mt-3 first:mt-0 text-foreground">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-semibold mb-2 mt-3 first:mt-0 text-foreground opacity-80">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="text-foreground leading-relaxed mb-4 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">
              {children}
            </em>
          ),
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            
            if (isInline) {
              return (
                <code 
                  className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground border"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            // For code blocks in pre tags
            return (
              <code className="text-gray-100" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            // Extract code content safely
            let codeContent = '';
            let language = '';
            
            try {
              const codeElement = React.Children.toArray(children)[0] as React.ReactElement;
              if (codeElement && codeElement.props) {
                language = codeElement.props.className?.replace('language-', '') || '';
                codeContent = String(codeElement.props.children || '');
              } else {
                codeContent = String(children || '');
              }
            } catch (error) {
              codeContent = String(children || '');
            }
            
            return <CodeBlock language={language}>{codeContent}</CodeBlock>;
          },
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 py-3 italic">
              <div className="text-blue-800 dark:text-blue-200">
                {children}
              </div>
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc list-inside space-y-2 text-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal list-inside space-y-2 text-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              <span className="ml-2">{children}</span>
            </li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:underline break-words"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/50">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-6 border-t border-border" />
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg my-4"
            />
          ),
          // Task list items (GitHub flavored markdown)
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 mt-1 flex-shrink-0"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
          // Custom div handler for Mermaid diagrams
          div: ({ children, ...props }: any) => {
            try {
              if (props['data-mermaid-id'] && props['data-mermaid-content']) {
                const content = decodeURIComponent(props['data-mermaid-content'] as string);
                return <MermaidDiagram content={content} />;
              }
            } catch (error) {
              console.error('Mermaid diagram error:', error);
            }
            return <div {...props}>{children}</div>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedMessage;