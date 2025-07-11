import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
      components={{
        // Customize code blocks
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <pre className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-x-auto">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            <code 
              className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" 
              {...props}
            >
              {children}
            </code>
          );
        },
        // Customize links
        a: ({ children, href, ...props }: any) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            {...props}
          >
            {children}
          </a>
        ),
        // Customize headings
        h1: ({ children }: any) => (
          <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
            {children}
          </h1>
        ),
        h2: ({ children }: any) => (
          <h2 className="text-base font-bold mb-2 text-gray-900 dark:text-gray-100">
            {children}
          </h2>
        ),
        h3: ({ children }: any) => (
          <h3 className="text-sm font-bold mb-1 text-gray-900 dark:text-gray-100">
            {children}
          </h3>
        ),
        // Customize paragraphs
        p: ({ children }: any) => (
          <p className="mb-2 last:mb-0 text-gray-900 dark:text-gray-100">
            {children}
          </p>
        ),
        // Customize lists
        ul: ({ children }: any) => (
          <ul className="list-disc list-inside mb-2 space-y-1 text-gray-900 dark:text-gray-100">
            {children}
          </ul>
        ),
        ol: ({ children }: any) => (
          <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-900 dark:text-gray-100">
            {children}
          </ol>
        ),
        li: ({ children }: any) => (
          <li className="text-gray-900 dark:text-gray-100">{children}</li>
        ),
        // Customize blockquotes
        blockquote: ({ children }: any) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-2 text-gray-700 dark:text-gray-300">
            {children}
          </blockquote>
        ),
        // Customize tables
        table: ({ children }: any) => (
          <div className="overflow-x-auto mb-2">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              {children}
            </table>
          </div>
        ),
        th: ({ children }: any) => (
          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-800 font-semibold text-left text-gray-900 dark:text-gray-100">
            {children}
          </th>
        ),
        td: ({ children }: any) => (
          <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-900 dark:text-gray-100">
            {children}
          </td>
        ),
        // Customize horizontal rules
        hr: () => (
          <hr className="my-4 border-gray-300 dark:border-gray-600" />
        ),
        // Customize strong/bold text
        strong: ({ children }: any) => (
          <strong className="font-bold text-gray-900 dark:text-gray-100">
            {children}
          </strong>
        ),
        // Customize emphasis/italic text
        em: ({ children }: any) => (
          <em className="italic text-gray-900 dark:text-gray-100">
            {children}
          </em>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
