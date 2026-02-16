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
    "rounded-full min-h-[36px] px-3 py-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/60 hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4 md:pb-5">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/90 px-2 py-1.5 shadow-lg backdrop-blur-sm md:gap-2 md:px-3">
        <button
          type="button"
          onClick={back}
          disabled={isAtStart}
          className={buttonBase}
        >
          &lsaquo; Back
        </button>

        <button
          type="button"
          onClick={toggleAutoPlay}
          className={`${buttonBase} ${isPlaying ? "text-[var(--color-accent-indigo)]" : ""}`}
        >
          {isPlaying ? "Pause" : "Auto-play"}
        </button>

        <button
          type="button"
          onClick={next}
          disabled={isAtEnd}
          className={buttonBase}
        >
          Next &rsaquo;
        </button>

        <span className="pl-1 pr-1 text-xs tabular-nums text-[var(--color-text-dim)]">
          {currentIndex + 1}/{totalTurns}
        </span>
      </div>
    </div>
  );
}
