'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { MarkdownImage } from './markdown-image'

interface MarkdownProps {
  content: string
  className?: string
}

// Helper function to extract text content from React children for heading IDs
function getTextContent(children: any): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children.map((child) => 
      typeof child === 'string' ? child : 
      typeof child === 'object' && child?.props?.children ? getTextContent(child.props.children) : 
      ''
    ).join('')
  }
  return ''
}

// Helper function to generate heading ID from text
function generateHeadingId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none text-foreground', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize heading styles - auto-generate IDs for scroll spy
          h1: ({ node, children, ...props }: any) => {
            const title = getTextContent(children)
            const id = generateHeadingId(title)
            return <h1 id={id} className="text-2xl font-bold mt-6 mb-4 scroll-mt-28" {...props}>{children}</h1>
          },
          h2: ({ node, children, ...props }: any) => {
            const title = getTextContent(children)
            const id = generateHeadingId(title)
            return <h2 id={id} className="text-xl font-semibold mt-5 mb-3 scroll-mt-28" {...props}>{children}</h2>
          },
          h3: ({ node, children, ...props }: any) => {
            const title = getTextContent(children)
            const id = generateHeadingId(title)
            return <h3 id={id} className="text-lg font-semibold mt-4 mb-2 scroll-mt-28" {...props}>{children}</h3>
          },
          h4: ({ node, children, ...props }: any) => {
            const title = getTextContent(children)
            const id = generateHeadingId(title)
            return <h4 id={id} className="text-base font-semibold mt-3 mb-2" {...props}>{children}</h4>
          },
          h5: ({ node, children, ...props }: any) => {
            const title = getTextContent(children)
            const id = generateHeadingId(title)
            return <h5 id={id} className="text-sm font-semibold mt-3 mb-2" {...props}>{children}</h5>
          },
          h6: ({ node, children, ...props }: any) => {
            const title = getTextContent(children)
            const id = generateHeadingId(title)
            return <h6 id={id} className="text-xs font-semibold mt-2 mb-2" {...props}>{children}</h6>
          },
          // Customize paragraph
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          // Customize links
          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:underline break-words"
              target="_blank"
              rel="noreferrer noopener"
              {...props}
            />
          ),
          // Customize code blocks
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className
            return isInline ? (
              <code
                className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          // Customize pre blocks
          pre: ({ node, ...props }) => (
            <pre
              className="overflow-x-auto rounded-lg bg-muted p-4 mb-4 text-sm"
              {...props}
            />
          ),
          // Customize lists
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="ml-4" {...props} />,
          // Customize blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground"
              {...props}
            />
          ),
          // Customize horizontal rules
          hr: ({ node, ...props }) => <hr className="my-6 border-border" {...props} />,
          // Customize tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-muted" {...props} />,
          th: ({ node, ...props }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-border px-4 py-2" {...props} />
          ),
          // Customize images - use custom component to handle external URLs
          img: ({ node, src, alt, title, ...props }: any) => (
            <MarkdownImage
              src={src}
              alt={alt}
              title={title}
              className="max-w-full"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

