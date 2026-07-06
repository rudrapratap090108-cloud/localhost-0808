import { useState } from "react";
import { toast } from "sonner";
import { Card } from "./ui";

const FEE_ITEMS = [
  { label: "Tuition — Nov", amount: 4500 },
  { label: "Activity kit", amount: 800 },
  { label: "Snacks & meals", amount: 1200 },
];
const UPI_ID = "mightymindz@upi";
const PAYEE_NAME = "Mighty Mindz Preschool";
const BANK = {
  name: "HDFC Bank",
  account: "50100 1234 5678",
  ifsc: "HDFC0001234",
  branch: "MG Road, Bengaluru",
};

export function FeesCard({ childName }: { childName: string | null }) {
  const total = FEE_ITEMS.reduce((s, i) => s + i.amount, 0);
  const [tab, setTab] = useState<"qr" | "upi" | "bank">("qr");
  const [paid, setPaid] = useState(false);
  const note = `MightyMindz fees${childName ? " - " + childName : ""}`;
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    PAYEE_NAME,
  )}&am=${total}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiLink,
  )}`;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <Card title="Fees" emoji="💳">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="rounded-2xl border border-border bg-cream/60 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              This month
            </div>
            <ul className="text-sm space-y-1.5">
              {FEE_ITEMS.map((i) => (
                <li key={i.label} className="flex justify-between">
                  <span>{i.label}</span>
                  <span className="font-semibold">₹{i.amount.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-baseline">
              <span className="font-display font-bold">Total due</span>
              <span className="font-display font-bold text-2xl">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Demo billing · Due by 10th of the month
            </div>
          </div>
          {paid && (
            <div className="mt-3 rounded-2xl border border-leaf/40 bg-leaf/10 p-3 text-sm">
              ✅ Payment marked as received (demo). We'll email a receipt shortly.
            </div>
          )}
          <button
            onClick={() => setPaid(true)}
            className="mt-3 w-full rounded-full bg-primary text-primary-foreground text-sm font-bold px-4 py-2"
          >
            I've paid — mark as done
          </button>
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
              <div className="text-sm font-semibold mt-1">₹{total.toLocaleString("en-IN")}</div>
            </div>
          )}

          {tab === "upi" && (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <Row label="UPI ID" value={UPI_ID} onCopy={() => copy(UPI_ID, "UPI ID")} />
              <Row label="Payee" value={PAYEE_NAME} />
              <Row
                label="Amount"
                value={`₹${total.toLocaleString("en-IN")}`}
                onCopy={() => copy(String(total), "Amount")}
              />
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
              <Row label="Account name" value={PAYEE_NAME} />
              <Row
                label="Account no."
                value={BANK.account}
                onCopy={() => copy(BANK.account.replace(/\s/g, ""), "Account number")}
              />
              <Row label="IFSC" value={BANK.ifsc} onCopy={() => copy(BANK.ifsc, "IFSC")} />
              <Row label="Bank" value={`${BANK.name} · ${BANK.branch}`} />
              <div className="text-xs text-muted-foreground">
                Add child's name in the transfer remarks so we can match your payment.
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
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
