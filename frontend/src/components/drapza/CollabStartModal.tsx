"use client";

import React, { useState, useEffect } from "react";
import { Users, X, ArrowRight, Copy, Check, ShieldCheck } from "lucide-react";
import { useCollab } from "@/context/CollabContext";
import { audioSystem } from "./AudioSystem";

export const CollabStartModal: React.FC = () => {
  const {
    isStartModalOpen,
    closeStartModal,
    createRoom,
    joinRoom,
    pendingInviteCode,
  } = useCollab();

  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (pendingInviteCode) {
      setMode("join");
      setRoomCodeInput(pendingInviteCode);
    }
  }, [pendingInviteCode]);

  if (!isStartModalOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter your name to initiate session");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    audioSystem.playClick(600);

    const res = await createRoom(name.trim());
    setIsLoading(false);
    if (res.success) {
      closeStartModal();
    } else {
      setErrorMessage(res.message || "Failed to create room");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter your name");
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMessage("Please enter a 6-character room code");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    audioSystem.playClick(600);

    const res = await joinRoom(roomCodeInput.trim(), name.trim());
    setIsLoading(false);
    if (res.success) {
      closeStartModal();
    } else {
      setErrorMessage(res.message || "Room not found or expired");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collab-start-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#0e0e0e] text-white rounded-3xl p-6 sm:p-8 border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-400 font-bold block">
                ATELIER NOIR // MULTI-USER SYNC
              </span>
              <h2 id="collab-start-title" className="font-mono text-sm sm:text-base font-bold uppercase text-white tracking-wide">
                Co-Shop With Friends & Family
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={closeStartModal}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(500);
              setMode("create");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              mode === "create" ? "bg-white text-black shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            Start New Session
          </button>
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(500);
              setMode("join");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              mode === "join" ? "bg-white text-black shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            Join Existing
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-300 font-sans leading-relaxed">
          {mode === "create"
            ? "Create a live room code. Share it with your friends or family to collaboratively curate outfits, vote in real-time, and discuss pieces together."
            : "Enter the 6-character room code shared by your friend to jump into their live atelier shopping room."}
        </p>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/20 text-neutral-200 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={mode === "create" ? handleCreate : handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="collab-user-name" className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-300 block">
              Your Name *
            </label>
            <input
              id="collab-user-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Suraj, Priya, Kabir"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white font-sans text-xs focus:outline-none focus:border-white transition-all placeholder:text-neutral-600"
            />
          </div>

          {mode === "join" && (
            <div className="space-y-1.5">
              <label htmlFor="collab-room-code" className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                Room Code *
              </label>
              <input
                id="collab-room-code"
                type="text"
                required
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. DRP-849"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white font-mono uppercase text-xs tracking-widest focus:outline-none focus:border-white transition-all placeholder:text-neutral-600"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <span>{isLoading ? "CONNECTING..." : mode === "create" ? "INITIALIZE ROOM" : "ENTER ROOM"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-white" />
            <span>SOCKET.IO ENCRYPTED</span>
          </span>
          <span>ROOMS EXPIRE IN 24H</span>
        </div>
      </div>
    </div>
  );
};

