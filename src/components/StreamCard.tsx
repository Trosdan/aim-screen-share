import React, { useEffect, useRef, useState } from "react";
import { 
  Maximize, 
  Volume2, 
  VolumeX, 
  Pin, 
  PictureInPicture2, 
  Radio, 
  Activity, 
  Layers,
  Sparkles,
  Tv
} from "lucide-react";

interface StreamCardProps {
  id: string;
  userName: string;
  avatarColor: string;
  stream: MediaStream;
  isSelf?: boolean;
  isSpotlight?: boolean;
  onToggleSpotlight?: () => void;
  onTogglePin?: () => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({
  id,
  userName,
  avatarColor,
  stream,
  isSelf = false,
  isSpotlight = false,
  onToggleSpotlight,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [volume, setVolume] = useState<number>(isSelf ? 0 : 1);
  const [isMuted, setIsMuted] = useState<boolean>(isSelf);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasAudioTrack, setHasAudioTrack] = useState<boolean>(false);
  const [resolution, setResolution] = useState<string>("Carregando...");
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [statsData, setStatsData] = useState<{ width: number; height: number; fps?: number } | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Attach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.muted = isSelf || isMuted;

    const audioTracks = stream.getAudioTracks();
    setHasAudioTrack(audioTracks.length > 0);

    const handleLoadedMetadata = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w && h) {
        setResolution(`${w}x${h}`);
        setStatsData({ width: w, height: h });
      }
      video.play().catch((err) => {
        console.warn("Autoplay was prevented:", err);
      });
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [stream, isSelf]);

  // Handle Volume change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (isSelf) return; // Self is always muted locally to avoid feedback loop
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  // Fullscreen
  const handleToggleFullscreen = async () => {
    try {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn("Fullscreen error:", e);
    }
  };

  // Picture in Picture
  const handleTogglePiP = async () => {
    try {
      const video = videoRef.current;
      if (!video) return;
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("PiP error:", e);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2800);
  };

  return (
    <div
      ref={containerRef}
      id={`stream-card-${id}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      className={`relative w-full h-full bg-[#111214] rounded-xl overflow-hidden border transition-all duration-200 group flex items-center justify-center select-none shadow-2xl ${
        isSpotlight
          ? "border-2 border-[#5865f2]"
          : "border border-white/5 hover:border-white/20"
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain bg-black"
      />

      {/* Top Left: LIVE Badge & User info */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
        <div className="bg-[#5865f2] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
          LIVE
        </div>

        <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 flex items-center gap-2 text-white text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></div>
          <span className="truncate max-w-[140px]">
            {userName}'s Screen {isSelf && "(Você)"}
          </span>
        </div>
      </div>

      {/* Top Right: Resolution / FPS Badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <div className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[#949ba4] text-[10px] font-mono flex items-center gap-1">
          <Tv className="w-3 h-3 text-[#5865f2]" />
          <span>{resolution}</span>
        </div>

        {hasAudioTrack && !isSelf && (
          <div className="px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-medium flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            <span>Áudio</span>
          </div>
        )}
      </div>

      {/* Bottom Floating Controls Bar (Shows on hover) */}
      <div
        className={`absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between transition-opacity duration-200 z-10 ${
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Left: Volume Slider */}
        <div className="flex items-center space-x-2">
          {!isSelf ? (
            <>
              <button
                onClick={handleToggleMute}
                className="p-1.5 text-[#dbdee1] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title={isMuted ? "Desmutar áudio" : "Mutar áudio"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#dbdee1]" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-[#5865f2] h-1.5 rounded-lg bg-[#35373c] cursor-pointer"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </>
          ) : (
            <span className="text-[11px] text-[#949ba4] font-medium px-1">
              Sua Transmissão
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {onToggleSpotlight && (
            <button
              onClick={onToggleSpotlight}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSpotlight
                  ? "bg-[#5865f2] text-white"
                  : "text-[#dbdee1] hover:text-white hover:bg-white/10"
              }`}
              title={isSpotlight ? "Sair do Destaque" : "Expandir em Destaque"}
            >
              <Pin className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleTogglePiP}
            className="p-1.5 text-[#dbdee1] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer hidden sm:block"
            title="Picture-in-Picture (Janela Flutuante)"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 text-[#dbdee1] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tela Cheia"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
