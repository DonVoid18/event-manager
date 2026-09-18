import { Skeleton } from "@/shared/infrastructure/shadcn/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <Skeleton className="h-9 w-full max-w-sm" />

      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center gap-4 border-b bg-muted px-4 py-3">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 w-10" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-14 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
