import React from "react";
import { 
  Users, 
  Radio, 
  Mic, 
  MicOff, 
  ShieldCheck, 
  Crown, 
  X,
  Volume2
} from "lucide-react";
import { Participant, RoomMeta } from "../types";

interface ParticipantsSidebarProps {
  room: RoomMeta;
  self: Participant | null;
  participants: Participant[];
  streamersCount: number;
  onClose: () => void;
}

export const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({
  room,
  self,
  participants,
  streamersCount,
  onClose,
}) => {
  const allUsers: Participant[] = [];
  if (self) allUsers.push(self);
  participants.forEach((p) => {
    if (!allUsers.find((u) => u.socketId === p.socketId)) {
      allUsers.push(p);
    }
  });

  const streamers = allUsers.filter((u) => u.isStreaming);
  const viewers = allUsers.filter((u) => !u.isStreaming);

  return (
    <aside className="w-64 bg-[#2b2d31] border-l border-black/20 flex flex-col h-full z-20 shrink-0 select-none">
      {/* Header */}
      <div className="h-12 px-4 border-b border-black/20 flex items-center justify-between shrink-0 bg-[#2b2d31]">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-[#949ba4]" />
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">
            Participantes — {allUsers.length}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#949ba4] hover:text-white rounded hover:bg-[#35373c] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-4">
        {/* Streamers Group */}
        {streamers.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#949ba4] px-2 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-red-400 animate-pulse" />
              Transmitindo ({streamers.length})
            </span>
            <div className="space-y-0.5">
              {streamers.map((user) => {
                const isMe = self && user.socketId === self.socketId;
                const isHost = user.socketId === room.hostId;

                return (
                  <div
                    key={user.socketId}
                    className="flex items-center justify-between p-2 rounded hover:bg-[#35373c]/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 relative shadow-sm"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.userName.charAt(0).toUpperCase()}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#2b2d31]"></span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium text-white truncate max-w-[100px]">
                            {user.userName}
                          </p>
                          {isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Anfitrião" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1 py-0.2 rounded uppercase tracking-wider">
                            LIVE
                          </span>
                          {isMe && <span className="text-[10px] text-[#949ba4]">(Você)</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-[#949ba4]">
                      {user.isMicMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-green-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Viewers Group */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#949ba4] px-2 block">
            Membros — {viewers.length}
          </span>
          <div className="space-y-0.5">
            {viewers.map((user) => {
              const isMe = self && user.socketId === self.socketId;
              const isHost = user.socketId === room.hostId;

              return (
                <div
                  key={user.socketId}
                  className="flex items-center justify-between p-2 rounded hover:bg-[#35373c]/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.userName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-[#dbdee1] truncate max-w-[110px]">
                          {user.userName}
                        </p>
                        {isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Anfitrião" />}
                      </div>
                      {isMe && <p className="text-[10px] text-[#5865f2] font-semibold">Você</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-[#949ba4]">
                    {user.isMicMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-[#949ba4]/50" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-green-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
