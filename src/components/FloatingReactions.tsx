import React from "react";
import { StreamReaction } from "../types";

interface FloatingReactionsProps {
  reactions: StreamReaction[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((rx) => (
        <div
          key={rx.id}
          className="absolute bottom-20 text-3xl sm:text-4xl animate-float-up flex flex-col items-center select-none"
          style={{
            left: `${20 + (parseInt(rx.id.slice(-2), 16) % 60)}%`,
          }}
        >
          <span>{rx.emoji}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/70 text-white font-bold backdrop-blur-sm -mt-1"
            style={{ color: rx.senderColor }}
          >
            {rx.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};
