// Svoi — Global loading state (shown during navigation)
export default function GlobalLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
