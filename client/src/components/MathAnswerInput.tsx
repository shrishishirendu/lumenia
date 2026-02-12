import { useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MathAnswerInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onSubmit?: () => void;
  autoFocus?: boolean;
  className?: string;
  "data-testid"?: string;
}

const SYMBOLS = [
  { label: "√", insert: "sqrt()", cursorOffset: -1 },
  { label: "^", insert: "^", cursorOffset: 0 },
  { label: "≤", insert: "<=", cursorOffset: 0 },
  { label: "≥", insert: ">=", cursorOffset: 0 },
  { label: "(", insert: "(", cursorOffset: 0 },
  { label: ")", insert: ")", cursorOffset: 0 },
  { label: "/", insert: "/", cursorOffset: 0 },
  { label: "·", insert: "*", cursorOffset: 0 },
] as const;

export default function MathAnswerInput({
  value,
  onChange,
  placeholder = "Type your answer...",
  disabled = false,
  onSubmit,
  autoFocus,
  className,
  "data-testid": testId,
}: MathAnswerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = useCallback(
    (text: string, cursorOffset: number) => {
      const el = inputRef.current;
      if (!el) {
        onChange(value + text);
        return;
      }

      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const before = value.slice(0, start);
      const after = value.slice(end);
      const newValue = before + text + after;
      onChange(newValue);

      requestAnimationFrame(() => {
        const pos = start + text.length + cursorOffset;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    },
    [value, onChange],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1" data-testid="math-toolbar">
        {SYMBOLS.map((sym) => (
          <Button
            key={sym.label}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-8 p-0 text-base font-mono"
            disabled={disabled}
            onClick={() => insertAtCursor(sym.insert, sym.cursorOffset)}
            data-testid={`math-btn-${sym.label}`}
            tabIndex={-1}
          >
            {sym.label}
          </Button>
        ))}
      </div>

      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={className ?? "text-lg font-mono"}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) onSubmit();
        }}
        data-testid={testId ?? "math-answer-input"}
      />

      <p className="text-xs text-muted-foreground">
        Tip: type sqrt(2), &gt;=, &lt;=, ^
      </p>
    </div>
  );
}
