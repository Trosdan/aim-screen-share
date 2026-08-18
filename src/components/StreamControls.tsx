import React, { useState } from "react";
import { 
  MonitorUp, 
  MonitorOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Settings, 
  Smile, 
  ChevronUp, 
  Sparkles,
  Sliders
} from "lucide-react";
import { StreamConfig } from "../types";

interface StreamControlsProps {
  isStreaming: boolean;
  isMicMuted: boolean;
  onToggleScreenShare: () => void;
  onToggleMic: () => void;
  onLeaveRoom: () => void;
  onSendReaction: (emoji: string) => void;
  onOpenSettings: () => void;
  onOpenScreenShareConfig: () => void;
}

const QUICK_REACTIONS = ["🔥", "👏", "❤️", "😂", "🚀", "🎉", "👀", "💯"];

export const StreamControls: React.FC<StreamControlsProps> = ({
  isStreaming,
  isMicMuted,
  onToggleScreenShare,
  onToggleMic,
  onLeaveRoom,
  onSendReaction,
  onOpenSettings,
  onOpenScreenShareConfig,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <footer className="h-20 bg-[#1e1f22] border-t border-black/20 flex items-center justify-between px-4 sm:px-6 relative select-none shrink-0 z-30">
      {/* Left: WebRTC Audio Status */}
      <div className="flex items-center gap-4 w-1/3 min-w-0">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white tracking-tight">WebRTC Audio</span>
          <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            RTCPeerConnection: ACTIVE
          </span>
        </div>
      </div>

      {/* Center: Sleek Action Controls Dock */}
      <div className="flex items-center gap-2 bg-[#2b2d31] p-1.5 rounded-2xl shadow-inner border border-white/5">
        {/* Mic Toggle Button */}
        <button
          id="btn-toggle-mic"
          onClick={onToggleMic}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isMicMuted
              ? "bg-[#313338] hover:bg-[#35373c] text-[#dbdee1]"
              : "bg-[#248046] hover:bg-[#1a6334] text-white shadow-md shadow-emerald-900/30"
          }`}
          title={isMicMuted ? "Desmutar Microfone" : "Mutar Microfone"}
        >
          {isMicMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
        </button>

        {/* Reaction Picker Button */}
        <div className="relative">
          <button
            id="btn-open-reactions"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              showEmojiPicker
                ? "bg-[#5865f2] text-white"
                : "bg-[#313338] hover:bg-[#35373c] text-[#dbdee1]"
            }`}
            title="Enviar reação na tela"
          >
            <Smile className="w-5 h-5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#2b2d31] border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-1 z-50 animate-fadeIn">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSendReaction(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-[#35373c] hover:scale-125 active:scale-95 transition-transform flex items-center justify-center text-base cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Screen Share Config / Quality Button */}
        <button
          id="btn-screenshare-config"
          onClick={onOpenScreenShareConfig}
          className="w-12 h-12 rounded-xl bg-[#313338] hover:bg-[#35373c] text-[#dbdee1] hover:text-white flex items-center justify-center transition-all cursor-pointer hidden sm:flex"
          title="Qualidade da Transmissão (1080p, 60fps, som)"
        >
          <Sliders className="w-5 h-5" />
        </button>

        {/* Main Share Screen Button */}
        <button
          id="btn-toggle-screenshare"
          onClick={onToggleScreenShare}
          className={`px-5 sm:px-6 h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest text-white transition-all cursor-pointer shadow-lg ${
            isStreaming
              ? "bg-[#da373c] hover:bg-[#a12828] shadow-red-500/20 animate-pulse"
              : "bg-[#248046] hover:bg-[#1a6334]"
          }`}
        >
          {isStreaming ? (
            <>
              <MonitorOff className="w-4 h-4" />
              <span className="hidden sm:inline">Parar Tela</span>
            </>
          ) : (
            <>
              <MonitorUp className="w-4 h-4" />
              <span>Compartilhar Tela</span>
            </>
          )}
        </button>

        {/* Disconnect / Leave Room Button */}
        <button
          id="btn-leave-room-dock"
          onClick={onLeaveRoom}
          className="w-12 h-12 rounded-xl bg-[#da373c] hover:bg-[#a12828] flex items-center justify-center shadow-lg shadow-red-500/20 text-white transition-all cursor-pointer"
          title="Desconectar da Sala"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Settings & Mesh info */}
      <div className="w-1/3 flex justify-end items-center gap-2">
        <button
          id="btn-stream-settings"
          onClick={onOpenSettings}
          className="p-2 hover:bg-[#35373c] rounded-lg text-[#949ba4] hover:text-white transition-colors cursor-pointer"
          title="Configurações"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
};
