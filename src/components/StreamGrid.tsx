import React, { useState } from "react";
import { 
  Tv, 
  Radio, 
  Sparkles, 
  MonitorUp, 
  Users, 
  Layers, 
  Maximize2,
  Share2
} from "lucide-react";
import { StreamCard } from "./StreamCard";
import { RemoteStreamData, LayoutMode, Participant } from "../types";

interface StreamGridProps {
  localStream: MediaStream | null;
  self: Participant | null;
  remoteStreams: RemoteStreamData[];
  layoutMode: LayoutMode;
  onStartShare: () => void;
  onOpenShare: () => void;
}

export const StreamGrid: React.FC<StreamGridProps> = ({
  localStream,
  self,
  remoteStreams,
  layoutMode,
  onStartShare,
  onOpenShare,
}) => {
  const [spotlightId, setSpotlightId] = useState<string | null>(null);

  // Combine streams into a unified list
  interface DisplayStreamItem {
    id: string;
    userName: string;
    avatarColor: string;
    stream: MediaStream;
    isSelf: boolean;
  }

  const allStreams: DisplayStreamItem[] = [];

  // Local stream if active
  if (localStream && self) {
    allStreams.push({
      id: self.socketId,
      userName: self.userName,
      avatarColor: self.avatarColor,
      stream: localStream,
      isSelf: true,
    });
  }

  // Remote streams
  remoteStreams.forEach((r) => {
    // Avoid duplicates
    if (!allStreams.find((s) => s.id === r.socketId)) {
      allStreams.push({
        id: r.socketId,
        userName: r.userName,
        avatarColor: r.avatarColor,
        stream: r.stream,
        isSelf: false,
      });
    }
  });

  // Empty state: No active streams
  if (allStreams.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#313338] select-none">
        <div className="w-full max-w-xl bg-[#111214] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
          <div className="bg-[#2b2d31] border-2 border-dashed border-white/10 rounded-lg p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-[#1e1f22] p-4 rounded-2xl border border-white/5 text-[#5865f2] shadow-inner">
              <Tv className="w-10 h-10" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-base font-bold text-white tracking-tight uppercase">
                Aguardando Transmissão
              </h2>
              <p className="text-xs text-[#949ba4] leading-relaxed">
                Nenhuma tela está sendo transmitida nesta sala no momento. Inicie sua transmissão ou convide colegas para transmitir.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-xs">
              <button
                id="btn-start-stream-empty"
                onClick={onStartShare}
                className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <MonitorUp className="w-4 h-4" />
                <span>Compartilhar Tela</span>
              </button>

              <button
                id="btn-invite-empty"
                onClick={onOpenShare}
                className="w-full bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] hover:text-white px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wider border border-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#5865f2]" />
                <span>Convidar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Spotlight Stream
  const currentSpotlightStream = spotlightId
    ? allStreams.find((s) => s.id === spotlightId) || allStreams[0]
    : allStreams[0];

  // If in spotlight mode OR user clicked spotlight
  if (layoutMode === "spotlight" || (spotlightId && allStreams.length > 1)) {
    const thumbnails = allStreams.filter((s) => s.id !== currentSpotlightStream.id);

    return (
      <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 bg-[#313338] overflow-hidden">
        {/* Main Spotlight Video */}
        <div className="flex-1 min-h-0 relative">
          <StreamCard
            id={currentSpotlightStream.id}
            userName={currentSpotlightStream.userName}
            avatarColor={currentSpotlightStream.avatarColor}
            stream={currentSpotlightStream.stream}
            isSelf={currentSpotlightStream.isSelf}
            isSpotlight={true}
            onToggleSpotlight={() => setSpotlightId(null)}
          />
        </div>

        {/* Bottom Thumbnails Strip */}
        {thumbnails.length > 0 && (
          <div className="h-28 sm:h-36 flex items-center gap-3 overflow-x-auto pb-1 shrink-0">
            {thumbnails.map((item) => (
              <div
                key={item.id}
                onClick={() => setSpotlightId(item.id)}
                className="h-full aspect-video rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#5865f2] transition-all relative shrink-0 shadow-md"
                title={`Trocar destaque para ${item.userName}`}
              >
                <StreamCard
                  id={item.id}
                  userName={item.userName}
                  avatarColor={item.avatarColor}
                  stream={item.stream}
                  isSelf={item.isSelf}
                  isSpotlight={false}
                  onToggleSpotlight={() => setSpotlightId(item.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid Mode: Discord dynamic grid sizing
  // 1 stream: 1x1 full
  // 2 streams: 2 columns
  // 3-4 streams: 2x2 grid
  // 5-6 streams: 3x2 grid
  const getGridClasses = (count: number) => {
    if (count === 1) return "grid-cols-1 grid-rows-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-1 sm:grid-cols-2";
    if (count <= 6) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  return (
    <div className="flex-1 p-3 sm:p-4 bg-[#313338] overflow-y-auto">
      <div className={`grid gap-3 sm:gap-4 w-full h-full min-h-[400px] ${getGridClasses(allStreams.length)}`}>
        {allStreams.map((item) => (
          <div key={item.id} className="min-h-[220px] sm:min-h-[280px] h-full">
            <StreamCard
              id={item.id}
              userName={item.userName}
              avatarColor={item.avatarColor}
              stream={item.stream}
              isSelf={item.isSelf}
              isSpotlight={false}
              onToggleSpotlight={() => setSpotlightId(item.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
