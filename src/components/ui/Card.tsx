"use client";

import { createContext } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated";

const CardVariantContext = createContext<CardVariant>("default");

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
}

export function Card({ children, className, variant = "default" }: CardProps) {
  return (
    <CardVariantContext.Provider value={variant}>
      <div
        className={cn(
          "hv-card rounded-xl",
          variant === "elevated" && "bg-[var(--hv-surface-elevated)]",
          className
        )}
      >
        {children}
      </div>
    </CardVariantContext.Provider>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("hv-card-header px-5 py-4", className)}>{children}</div>;
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-sm font-semibold text-[var(--hv-foreground)]", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-1 text-xs text-[var(--hv-foreground-muted)]", className)}>{children}</p>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
