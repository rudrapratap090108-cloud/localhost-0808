import type React from "react";

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-xl font-display font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function Card({
  title,
  emoji,
  children,
  className = "",
}: {
  title: string;
  emoji?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card rounded-3xl border border-border p-5 shadow-sm ${className}`}>
      <h3 className="font-display font-bold text-lg mb-3">
        {emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h3>
      {children}
    </div>
  );
}

export function EmptyState({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
      <div className="text-3xl mb-2">{emoji}</div>
      {label}
    </div>
  );
}

export function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 rounded-xl bg-cream animate-pulse" />
      ))}
    </div>
  );
}

export function FullscreenLoader() {
  return (
    <div className="min-h-screen bg-cream grid place-items-center">
      <div className="text-muted-foreground text-sm">Loading your dashboard…</div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-cream grid place-items-center px-4">
      <div className="max-w-md text-center bg-card rounded-3xl border border-border p-8">
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="rounded-full bg-primary text-primary-foreground font-bold px-4 py-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-sunshine text-sunshine-foreground",
    contacted: "bg-primary text-primary-foreground",
    enrolled: "bg-leaf text-leaf-foreground",
    declined: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

export function AccessDenied({ message }: { message?: string }) {
  return (
    <EmptyState emoji="🔒" label={message ?? "You don't have access to this page."} />
  );
}
