"use client";

interface ReplayControlsProps {
  currentIndex: number;
  totalTurns: number;
  isPlaying: boolean;
  isAtStart: boolean;
  isAtEnd: boolean;
  next: () => void;
  back: () => void;
  toggleAutoPlay: () => void;
}

/**
 * Horizontal toolbar for replay navigation.
 *
 * Provides Back, Auto-play/Pause, and Next buttons with a progress indicator.
 * Auto-play button highlights in indigo when active.
 */
export function ReplayControls({
  currentIndex,
  totalTurns,
  isPlaying,
  isAtStart,
  isAtEnd,
  next,
  back,
  toggleAutoPlay,
}: ReplayControlsProps) {
  const buttonBase =
    "rounded-full min-h-[36px] px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4 md:pb-5">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/90 px-2 py-1.5 shadow-lg backdrop-blur-sm md:gap-2 md:px-3">
        <button
          type="button"
          onClick={back}
          disabled={isAtStart}
          className={buttonBase}
        >
          ‹ Back
        </button>

        <button
          type="button"
          onClick={toggleAutoPlay}
          className={`${buttonBase} ${isPlaying ? "text-indigo-400" : ""}`}
        >
          {isPlaying ? "Pause" : "Auto-play"}
        </button>

        <button
          type="button"
          onClick={next}
          disabled={isAtEnd}
          className={buttonBase}
        >
          Next ›
        </button>

        <span className="pl-1 pr-1 text-xs tabular-nums text-zinc-500">
          {currentIndex + 1}/{totalTurns}
        </span>
      </div>
    </div>
  );
}
