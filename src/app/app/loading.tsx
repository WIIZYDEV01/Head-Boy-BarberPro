export default function AppLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}
