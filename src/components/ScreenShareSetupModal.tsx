import React from "react";
import { 
  Sliders, 
  Tv, 
  Volume2, 
  Gauge, 
  X, 
  Sparkles,
  Check
} from "lucide-react";
import { StreamConfig } from "../types";

interface ScreenShareSetupModalProps {
  config: StreamConfig;
  onChangeConfig: (newConfig: StreamConfig) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const ScreenShareSetupModal: React.FC<ScreenShareSetupModalProps> = ({
  config,
  onChangeConfig,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
      <div className="bg-[#2b2d31] border border-black/20 rounded-xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#5865f2]" />
              Qualidade da Transmissão
            </h3>
            <p className="text-xs text-[#949ba4]">
              Ajuste resolução, taxa de quadros e áudio da sua tela.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#949ba4] hover:text-white rounded hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resolution Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#949ba4] uppercase tracking-wider flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5" />
            Resolução de Vídeo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "720p HD", val: "720p" },
              { label: "1080p FHD", val: "1080p" },
              { label: "Origem (4K)", val: "source" },
            ].map((res) => (
              <button
                key={res.val}
                type="button"
                onClick={() => onChangeConfig({ ...config, resolution: res.val as any })}
                className={`py-2 px-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  config.resolution === res.val
                    ? "bg-[#5865f2] text-white border-[#5865f2] shadow-md"
                    : "bg-[#1e1f22] text-[#dbdee1] hover:text-white hover:bg-[#35373c] border-white/5"
                }`}
              >
                <span>{res.label}</span>
                {config.resolution === res.val && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* Frame Rate Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#949ba4] uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            Taxa de Quadros (FPS)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "30 FPS (Padrão)", fps: 30 },
              { label: "60 FPS (Alta Fluidez)", fps: 60 },
            ].map((fpsOpt) => (
              <button
                key={fpsOpt.fps}
                type="button"
                onClick={() => onChangeConfig({ ...config, frameRate: fpsOpt.fps as any })}
                className={`py-2 px-3 rounded text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-between ${
                  config.frameRate === fpsOpt.fps
                    ? "bg-[#5865f2] text-white border-[#5865f2] shadow-md"
                    : "bg-[#1e1f22] text-[#dbdee1] hover:text-white hover:bg-[#35373c] border-white/5"
                }`}
              >
                <span>{fpsOpt.label}</span>
                {config.frameRate === fpsOpt.fps && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Capture Toggle */}
        <div className="bg-[#1e1f22] p-3 rounded border border-white/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase text-white flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-green-400" />
              Compartilhar Áudio do Sistema
            </span>
            <p className="text-[11px] text-[#949ba4]">
              Inclui áudio da aba, jogo ou aplicativo transmitido
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.captureAudio}
              onChange={(e) => onChangeConfig({ ...config, captureAudio: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-[#2b2d31] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5865f2]"></div>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-semibold text-[#949ba4] hover:text-white hover:bg-[#1e1f22] transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-[#5865f2]/20 cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Iniciar Transmissão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
