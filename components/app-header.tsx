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
    <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <LogoMark />
          <div className="flex flex-col">
            <span className="text-base font-semibold text-zinc-100">
              ThreadTutor
            </span>
            <span className="text-xs text-zinc-500">
              Socratic learning with AI
            </span>
          </div>
        </div>
        <span className="text-zinc-600">/</span>
        <span className="text-sm text-zinc-400">{topic}</span>
      </div>

      <div className="flex items-center gap-2">
        {mode === "replay" ? (
          <span className="rounded-full border border-indigo-500/30 px-2.5 py-0.5 text-xs text-indigo-400">
            Replay
          </span>
        ) : (
          <span className="rounded-full border border-emerald-500/30 px-2.5 py-0.5 text-xs text-emerald-400">
            Live
          </span>
        )}
        {children}
      </div>
    </header>
  );
}
