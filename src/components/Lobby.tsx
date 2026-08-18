import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Tv, 
  Lock, 
  ShieldCheck, 
  Users, 
  Radio, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  KeyRound, 
  MonitorPlay,
  Volume2,
  HelpCircle
} from "lucide-react";
import { PublicRoomSummary } from "../types";

interface LobbyProps {
  userName: string;
  setUserName: (name: string) => void;
  avatarColor: string;
  setAvatarColor: (color: string) => void;
  publicRooms: PublicRoomSummary[];
  onRefreshRooms: () => void;
  onCreateRoom: (data: { name: string; isPrivate: boolean; password?: string; roomId?: string }) => void;
  onJoinRoom: (roomId: string, password?: string) => void;
  isJoining: boolean;
  errorMessage: string | null;
  clearError: () => void;
}

const AVATAR_COLORS = [
  "#5865F2", // Discord Blurple
  "#57F287", // Green
  "#FEE75C", // Yellow
  "#EB459E", // Fuchsia
  "#ED4245", // Red
  "#3BA55D", // Dark Green
  "#1ABC9C", // Turquoise
  "#E67E22", // Orange
];

export const Lobby: React.FC<LobbyProps> = ({
  userName,
  setUserName,
  avatarColor,
  setAvatarColor,
  publicRooms,
  onRefreshRooms,
  onCreateRoom,
  onJoinRoom,
  isJoining,
  errorMessage,
  clearError,
}) => {
  const [activeTab, setActiveTab] = useState<"browse" | "create" | "join">("browse");
  
  // Create room state
  const [newRoomName, setNewRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [customRoomId, setCustomRoomId] = useState("");

  // Join room state
  const [joinRoomIdInput, setJoinRoomIdInput] = useState("");
  const [joinPasswordInput, setJoinPasswordInput] = useState("");
  const [requiresPasswordForRoom, setRequiresPasswordForRoom] = useState(false);

  // Screen share capability test
  const [hasScreenShareApi, setHasScreenShareApi] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getDisplayMedia) {
      setHasScreenShareApi(false);
    }
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    onCreateRoom({
      name: newRoomName.trim() || `Sala de ${userName.trim()}`,
      isPrivate,
      password: isPrivate ? roomPassword : undefined,
      roomId: customRoomId.trim() ? customRoomId.trim().toUpperCase() : undefined,
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomIdInput.trim() || !userName.trim()) return;
    onJoinRoom(joinRoomIdInput.trim().toUpperCase(), joinPasswordInput || undefined);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto bg-[#313338]">
      <div className="w-full max-w-4xl space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] text-xs font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Transmissão WebRTC P2P em Alta Resolução
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Transmita sua tela com amigos
          </h1>
          <p className="text-sm sm:text-base text-[#949ba4] max-w-xl mx-auto">
            Compartilhe telas em tempo real estilo Discord. Suporte a múltiplas transmissões simultâneas, áudio do sistema, qualidade adaptativa e salas seguras.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between animate-fadeIn">
            <span>{errorMessage}</span>
            <button
              onClick={clearError}
              className="text-xs text-rose-400 hover:text-white underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Profile Card & Customizer */}
        <div className="bg-[#2b2d31] border border-[#1e1f22] rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md transition-all shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {userName.trim() ? userName.trim().charAt(0).toUpperCase() : "U"}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
                  Seu Apelido
                </label>
                <input
                  id="input-user-name"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Jordan Gamer"
                  maxLength={24}
                  className="w-full bg-[#1e1f22] text-white px-3.5 py-2 rounded-xl text-sm border border-[#35373c] focus:outline-none focus:border-[#5865F2] font-medium"
                />
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#949ba4] uppercase tracking-wider block">
                Cor do Avatar
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                      avatarColor === color ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#2b2d31]" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {avatarColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-black/20 pb-3">
          <button
            id="tab-browse"
            onClick={() => { setActiveTab("browse"); onRefreshRooms(); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "browse"
                ? "bg-[#5865f2] text-white shadow-md shadow-[#5865f2]/20"
                : "text-[#949ba4] hover:text-white hover:bg-[#2b2d31]"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Salas Públicas ({publicRooms.length})</span>
          </button>

          <button
            id="tab-create"
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "create"
                ? "bg-[#5865f2] text-white shadow-md shadow-[#5865f2]/20"
                : "text-[#949ba4] hover:text-white hover:bg-[#2b2d31]"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Nova Sala</span>
          </button>

          <button
            id="tab-join"
            onClick={() => setActiveTab("join")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "join"
                ? "bg-[#5865f2] text-white shadow-md shadow-[#5865f2]/20"
                : "text-[#949ba4] hover:text-white hover:bg-[#2b2d31]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Entrar com Código</span>
          </button>
        </div>

        {/* Tab 1: Browse Public Rooms */}
        {activeTab === "browse" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#949ba4] font-bold uppercase tracking-wider">
                Salas ativas agora
              </span>
              <button
                id="btn-refresh-rooms"
                onClick={onRefreshRooms}
                className="flex items-center gap-1.5 text-xs text-[#5865f2] hover:text-[#7289da] font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar</span>
              </button>
            </div>

            {publicRooms.length === 0 ? (
              <div className="bg-[#2b2d31] border border-black/20 rounded-xl p-8 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#1e1f22] text-[#949ba4] border border-white/5 flex items-center justify-center mx-auto">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Nenhuma sala pública aberta</h3>
                  <p className="text-xs text-[#949ba4] max-w-sm mx-auto">
                    Seja o primeiro a iniciar uma transmissão! Crie uma sala e compartilhe o código com amigos.
                  </p>
                </div>
                <button
                  id="btn-create-first-room"
                  onClick={() => setActiveTab("create")}
                  className="px-4 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Criar Primeira Sala
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {publicRooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-[#2b2d31] hover:bg-[#35373c] border border-black/20 hover:border-[#5865f2]/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-white font-bold text-sm group-hover:text-[#5865f2] transition-colors flex items-center gap-2">
                            {room.name}
                          </h3>
                          <p className="text-xs text-[#949ba4]">
                            Host: <strong className="text-gray-300">{room.hostName}</strong>
                          </p>
                        </div>

                        {room.isPrivate ? (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase shrink-0">
                            <Lock className="w-2.5 h-2.5" /> Senha
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold uppercase shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5" /> Pública
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[#949ba4] font-medium pt-1">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {room.participantCount} membro{room.participantCount !== 1 ? "s" : ""}
                        </span>

                        {room.streamerCount > 0 ? (
                          <span className="flex items-center gap-1.5 text-red-400 font-bold uppercase text-[10px]">
                            <Radio className="w-3 h-3 animate-pulse" />
                            {room.streamerCount} live
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">Sem live ativa</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-black/20 mt-3">
                      <span className="text-[11px] font-mono text-[#949ba4]">ID: {room.id}</span>
                      <button
                        onClick={() => {
                          if (room.isPrivate) {
                            setJoinRoomIdInput(room.id);
                            setRequiresPasswordForRoom(true);
                            setActiveTab("join");
                          } else {
                            onJoinRoom(room.id);
                          }
                        }}
                        disabled={isJoining}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <span>Entrar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Room */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateSubmit} className="bg-[#2b2d31] border border-black/20 rounded-xl p-6 space-y-5 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Criar Nova Sala de Transmissão</h2>
              <p className="text-xs text-[#949ba4]">
                Configure sua sala para compartilhar tela com áudio cristalino e amigos.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
                  Nome da Sala
                </label>
                <input
                  id="input-create-room-name"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={`Sala de ${userName || "Transmissão"}`}
                  maxLength={40}
                  className="w-full bg-[#1e1f22] text-white px-3.5 py-2 rounded text-xs border border-white/5 focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#949ba4] uppercase tracking-wider flex items-center justify-between">
                  <span>Código Personalizado (Opcional)</span>
                  <span className="text-[10px] text-gray-500">Deixe em branco para gerar automático</span>
                </label>
                <input
                  id="input-create-custom-id"
                  type="text"
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
                  placeholder="EX: DEV-STREAM"
                  maxLength={12}
                  className="w-full bg-[#1e1f22] text-white font-mono px-3.5 py-2 rounded text-xs border border-white/5 focus:outline-none focus:border-[#5865f2] uppercase"
                />
              </div>

              {/* Password toggle */}
              <div className="pt-2 border-t border-black/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase text-white flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Proteger Sala com Senha
                    </span>
                    <p className="text-[11px] text-[#949ba4]">
                      Apenas usuários com a senha correta poderão ingressar
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="toggle-private-room"
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#1e1f22] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5865f2]"></div>
                  </label>
                </div>

                {isPrivate && (
                  <div className="pt-2 animate-fadeIn space-y-1.5">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Senha de Acesso à Sala
                    </label>
                    <input
                      id="input-create-room-password"
                      type="password"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      placeholder="Digite uma senha..."
                      required={isPrivate}
                      className="w-full bg-[#1e1f22] text-white px-3.5 py-2 rounded text-xs border border-amber-500/40 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-black/20">
              <button
                type="button"
                onClick={() => setActiveTab("browse")}
                className="px-4 py-2 rounded text-xs font-semibold text-[#949ba4] hover:text-white hover:bg-[#1e1f22] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-submit-create-room"
                type="submit"
                disabled={isJoining || (isPrivate && !roomPassword.trim())}
                className="px-5 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-[#5865f2]/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isJoining ? "Criando..." : "Criar e Iniciar Sala"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Join by Code */}
        {activeTab === "join" && (
          <form onSubmit={handleJoinSubmit} className="bg-[#2b2d31] border border-black/20 rounded-xl p-6 space-y-5 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Entrar em uma Sala</h2>
              <p className="text-xs text-[#949ba4]">
                Insira o ID ou código da sala gerado pelo anfitrião.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
                  ID ou Código da Sala
                </label>
                <input
                  id="input-join-room-id"
                  type="text"
                  value={joinRoomIdInput}
                  onChange={(e) => setJoinRoomIdInput(e.target.value.toUpperCase())}
                  placeholder="EX: 4K9F2L"
                  required
                  maxLength={20}
                  className="w-full bg-[#1e1f22] text-white font-mono text-sm px-3.5 py-2 rounded border border-white/5 focus:outline-none focus:border-[#5865f2] uppercase tracking-wider"
                />
              </div>

              {(requiresPasswordForRoom || joinPasswordInput) && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Senha da Sala
                  </label>
                  <input
                    id="input-join-room-password"
                    type="password"
                    value={joinPasswordInput}
                    onChange={(e) => setJoinPasswordInput(e.target.value)}
                    placeholder="Digite a senha da sala..."
                    className="w-full bg-[#1e1f22] text-white px-3.5 py-2 rounded text-xs border border-amber-500/40 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-black/20">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("browse");
                  setRequiresPasswordForRoom(false);
                  setJoinPasswordInput("");
                }}
                className="px-4 py-2 rounded text-xs font-semibold text-[#949ba4] hover:text-white hover:bg-[#1e1f22] transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                id="btn-submit-join-room"
                type="submit"
                disabled={isJoining || !joinRoomIdInput.trim()}
                className="px-5 py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-[#5865f2]/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>{isJoining ? "Conectando..." : "Ingressar na Sala"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[#949ba4] text-xs">
          <div className="bg-[#2b2d31]/50 border border-[#1e1f22] rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-semibold">Multi-Stream</p>
              <p className="text-[11px]">Várias telas ao vivo simultâneas</p>
            </div>
          </div>

          <div className="bg-[#2b2d31]/50 border border-[#1e1f22] rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-semibold">Áudio de Sistema</p>
              <p className="text-[11px]">Transmita jogos e vídeos com som</p>
            </div>
          </div>

          <div className="bg-[#2b2d31]/50 border border-[#1e1f22] rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-semibold">Salas Seguras</p>
              <p className="text-[11px]">Proteção por senha criptografada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
