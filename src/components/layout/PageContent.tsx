import { cn } from "@/lib/utils";

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

/** Área de scroll principal de cada módulo — respeta el tema global. */
export function PageContent({ children, className }: PageContentProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto bg-[var(--hv-background)] px-6 py-6 lg:px-8 lg:py-8",
        className
      )}
    >
      {children}
    </div>
  );
}
