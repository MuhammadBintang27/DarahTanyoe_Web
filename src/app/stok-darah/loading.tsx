import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header skeleton */}
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80" />

      {/* Stock cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="relative border-2 rounded-xl p-6 bg-white">
            <Skeleton className="absolute top-3 right-3 h-5 w-16 rounded-full" />
            <div className="text-center mb-4 space-y-2">
              <Skeleton className="mx-auto h-8 w-8" />
              <Skeleton className="mx-auto h-6 w-12" />
            </div>
            <div className="text-center mb-4 space-y-2">
              <Skeleton className="mx-auto h-8 w-14" />
              <Skeleton className="mx-auto h-3 w-16" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-10" />
              <Skeleton className="flex-1 h-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Legend skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <Skeleton className="h-5 w-52 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
