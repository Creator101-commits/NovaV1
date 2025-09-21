import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

// Import required CSS for katex only - we'll handle code styling manually
import 'katex/dist/katex.min.css';

interface FormattedMessageProps {
  content: string;
  className?: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ 
  content, 
  className = "" 
}) => {
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
            
            // For code blocks, return the code element with language class
            return (
              <code className={`${className} text-gray-100`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            // Extract language from the child code element if it exists
            const codeElement = React.Children.toArray(children)[0] as React.ReactElement;
            const language = codeElement?.props?.className?.replace('language-', '') || '';
            
            return (
              <div className="my-4 overflow-hidden rounded-lg border border-border">
                {language && (
                  <div className="bg-gray-800 text-gray-300 px-3 py-2 text-xs font-mono border-b border-gray-700">
                    {language}
                  </div>
                )}
                <pre className={`bg-gray-900 text-gray-100 p-4 overflow-x-auto font-mono text-sm ${language ? '' : 'rounded-lg'}`}>
                  {children}
                </pre>
              </div>
            );
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedMessage;
