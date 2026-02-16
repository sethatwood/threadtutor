"use client";

export function SkeletonMessage() {
  const barClass =
    "h-4 rounded bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-border)] to-[var(--color-surface)] bg-[length:200%_100%] animate-shimmer";

  return (
    <div className="space-y-3 py-5">
      <p className="mb-1 text-xs font-medium text-[var(--color-accent-indigo)]">Claude</p>
      <div className={`${barClass} w-3/4`} />
      <div className={`${barClass} w-full`} />
      <div className={`${barClass} w-5/6`} />
      <div className={`${barClass} w-2/3`} />
    </div>
  );
}
