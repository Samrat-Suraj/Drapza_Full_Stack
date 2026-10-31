"use client";

import React, { useState } from "react";
import { X, Users, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { audioSystem } from "./AudioSystem";

export const JoinSharedBagModal: React.FC = () => {
  const {
    pendingInviteCode,
    setPendingInviteCode,
    incomingHostName,
    joinSharedBag,
  } = useCart();

  const [guestName, setGuestName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!pendingInviteCode) return null;

  const hostDisplay = incomingHostName ? incomingHostName.trim() : "Your friend";

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMsg("Please enter your name to join.");
      return;
    }

    setIsJoining(true);
    setErrorMsg("");
    audioSystem.playClick(850);

    const res = await joinSharedBag(pendingInviteCode, guestName.trim());
    setIsJoining(false);

    if (!res.success) {
      setErrorMsg(res.message || "Failed to connect to shared bag.");
    }
  };

  const handleDismiss = () => {
    audioSystem.playClick(400);
    setPendingInviteCode(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-bag-title"
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#0e0e0e] text-white rounded-3xl p-6 sm:p-8 border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-bold shrink-0 shadow-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-300 font-bold block flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                INVITATION // LIVE ATELIER BAG
              </span>
              <h2
                id="join-bag-title"
                className="font-mono text-sm sm:text-base font-bold uppercase text-white tracking-wide mt-0.5"
              >
                Join Shared Bag
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss invitation"
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Host Banner */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-300" />
            <span className="font-mono text-xs text-neutral-300 uppercase tracking-wider">
              ROOM CODE: <span className="text-white font-bold">{pendingInviteCode}</span>
            </span>
          </div>
          <p className="font-display text-base sm:text-lg uppercase text-white tracking-wide">
            <span className="text-white underline decoration-white decoration-2 underline-offset-4">
              {hostDisplay}
            </span>{" "}
            shared their Atelier Bag with you!
          </p>
          <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
            Enter your name to join. Once connected, any garment you add to bag will directly sync into {hostDisplay}&apos;s bag in real-time.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="guest-name-input"
              className="block font-mono text-xs uppercase tracking-wider text-neutral-300 font-bold"
            >
              Who is opening this bag?
            </label>
            <input
              id="guest-name-input"
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your name (e.g. Rahul, Priya)..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white font-sans text-sm focus:outline-none focus:border-white placeholder:text-neutral-500 transition-colors"
              autoFocus
            />
            {errorMsg && (
              <p className="font-mono text-xs text-neutral-200 border border-white/20 bg-white/5 p-2 rounded-lg pt-0.5">{errorMsg}</p>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isJoining || !guestName.trim()}
              className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg"
            >
              <span>{isJoining ? "CONNECTING TO BAG..." : "JOIN BAG & START BROWSING"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl font-mono text-xs uppercase text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              BROWSE ALONE INSTEAD
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

