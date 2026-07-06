import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listLeads, updateLeadStatus } from "@/lib/school.functions";
import { Section, SkeletonRows, EmptyState, StatusPill } from "./ui";

export function LeadsSection() {
  const qc = useQueryClient();
  const listLeadsFn = useServerFn(listLeads);
  const updateFn = useServerFn(updateLeadStatus);
  const leads = useQuery({ queryKey: ["leads"], queryFn: () => listLeadsFn() });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "new" | "contacted" | "enrolled" | "declined" }) =>
      updateFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Section title="Admission enquiries" subtitle="Public form submissions from the website">
      {leads.isLoading ? (
        <SkeletonRows />
      ) : (leads.data ?? []).length === 0 ? (
        <EmptyState emoji="📭" label="No enquiries yet." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Parent</th>
                <th className="p-3">Child</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Program</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.data!.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-3 font-semibold">{l.parent_name}</td>
                  <td className="p-3">
                    {l.child_name}
                    {l.child_age ? (
                      <span className="text-muted-foreground"> · {l.child_age}y</span>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <div>{l.phone}</div>
                    {l.email && <div className="text-xs text-muted-foreground">{l.email}</div>}
                  </td>
                  <td className="p-3">{l.program ?? "—"}</td>
                  <td className="p-3">
                    <StatusPill status={l.status} />
                  </td>
                  <td className="p-3">
                    <select
                      value={l.status}
                      onChange={(e) =>
                        setStatus.mutate({
                          id: l.id,
                          status: e.target.value as
                            | "new"
                            | "contacted"
                            | "enrolled"
                            | "declined",
                        })
                      }
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold"
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="enrolled">enrolled</option>
                      <option value="declined">declined</option>
                    </select>
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
