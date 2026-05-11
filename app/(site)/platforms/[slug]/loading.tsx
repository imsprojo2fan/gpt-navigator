export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4">
            <div className="h-16 w-16 bg-gray-200 rounded-xl" />
            <div className="flex-1">
              <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 rounded" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-20 w-24 bg-gray-100 rounded-lg" />
            <div className="h-20 w-24 bg-gray-100 rounded-lg" />
            <div className="h-20 w-24 bg-gray-100 rounded-lg" />
          </div>
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
