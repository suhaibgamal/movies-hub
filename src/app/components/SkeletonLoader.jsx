// app/components/SkeletonLoader.jsx
export default function SkeletonLoader() {
  return (
    <div className="animate-pulse rounded-xl bg-card p-4">
      <div className="flex flex-col lg:flex-row">
        <div className="aspect-[2/3] w-full bg-muted lg:w-1/3" />
        <div className="flex-1 p-8 space-y-4">
          <div className="h-8 w-3/4 rounded bg-muted shimmer" />
          <div className="h-6 w-1/2 rounded bg-muted shimmer" />
          <div className="space-y-2">
            <div className="h-4 rounded bg-muted shimmer" />
            <div className="h-4 w-5/6 rounded bg-muted shimmer" />
            <div className="h-4 w-2/3 rounded bg-muted shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
