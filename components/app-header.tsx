"use client";

import { useTheme } from "@/lib/theme";

function LogoMark() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M164 128 L336 256 L164 384"
        stroke="#6366f1"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      <circle cx="164" cy="128" r="68" fill="#a5b4fc"/>
      <circle cx="336" cy="256" r="58" fill="#818cf8"/>
      <circle cx="164" cy="384" r="52" fill="#34d399"/>
    </svg>
  );
}

interface AppHeaderProps {
  topic: string;
  mode: "live" | "replay";
  children?: React.ReactNode;
}

export function AppHeader({ topic, mode, children }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2 md:px-6 md:py-3">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2">
          <LogoMark />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--color-text)] md:text-base">
              ThreadTutor
            </span>
            <span className="hidden text-xs text-[var(--color-text-dim)] md:block">
              Socratic learning with AI
            </span>
          </div>
        </div>
        <span className="hidden text-[var(--color-text-dim)] md:inline">/</span>
        <span className="hidden text-sm text-[var(--color-text-muted)] md:inline">{topic}</span>
      </div>

      <div className="flex items-center gap-2">
        {mode === "replay" ? (
          <span className="rounded-full border border-[var(--color-accent-indigo)]/30 px-2.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-widest text-[var(--color-accent-indigo)]">
            Replay
          </span>
        ) : (
          <span className="rounded-full border border-[var(--color-accent-emerald)]/30 px-2.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-widest text-[var(--color-accent-emerald)]">
            Live
          </span>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-all duration-150"
        >
          {theme === "dark" ? (
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        {children}
      </div>
    </header>
  );
}
