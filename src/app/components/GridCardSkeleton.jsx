// src/app/components/GridCardSkeleton.jsx
export default function GridCardSkeleton({ small = false }) {
  const paddingClass = small ? "p-3" : "p-4 md:p-5"; // Adjusted for potentially smaller cards in rows
  const titleHeight = small ? "h-4" : "h-5";
  const textHeight = "h-3";

  return (
    <div
      className={`animate-pulse rounded-xl bg-card shadow-md overflow-hidden border border-transparent ${
        small ? "w-[140px] xs:w-[150px] sm:w-[160px] md:w-[170px]" : ""
      }`}
    >
      <div className="aspect-[2/3] w-full bg-muted shimmer"></div>{" "}
      {/* Image Placeholder */}
      <div className={paddingClass}>
        <div
          className={`${titleHeight} bg-muted shimmer rounded w-3/4 mb-2`}
        ></div>{" "}
        {/* Title Placeholder */}
        <div className="flex items-center justify-between mb-3">
          <div className={`${textHeight} bg-muted shimmer rounded w-1/4`}></div>{" "}
          {/* Year Placeholder */}
          <div
            className={`${textHeight} bg-muted shimmer rounded w-1/5 py-1 px-2`}
          ></div>{" "}
          {/* Rating Placeholder */}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <div
            className={`${textHeight} bg-muted shimmer rounded-full w-1/3 px-2 py-0.5`}
          ></div>{" "}
          {/* Genre Placeholder */}
          <div
            className={`${textHeight} bg-muted shimmer rounded-full w-1/4 px-2 py-0.5`}
          ></div>{" "}
          {/* Genre Placeholder */}
        </div>
      </div>
    </div>
  );
}
