import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header skeleton */}
      <Skeleton className="h-8 w-48" />

      {/* Selector skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-11 w-full" />
      </div>

      {/* Details skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-5 h-5 mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl border-2 border-gray-200">
              <div className="text-center space-y-2">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-8 w-10 mx-auto" />
                <Skeleton className="h-3 w-14 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
