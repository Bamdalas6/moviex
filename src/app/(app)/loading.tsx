export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pt-6 md:px-8 md:pt-10">
      <div className="mx-auto h-14 w-full max-w-2xl shimmer rounded-full" />
      <div className="h-7 w-48 shimmer rounded-lg" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-[2/3] shimmer rounded-2xl" />
            <div className="h-4 w-3/4 shimmer rounded" />
            <div className="h-4 w-1/2 shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
