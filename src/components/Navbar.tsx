import React from "react";
import { 
  Tv, 
  Users, 
  MessageSquare, 
  Share2, 
  LogOut, 
  ShieldCheck, 
  Lock, 
  Radio, 
  Activity,
  LayoutGrid,
  Maximize2
} from "lucide-react";
import { RoomMeta, Participant, LayoutMode } from "../types";

interface NavbarProps {
  room: RoomMeta | null;
  self: Participant | null;
  participants: Participant[];
  streamersCount: number;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isParticipantsOpen: boolean;
  setIsParticipantsOpen: (open: boolean) => void;
  onOpenShare: () => void;
  onLeaveRoom: () => void;
  pingMs?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  room,
  self,
  participants,
  streamersCount,
  layoutMode,
  setLayoutMode,
  isChatOpen,
  setIsChatOpen,
  isParticipantsOpen,
  setIsParticipantsOpen,
  onOpenShare,
  onLeaveRoom,
  pingMs = 24,
}) => {
  if (!room) {
    return (
      <header className="h-12 bg-[#1e1f22] border-b border-black/20 flex items-center justify-between px-4 sm:px-6 shadow-lg select-none shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-[#5865f2] p-1.5 rounded-lg shadow-sm flex items-center justify-center">
            <Tv className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
              ScreenShare <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#5865F2] text-white">Live</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-[#949ba4]">
          <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-semibold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            WEBRTC ACTIVE • P2P MULTI-STREAM
          </span>
        </div>
      </header>
    );
  }

  const totalMembers = participants.length + (self ? 1 : 0);

  return (
    <header className="h-12 bg-[#1e1f22] border-b border-black/20 flex items-center justify-between px-4 sm:px-6 shadow-lg select-none shrink-0 z-20">
      {/* Left: Room Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="bg-[#5865f2] p-1.5 rounded-lg shadow-sm flex items-center justify-center shrink-0">
          <Tv className="w-4 h-4 text-white" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#949ba4] truncate">
              Room ID: <span className="text-white font-mono">{room.id}</span>
            </span>
            {room.isPrivate ? (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
                <Lock className="w-2.5 h-2.5" /> Senha
              </span>
            ) : null}
          </div>
          <span className="text-[10px] text-green-400 font-semibold tracking-wide flex items-center gap-1.5">
            <span>●</span>
            <span className="uppercase">{room.isPrivate ? "Privada" : "Pública"}</span>
            <span>•</span>
            <span>{totalMembers} Participante{totalMembers !== 1 ? "s" : ""}</span>
            <span className="text-[#949ba4] hidden sm:inline">• {pingMs}ms</span>
          </span>
        </div>
      </div>

      {/* Center: Live indicator & Layout Selector */}
      <div className="hidden md:flex items-center space-x-1.5 bg-[#2b2d31] p-1 rounded-lg border border-white/5">
        {streamersCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 border border-red-500/30 rounded text-red-400 text-[10px] font-bold uppercase mr-1">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>{streamersCount} Live</span>
          </div>
        )}

        <button
          id="btn-layout-grid"
          onClick={() => setLayoutMode("grid")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
            layoutMode === "grid"
              ? "bg-[#35373c] text-white shadow-sm"
              : "text-[#949ba4] hover:text-white hover:bg-[#35373c]/50"
          }`}
          title="Grade Flexível"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Grade</span>
        </button>

        <button
          id="btn-layout-spotlight"
          onClick={() => setLayoutMode("spotlight")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
            layoutMode === "spotlight"
              ? "bg-[#35373c] text-white shadow-sm"
              : "text-[#949ba4] hover:text-white hover:bg-[#35373c]/50"
          }`}
          title="Modo Destaque"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Destaque</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          id="btn-share-room"
          onClick={onOpenShare}
          className="bg-[#2b2d31] hover:bg-[#35373c] px-3 py-1.5 rounded text-xs font-medium border border-white/5 text-[#dbdee1] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
          title="Convidar amigos"
        >
          <Share2 className="w-3.5 h-3.5 text-[#5865f2]" />
          <span className="hidden sm:inline">Convidar</span>
        </button>

        <button
          id="btn-toggle-members"
          onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
          className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
            isParticipantsOpen
              ? "bg-[#5865f2] text-white border-[#5865f2]"
              : "bg-[#2b2d31] text-[#dbdee1] hover:text-white border-white/5 hover:bg-[#35373c]"
          }`}
          title="Participantes"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{totalMembers}</span>
        </button>

        <button
          id="btn-toggle-chat"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded text-xs font-medium border transition-all cursor-pointer ${
            isChatOpen
              ? "bg-[#5865f2] text-white border-[#5865f2]"
              : "bg-[#2b2d31] text-[#dbdee1] hover:text-white border-white/5 hover:bg-[#35373c]"
          }`}
          title="Chat da sala"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-leave-room-nav"
          onClick={onLeaveRoom}
          className="bg-red-500/10 hover:bg-[#da373c] text-red-400 hover:text-white px-3 py-1.5 rounded text-xs font-medium border border-red-500/20 hover:border-[#da373c] flex items-center gap-1.5 transition-all cursor-pointer"
          title="Sair da Sala"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
};
