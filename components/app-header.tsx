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
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 md:px-6 md:py-3">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2">
          <LogoMark />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-100 md:text-base">
              ThreadTutor
            </span>
            <span className="hidden text-xs text-zinc-500 md:block">
              Socratic learning with AI
            </span>
          </div>
        </div>
        <span className="hidden text-zinc-600 md:inline">/</span>
        <span className="hidden text-sm text-zinc-400 md:inline">{topic}</span>
      </div>

      <div className="flex items-center gap-2">
        {mode === "replay" ? (
          <span className="rounded-full border border-indigo-500/30 px-2.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-widest text-indigo-400">
            Replay
          </span>
        ) : (
          <span className="rounded-full border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-widest text-emerald-400">
            Live
          </span>
        )}
        {children}
      </div>
    </header>
  );
}
