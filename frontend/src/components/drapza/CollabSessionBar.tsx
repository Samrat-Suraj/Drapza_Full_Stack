"use client";

import React, { useState } from "react";
import { Users, ShoppingBag, Copy, Check, LogOut, MessageSquare, ChevronUp } from "lucide-react";
import { useCollab } from "@/context/CollabContext";
import { audioSystem } from "./AudioSystem";

export const CollabSessionBar: React.FC = () => {
  const {
    roomCode,
    members,
    items,
    unreadCount,
    toggleDrawer,
    leaveRoom,
  } = useCollab();

  const [copied, setCopied] = useState(false);

  if (!roomCode) return null;

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/?collab=${roomCode}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      audioSystem.playClick(900);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside
      aria-label="Active Collaborative Shopping Session"
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 max-w-[calc(100vw-2rem)] sm:max-w-md animate-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#0e0e0e]/95 border border-white/20 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white">
        {/* Live indicator & Room Code */}
        <div className="flex items-center gap-2 pl-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <div className="hidden xs:block">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-200 font-bold block leading-none">
              CO-SHOP
            </span>
            <span className="font-mono text-xs font-bold tracking-wider text-white">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Copy Invite Link */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy session invite link"
          title="Copy invite link to share with friends"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white hover:text-white font-mono text-[11px] font-semibold transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-neutral-300" />}
          <span className="hidden sm:inline">{copied ? "COPIED" : "SHARE"}</span>
        </button>

        {/* Member Avatars */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {members.slice(0, 3).map((m, idx) => (
            <div
              key={idx}
              title={m.name}
              className="w-7 h-7 rounded-full bg-white text-black font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#0e0e0e] shadow-sm uppercase shrink-0"
            >
              {m.name.charAt(0)}
            </div>
          ))}
          {members.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-300 font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#0e0e0e] shrink-0">
              +{members.length - 3}
            </div>
          )}
        </div>

        {/* Open Co-Cart / Drawer Trigger */}
        <button
          type="button"
          onClick={toggleDrawer}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer ml-auto shrink-0"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>CO-CART</span>
          {totalItemCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-black text-white text-[9.5px] font-bold font-mono">
              {totalItemCount}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-black border border-black font-mono text-[9px] font-bold flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Leave Room Button */}
        <button
          type="button"
          onClick={leaveRoom}
          aria-label="Leave co-shopping session"
          title="Leave Session"
          className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

