import { useState, useRef } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 w-full px-4 md:px-10 pb-8 pt-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-2 pl-4 flex items-end gap-3">
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">attach_file</span>
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => { setValue(e.target.value); handleChange(); }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Command Ares..."
          className="flex-1 bg-transparent resize-none outline-none max-h-40 py-3 text-on-surface font-body text-base placeholder:text-on-surface-variant/40"
        />

        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="p-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
