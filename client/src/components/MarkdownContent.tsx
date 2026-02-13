import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const SVG_PATTERN = /<svg[\s\S]*?<\/svg>/gi;

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const parts: { type: "text" | "svg"; value: string }[] = [];
  let lastIndex = 0;
  const regex = new RegExp(SVG_PATTERN);
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "svg", value: match[0] });
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
            className="my-4 flex justify-center"
            dangerouslySetInnerHTML={{ __html: part.value }}
            style={{ maxWidth: "100%" }}
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
