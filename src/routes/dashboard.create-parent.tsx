import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMe } from "@/components/dashboard/me";
import { Card, AccessDenied } from "@/components/dashboard/ui";
import { createParentAccount, listParentLogins, deleteParentAccount } from "@/lib/school.functions";

export const Route = createFileRoute("/dashboard/create-parent")({
  head: () => ({ meta: [{ title: "Create parent — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: CreateParentPage,
});

type Mode = "auto" | "manual" | "invite";
type Result = { mode: string; email: string; password?: string; generated?: boolean };

function CreateParentPage() {
  const me = useMe();
  const create = useServerFn(createParentAccount);
  const [mode, setMode] = useState<Mode>("auto");
  const [form, setForm] = useState({
    full_name: "",
    child_name: "",
    class_name: "",
    phone: "",
    email: "",
    password: "",
    roll_no: "",
  });
  const [result, setResult] = useState<Result | null>(null);

  const mut = useMutation({
    mutationFn: () => create({ data: { mode, ...form } }),
    onSuccess: (r) => {
      setResult(r as Result);
      toast.success("Parent account created");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!(me.roles.includes("admin") || me.roles.includes("teacher"))) return <AccessDenied />;

  return (
    <div className="max-w-3xl grid gap-6">
      <Card title="Create a parent login" emoji="🪪">
        <p className="text-sm text-muted-foreground mb-3">
          Choose how the login should be created. All three modes are available.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              { m: "auto", label: "🎲 Auto-generate email & password", desc: "Instant login, share manually" },
              { m: "manual", label: "✍️ Type email & password", desc: "You know both values" },
              { m: "invite", label: "📧 Send invite email", desc: "Parent sets their own password" },
            ] as const
          ).map(({ m, label, desc }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 min-w-[180px] text-left rounded-2xl border p-3 transition ${
                mode === m
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:bg-cream"
              }`}
            >
              <div className="font-bold text-sm">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.full_name.trim()) return toast.error("Parent name required");
            if (mode !== "auto" && !form.email.trim()) return toast.error("Email required");
            if (mode === "manual" && form.password.length < 8) return toast.error("Password ≥ 8 chars");
            setResult(null);
            mut.mutate();
          }}
          className="grid md:grid-cols-2 gap-2"
        >
          <input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Parent's full name *"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
            required
          />
          <input
            value={form.child_name}
            onChange={(e) => setForm((f) => ({ ...f, child_name: e.target.value }))}
            placeholder="Child's name"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.class_name}
            onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))}
            placeholder="Child's class"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.roll_no}
            onChange={(e) => setForm((f) => ({ ...f, roll_no: e.target.value }))}
            placeholder="Roll no. (used for auto ID)"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />

          {mode !== "auto" && (
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              type="email"
              placeholder="Parent's email *"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
              required
            />
          )}

          {mode === "manual" && (
            <input
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              type="text"
              placeholder="Password (≥ 8 chars) *"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
              required
              minLength={8}
            />
          )}

          <button
            disabled={mut.isPending}
            className="md:col-span-2 rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
          >
            {mut.isPending ? "Creating…" : "Create login"}
          </button>
        </form>
      </Card>

      {result && (
        <Card title="Login credentials" emoji="✅">
          {result.mode === "invite" ? (
            <p className="text-sm">
              An invite email was sent to <b>{result.email}</b>. The parent will click the link
              and set their own password.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Email / ID</div>
                <div className="font-mono font-semibold">{result.email}</div>
              </div>
              {result.password && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Password</div>
                  <div className="font-mono font-semibold">{result.password}</div>
                </div>
              )}
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `Login: ${result.email}\nPassword: ${result.password ?? "(set via invite)"}`,
                  ).then(() => toast.success("Copied"))
                }
                className="mt-2 rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
              >
                Copy credentials
              </button>
              <p className="text-xs text-muted-foreground pt-2">
                Share these securely with the parent. Ask them to change the password after first login.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
