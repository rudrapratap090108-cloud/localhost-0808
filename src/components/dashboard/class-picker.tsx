import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyClasses } from "@/lib/school.functions";
import { EmptyState, SkeletonRows } from "./ui";

export function ClassPicker({
  value,
  onChange,
  children,
}: {
  value: string | null;
  onChange: (id: string) => void;
  children: (classId: string) => React.ReactNode;
}) {
  const listMyClassesFn = useServerFn(listMyClasses);
  const myClasses = useQuery({
    queryKey: ["my-classes"],
    queryFn: () => listMyClassesFn(),
  });

  useEffect(() => {
    if (!value && myClasses.data && myClasses.data.length > 0) {
      onChange(myClasses.data[0].id);
    }
  }, [myClasses.data, value, onChange]);

  if (myClasses.isLoading) return <SkeletonRows />;
  const classes = myClasses.data ?? [];
  if (classes.length === 0) {
    return (
      <EmptyState
        emoji="🏫"
        label="No classes assigned yet. Ask an admin to assign a class to you."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold border transition ${
              value === c.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-cream"
            }`}
          >
            🏫 {c.name}
          </button>
        ))}
      </div>
      {value && children(value)}
    </div>
  );
}

export function useClassPickerState() {
  return useState<string | null>(null);
}
