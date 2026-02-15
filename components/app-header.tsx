interface AppHeaderProps {
  topic: string;
  mode: "live" | "replay";
  children?: React.ReactNode;
}

export function AppHeader({ topic, mode, children }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-zinc-100">
            ThreadTutor
          </span>
          <span className="text-xs text-zinc-500">
            Socratic learning with AI
          </span>
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
