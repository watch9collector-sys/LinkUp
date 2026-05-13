"use client";

import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0B0F14]/85 backdrop-blur-md transition-opacity duration-200 motion-reduce:transition-none"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex w-full max-w-md flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4 sm:max-h-[min(90dvh,36rem)] sm:p-0 sm:pb-0 sm:pt-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="linkup-modal-panel flex max-h-[min(92dvh,36rem)] flex-col overflow-hidden border-emerald-500/10 p-0 shadow-2xl shadow-black/60 sm:max-h-[min(90dvh,36rem)]">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.07] px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <h2
              id="modal-title"
              className="text-lg font-semibold tracking-tight text-white"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/65 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label="Close"
            >
              <span aria-hidden className="block text-xl leading-none">
                ×
              </span>
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
