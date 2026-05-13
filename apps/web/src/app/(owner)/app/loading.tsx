export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-md bg-secondary" />
          <div className="h-4 w-56 rounded bg-secondary/60" />
        </div>
        <div className="size-10 rounded-xl bg-secondary" />
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-border bg-card"
          />
        ))}
      </div>

      {/* Animal cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-52 rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
