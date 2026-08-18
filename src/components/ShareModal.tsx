import React, { useState } from "react";
import { 
  Copy, 
  Check, 
  X, 
  Share2, 
  Lock, 
  ShieldCheck,
  QrCode
} from "lucide-react";
import { RoomMeta } from "../types";

interface ShareModalProps {
  room: RoomMeta;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ room, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}?room=${room.id}` 
    : `https://app.local?room=${room.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(room.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#2b2d31] border border-black/20 rounded-xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#5865f2]" />
              Convidar para {room.name}
            </h3>
            <p className="text-xs text-[#949ba4]">
              Envie o link ou código para amigos transmitirem e assistirem.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#949ba4] hover:text-white rounded hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Room ID Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
              Código da Sala (Room ID)
            </label>
            <div className="flex items-center space-x-2 bg-[#1e1f22] p-2 rounded border border-white/5">
              <span className="flex-1 font-mono font-bold text-white text-sm tracking-wider px-2">
                {room.id}
              </span>
              <button
                onClick={handleCopyId}
                className="px-3 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? "Copiado!" : "Copiar ID"}</span>
              </button>
            </div>
          </div>

          {/* Link Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
              Link Direto de Acesso
            </label>
            <div className="flex items-center space-x-2 bg-[#1e1f22] p-2 rounded border border-white/5">
              <span className="flex-1 font-mono text-xs text-[#dbdee1] truncate px-2">
                {shareUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded bg-[#35373c] hover:bg-[#404249] text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          {room.isPrivate && (
            <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Esta sala é protegida por senha. Lembre-se de informar a senha aos convidados.</span>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            Pronto
          </button>
        </div>
      </div>
    </div>
  );
};
