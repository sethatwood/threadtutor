"use client";

export function SkeletonMessage() {
  const barClass =
    "h-4 rounded bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer";

  return (
    <div className="space-y-3 py-5">
      <p className="mb-1 text-xs font-medium text-indigo-400">Claude</p>
      <div className={`${barClass} w-3/4`} />
      <div className={`${barClass} w-full`} />
      <div className={`${barClass} w-5/6`} />
      <div className={`${barClass} w-2/3`} />
    </div>
  );
}
