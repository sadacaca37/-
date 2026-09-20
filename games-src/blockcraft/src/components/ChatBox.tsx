import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  isChatOpen,
  setIsChatOpen,
}) => {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText("");
    }
    setIsChatOpen(false);
  };

  return (
    <div className="fixed bottom-20 left-4 z-30 max-w-sm w-full pointer-events-auto select-none">
      {/* Messages View */}
      <div
        className={`space-y-1.5 p-2 rounded-xl transition-all duration-200 overflow-y-auto max-h-48 ${
          isChatOpen
            ? "bg-neutral-950/85 backdrop-blur-md border border-neutral-700/80 shadow-2xl"
            : "bg-transparent pointer-events-none"
        }`}
      >
        {messages.slice(-8).map((msg) => (
          <div
            key={msg.id}
            className="text-xs font-mono leading-relaxed bg-black/50 px-2.5 py-1 rounded backdrop-blur-sm border-l-2"
            style={{ borderLeftColor: msg.color || "#3b82f6" }}
          >
            <span
              className="font-bold mr-1.5"
              style={{ color: msg.color || "#60a5fa" }}
            >
              &lt;{msg.senderName}&gt;
            </span>
            <span className="text-neutral-100 break-words">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field (Opened with Enter / T or button) */}
      {isChatOpen ? (
        <form onSubmit={handleSubmit} className="mt-2 flex gap-1.5">
          <input
            ref={inputRef}
            type="text"
            maxLength={90}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsChatOpen(false);
              }
            }}
            placeholder="메시지 입력... (Enter 전송, ESC 취소)"
            className="flex-1 px-3 py-2 bg-neutral-900/95 border border-neutral-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500 shadow-xl"
          />
          <button
            type="submit"
            className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <button
          id="btn-open-chat"
          onClick={() => setIsChatOpen(true)}
          className="mt-1 px-2.5 py-1 bg-black/40 hover:bg-black/70 text-neutral-400 hover:text-white rounded-lg text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-sm border border-white/10 transition-all cursor-pointer"
        >
          <MessageSquare className="w-3 h-3" />
          <span>[Enter] 채팅</span>
        </button>
      )}
    </div>
  );
};
