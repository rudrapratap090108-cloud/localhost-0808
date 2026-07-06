import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listUsers, assignRole } from "@/lib/school.functions";
import { Section, SkeletonRows } from "./ui";
import type { Role } from "./me";

export function UsersSection() {
  const qc = useQueryClient();
  const listUsersFn = useServerFn(listUsers);
  const assignFn = useServerFn(assignRole);
  const users = useQuery({ queryKey: ["users"], queryFn: () => listUsersFn() });

  const toggleRole = useMutation({
    mutationFn: (v: { user_id: string; role: Role; action: "add" | "remove" }) =>
      assignFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Section title="Users & roles" subtitle="Grant admin, teacher or parent access">
      {users.isLoading ? (
        <SkeletonRows />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Roles</th>
                <th className="p-3">Grant / revoke</th>
              </tr>
            </thead>
            <tbody>
              {(users.data ?? []).map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-semibold">{u.full_name ?? "—"}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 flex flex-wrap gap-1">
                    {u.roles.length === 0 && (
                      <span className="text-muted-foreground text-xs">none</span>
                    )}
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold"
                      >
                        {r}
                      </span>
                    ))}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(["admin", "teacher", "parent"] as Role[]).map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() =>
                              toggleRole.mutate({
                                user_id: u.id,
                                role: r,
                                action: has ? "remove" : "add",
                              })
                            }
                            className={`rounded-full px-2.5 py-1 text-xs font-bold border transition ${
                              has
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:bg-cream"
                            }`}
                          >
                            {has ? "✓ " : "+ "}
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
