import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, EmptyState, SkeletonRows } from "./ui";
import { useMe } from "./me";
import {
  submitFeePayment,
  listMyFeePayments,
  listAllFeePayments,
  verifyFeePayment,
} from "@/lib/school.functions";
import { downloadFeeReceiptPdf } from "@/lib/pdf";
import upiQrAsset from "@/assets/upi-qr.asset.json";

const UPI_ID = "seema.m.bansal@okhdfcbank";
const PAYEE_NAME = "Seema Bansal";
const ACCOUNT_NAME = "Tara Devi Educational and Welfare Trust";
const BANK = {
  name: "Union Bank of India",
  account: "215211100003004",
  ifsc: "UBIN0821527",
};

export function FeesCard({ childName }: { childName: string | null }) {
  const me = useMe();
  const qc = useQueryClient();
  const submit = useServerFn(submitFeePayment);
  const listMine = useServerFn(listMyFeePayments);

  const [tab, setTab] = useState<"qr" | "upi" | "bank">("qr");
  const [form, setForm] = useState({
    student_name: childName ?? "",
    student_class: me.profile?.class_name ?? "",
    period: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
    amount: 0,
    method: "UPI",
    reference: "",
    notes: "",
  });

  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const note = `MightyMindz fees${form.student_name ? " - " + form.student_name : ""}`;
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    PAYEE_NAME,
  )}&am=${form.amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrSrc = upiQrAsset.url;

  const myPayments = useQuery({ queryKey: ["my-fees"], queryFn: () => listMine() });

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.student_name.trim()) return toast.error("Enter student name");
    if (!form.amount || form.amount <= 0) return toast.error("Enter amount");
    const f = fileRef.current?.files?.[0];
    if (!f) return toast.error("Attach the payment screenshot");
    if (f.size > 5 * 1024 * 1024) return toast.error("Screenshot max 5MB");
    setBusy(true);
    try {
      const path = `${me.userId}/${Date.now()}_${f.name.replace(/[^\w.-]+/g, "_")}`;
      const up = await supabase.storage.from("fee-screenshots").upload(path, f, { upsert: false });
      if (up.error) throw new Error(up.error.message);
      await submit({
        data: {
          student_name: form.student_name.trim(),
          student_class: form.student_class || undefined,
          period: form.period,
          amount: Number(form.amount),
          method: form.method,
          reference: form.reference || undefined,
          notes: form.notes || undefined,
          screenshot_path: path,
        },
      });
      qc.invalidateQueries({ queryKey: ["my-fees"] });
      qc.invalidateQueries({ queryKey: ["all-fees"] });
      if (fileRef.current) fileRef.current.value = "";
      setForm((f2) => ({ ...f2, reference: "", notes: "" }));
      toast.success("Payment submitted for verification");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card title="Fees" emoji="💳">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="rounded-2xl border border-border bg-cream/60 p-4">
              <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                Enter amount to pay
              </label>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-2xl">₹</span>
                <input
                  type="number"
                  min={1}
                  value={form.amount || ""}
                  onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-display font-bold text-2xl"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[2000, 4500, 6500, 8000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, amount: v }))}
                    className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
                  >
                    ₹{v.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Type the fee amount shared by school · Due by 10th of the month
              </div>
            </div>
          </div>


          <div>
            <div className="flex gap-2 mb-3">
              {(["qr", "upi", "bank"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold border transition ${
                    tab === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-cream"
                  }`}
                >
                  {t === "qr" ? "Scan QR" : t === "upi" ? "UPI ID" : "Bank transfer"}
                </button>
              ))}
            </div>

            {tab === "qr" && (
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <img
                  src={qrSrc}
                  alt="Demo UPI QR"
                  className="mx-auto rounded-xl border border-border bg-white p-2"
                  width={220}
                  height={220}
                />
                <div className="text-xs text-muted-foreground mt-2">
                  Scan with any UPI app (GPay / PhonePe / Paytm)
                </div>
                <div className="text-sm font-semibold mt-1">₹{form.amount.toLocaleString("en-IN")}</div>
              </div>
            )}

            {tab === "upi" && (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <Row label="UPI ID" value={UPI_ID} onCopy={() => copy(UPI_ID, "UPI ID")} />
                <Row label="Payee" value={PAYEE_NAME} />
                <a
                  href={upiLink}
                  className="block text-center rounded-full bg-leaf text-leaf-foreground text-sm font-bold px-4 py-2"
                >
                  Open in UPI app
                </a>
              </div>
            )}

            {tab === "bank" && (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <Row label="Account name" value={ACCOUNT_NAME} onCopy={() => copy(ACCOUNT_NAME, "Account name")} />
                <Row
                  label="Account no."
                  value={BANK.account}
                  onCopy={() => copy(BANK.account.replace(/\s/g, ""), "Account number")}
                />
                <Row label="IFSC" value={BANK.ifsc} onCopy={() => copy(BANK.ifsc, "IFSC")} />
                <Row label="Bank" value={BANK.name} />
                <div className="text-xs text-muted-foreground pt-1">
                  Registered under Tara Devi Educational & Welfare Trust
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="Submit payment screenshot" emoji="🧾">
        <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-2">
          <input
            value={form.student_name}
            onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))}
            placeholder="Student name *"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            value={form.student_class}
            onChange={(e) => setForm((f) => ({ ...f, student_class: e.target.value }))}
            placeholder="Class"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.period}
            onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
            placeholder="Period (e.g. Nov 2026)"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
            placeholder="Amount *"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
            min={1}
          />
          <select
            value={form.method}
            onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option>UPI</option>
            <option>Bank transfer</option>
            <option>Card</option>
            <option>Cash</option>
          </select>
          <input
            value={form.reference}
            onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            placeholder="UPI / bank reference"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)"
            rows={2}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          />
          <button
            disabled={busy}
            className="md:col-span-2 rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Submit for verification"}
          </button>
        </form>
      </Card>

      <Card title="My payments" emoji="📜">
        {myPayments.isLoading ? (
          <SkeletonRows />
        ) : (myPayments.data ?? []).length === 0 ? (
          <EmptyState emoji="🗃️" label="No payments submitted yet." />
        ) : (
          <ul className="space-y-2">
            {myPayments.data!.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-cream/40 p-3">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="font-semibold text-sm">
                    {p.student_name} — {p.period}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ₹{Number(p.amount).toLocaleString("en-IN")} · {p.method ?? "—"} ·{" "}
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
                {p.notes && <div className="text-xs mt-1">{p.notes}</div>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.screenshot_url && (
                    <a
                      href={p.screenshot_url}
                      target="_blank"
                      rel="noopener"
                      className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
                    >
                      View screenshot
                    </a>
                  )}
                  {p.status === "verified" && (
                    <button
                      onClick={() =>
                        downloadFeeReceiptPdf({
                          receipt_no: p.id.slice(0, 8).toUpperCase(),
                          parent_name: me.profile?.full_name ?? me.email ?? "Parent",
                          student_name: p.student_name,
                          student_class: p.student_class,
                          period: p.period,
                          amount: Number(p.amount),
                          method: p.method,
                          reference: p.reference,
                          paid_at: p.created_at,
                          verified_by: null,
                          verified_at: p.verified_at,
                        })
                      }
                      className="rounded-full bg-leaf text-leaf-foreground text-xs font-bold px-3 py-1"
                    >
                      ⬇ Download receipt PDF
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function FeeVerificationPanel() {
  const qc = useQueryClient();
  const listAll = useServerFn(listAllFeePayments);
  const verify = useServerFn(verifyFeePayment);
  const q = useQuery({ queryKey: ["all-fees"], queryFn: () => listAll() });
  const mut = useMutation({
    mutationFn: (v: { id: string; status: "verified" | "rejected"; notes?: string }) =>
      verify({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-fees"] });
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const [filter, setFilter] = useState<"pending" | "verified" | "rejected" | "all">("pending");
  const rows = (q.data ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <Card title="Verify fee payments" emoji="🛡️">
      <div className="flex gap-2 mb-3 flex-wrap">
        {(["pending", "verified", "rejected", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-bold border transition ${
              filter === t
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-cream"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {q.isLoading ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <EmptyState emoji="✨" label="No payments to review." />
      ) : (
        <ul className="space-y-2">
          {rows.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border bg-cream/40 p-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="font-semibold text-sm">
                  {p.student_name} · {p.student_class ?? "-"} — {p.period}
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ₹{Number(p.amount).toLocaleString("en-IN")} · {p.method ?? "—"} · ref{" "}
                {p.reference ?? "—"} · {new Date(p.created_at).toLocaleString()}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {p.screenshot_url ? (
                  <a
                    href={p.screenshot_url}
                    target="_blank"
                    rel="noopener"
                    className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
                  >
                    View screenshot
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No screenshot</span>
                )}
                {p.status !== "verified" && (
                  <button
                    onClick={() => mut.mutate({ id: p.id, status: "verified" })}
                    className="rounded-full bg-leaf text-leaf-foreground text-xs font-bold px-3 py-1"
                  >
                    ✅ Verify
                  </button>
                )}
                {p.status !== "rejected" && (
                  <button
                    onClick={() => mut.mutate({ id: p.id, status: "rejected" })}
                    className="rounded-full bg-tomato text-white text-xs font-bold px-3 py-1"
                  >
                    ✕ Reject
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-sunshine text-sunshine-foreground",
    verified: "bg-leaf text-leaf-foreground",
    rejected: "bg-tomato text-white",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
        >
          Copy
        </button>
      )}
    </div>
  );
}
