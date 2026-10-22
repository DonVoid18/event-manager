import { cn } from "@/shared/infrastructure/shadcn/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow && (
          <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">{eyebrow}</div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description && <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
