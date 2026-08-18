import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Smile, 
  MessageSquare, 
  Sparkles, 
  X, 
  Radio
} from "lucide-react";
import { ChatMessage, Participant } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
  self: Participant | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onClose,
  self,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <aside className="w-80 bg-[#2b2d31] border-l border-black/20 flex flex-col h-full z-20 shrink-0 select-none">
      {/* Chat Header */}
      <div className="h-12 px-4 border-b border-black/20 flex items-center justify-between shrink-0 bg-[#2b2d31]">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-[#949ba4]" />
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">Chat da Transmissão</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#949ba4] hover:text-white rounded hover:bg-[#35373c] transition-colors cursor-pointer"
          title="Fechar Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#949ba4] p-4 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#1e1f22] flex items-center justify-center text-[#5865f2] border border-white/5">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs">Nenhuma mensagem enviada ainda.</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === "system") {
              return (
                <div
                  key={msg.id}
                  className="text-center my-2 text-[10px] font-mono text-[#949ba4] bg-[#1e1f22]/70 py-1 px-3 rounded border border-white/5"
                >
                  {msg.text}
                </div>
              );
            }

            const isMe = self && msg.senderId === self.socketId;

            return (
              <div key={msg.id} className="flex items-start space-x-2.5 group">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: msg.senderColor || "#5865f2" }}
                >
                  {msg.senderName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-baseline space-x-2">
                    <span
                      className="text-xs font-semibold truncate max-w-[130px]"
                      style={{ color: msg.senderColor || "#5865f2" }}
                    >
                      {msg.senderName} {isMe && "(Você)"}
                    </span>
                    <span className="text-[10px] text-[#949ba4] font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-[#dbdee1] break-words leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-black/20 bg-[#2b2d31] shrink-0">
        <div className="flex items-center bg-[#1e1f22] rounded-lg px-3 py-2 border border-white/5 focus-within:border-[#5865f2] transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Conversar no chat..."
            maxLength={300}
            className="flex-1 bg-transparent text-white text-xs focus:outline-none placeholder:text-[#949ba4]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white disabled:opacity-30 disabled:hover:bg-[#5865f2] transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
