import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const SVG_PATTERN = /<svg[\s\S]*?<\/svg>/gi;
const MAX_CONTENT_LENGTH = 500_000;

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "");
}

class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[MarkdownContent] Render error:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-amber-300 bg-amber-50 rounded-lg text-sm text-amber-800">
          Content could not be rendered. Please try refreshing the page.
        </div>
      );
    }
    return this.props.children;
  }
}

function MarkdownContentInner({ content, className = "" }: MarkdownContentProps) {
  if (!content) return null;

  if (content.length > MAX_CONTENT_LENGTH) {
    return (
      <div className={`prose prose-sm max-w-none ${className}`}>
        <p className="text-amber-600">Content is too large to render inline.</p>
      </div>
    );
  }

  const parts: { type: "text" | "svg"; value: string }[] = [];
  let lastIndex = 0;
  const regex = new RegExp(SVG_PATTERN);
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "svg", value: sanitizeSvg(match[0]) });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", value: content });
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {parts.map((part, i) =>
        part.type === "svg" ? (
          <div
            key={i}
            className="my-4 flex justify-center overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: part.value }}
            style={{ maxWidth: "100%" }}
            role="img"
            aria-label="Diagram"
          />
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {part.value}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}

export default function MarkdownContent(props: MarkdownContentProps) {
  return (
    <MarkdownErrorBoundary>
      <MarkdownContentInner {...props} />
    </MarkdownErrorBoundary>
  );
}
