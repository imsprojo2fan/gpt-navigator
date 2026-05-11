export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-96 bg-gray-200 rounded mb-8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
