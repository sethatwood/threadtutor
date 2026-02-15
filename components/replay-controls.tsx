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
    "rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="border-t border-zinc-800 px-6 py-3 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={back}
        disabled={isAtStart}
        className={buttonBase}
      >
        Back
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
        Next
      </button>

      <span className="text-sm text-zinc-400">
        {currentIndex + 1} / {totalTurns}
      </span>
    </div>
  );
}
