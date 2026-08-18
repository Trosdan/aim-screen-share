import React, { useState } from "react";
import { 
  Settings, 
  Volume2, 
  Radio, 
  Bell, 
  X, 
  Info,
  Sparkles
} from "lucide-react";

interface SettingsModalProps {
  soundEffectsEnabled: boolean;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  soundEffectsEnabled,
  setSoundEffectsEnabled,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
      <div className="bg-[#2b2d31] border border-black/20 rounded-xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#5865f2]" />
              Configurações do Aplicativo
            </h3>
            <p className="text-xs text-[#949ba4]">
              Preferências de áudio, efeitos e conexões P2P.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#949ba4] hover:text-white rounded hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Sound Effects */}
          <div className="bg-[#1e1f22] p-3 rounded border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase text-white flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-[#5865f2]" />
                Efeitos Sonoros do Discord
              </span>
              <p className="text-[11px] text-[#949ba4]">
                Tocar sons sutis ao entrar na sala ou iniciar transmissões
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEffectsEnabled}
                onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#2b2d31] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5865f2]"></div>
            </label>
          </div>

          {/* WebRTC Architecture info */}
          <div className="bg-[#1e1f22] p-3 rounded border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-200">
              <Radio className="w-3.5 h-3.5 text-green-400" />
              <span>Conexão WebRTC Mesh Nativa</span>
            </div>
            <p className="text-[11px] text-[#949ba4] leading-relaxed">
              O tráfego de vídeo e áudio viaja de ponta a ponta (Peer-to-Peer) diretamente entre os participantes com baixa latência utilizando codecs VP8/VP9/H264 e Opus para áudio cristalino.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            Salvar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
