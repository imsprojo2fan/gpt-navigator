export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
      <div className="h-16 bg-gray-100 rounded-xl mb-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
