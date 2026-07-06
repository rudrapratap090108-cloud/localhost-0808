import { jsPDF } from "jspdf";

const BRAND = "Mighty Mindz School";

function header(doc: jsPDF, subtitle: string) {
  doc.setFillColor(255, 240, 220);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(60, 40, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(BRAND, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(subtitle, 14, 21);
  doc.setTextColor(0, 0, 0);
}

function footer(doc: jsPDF) {
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generated ${new Date().toLocaleString()} · This is a computer-generated document.`,
    14,
    285,
  );
  doc.setTextColor(0, 0, 0);
}

export type ResultForPdf = {
  student_name: string;
  roll_no: string;
  className: string;
  term: string;
  year: number;
  subjects: Array<{ name: string; marks: number; max: number }>;
  total: number;
  max_total: number;
  percentage: number;
  grade: string | null;
  remarks: string | null;
};

export function downloadResultPdf(r: ResultForPdf) {
  const doc = new jsPDF();
  header(doc, `Result — ${r.term === "annual" ? "Annual" : "Half-yearly"} ${r.year}`);

  doc.setFontSize(12);
  let y = 38;
  const info: [string, string][] = [
    ["Student", r.student_name],
    ["Roll No.", r.roll_no],
    ["Class", r.className],
    ["Term", r.term === "annual" ? "Annual" : "Half-yearly"],
    ["Academic year", String(r.year)],
  ];
  info.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(v, 55, y);
    y += 7;
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(14, y - 5, 182, 8, "F");
  doc.text("Subject", 16, y);
  doc.text("Marks", 130, y);
  doc.text("Max", 155, y);
  doc.text("%", 180, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  r.subjects.forEach((s) => {
    const pct = s.max > 0 ? ((s.marks / s.max) * 100).toFixed(1) + "%" : "-";
    doc.text(s.name, 16, y);
    doc.text(String(s.marks), 130, y);
    doc.text(String(s.max), 155, y);
    doc.text(pct, 180, y);
    y += 6;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${r.total} / ${r.max_total}`, 14, y);
  doc.text(`Percentage: ${r.percentage}%`, 100, y);
  if (r.grade) doc.text(`Grade: ${r.grade}`, 160, y);
  y += 8;
  if (r.remarks) {
    doc.setFont("helvetica", "italic");
    doc.text(`Remarks: ${r.remarks}`, 14, y);
  }
  footer(doc);
  doc.save(`Result_${r.roll_no}_${r.term}_${r.year}.pdf`);
}

export type FeeReceiptForPdf = {
  receipt_no: string;
  parent_name: string;
  student_name: string;
  student_class: string | null;
  period: string;
  amount: number;
  method: string | null;
  reference: string | null;
  paid_at: string;
  verified_by: string | null;
  verified_at: string | null;
};

export function downloadFeeReceiptPdf(r: FeeReceiptForPdf) {
  const doc = new jsPDF();
  header(doc, "Official Fee Payment Receipt");

  doc.setFontSize(12);
  let y = 40;
  const rows: [string, string][] = [
    ["Receipt no.", r.receipt_no],
    ["Parent", r.parent_name],
    ["Student", r.student_name],
    ["Class", r.student_class ?? "-"],
    ["Period", r.period],
    ["Amount paid", `INR ${r.amount.toLocaleString("en-IN")}`],
    ["Payment method", r.method ?? "-"],
    ["Reference", r.reference ?? "-"],
    ["Submitted on", new Date(r.paid_at).toLocaleString()],
    ["Verified on", r.verified_at ? new Date(r.verified_at).toLocaleString() : "-"],
    ["Verified by", r.verified_by ?? "-"],
    ["Status", "VERIFIED"],
  ];
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(v, 65, y);
    y += 7;
  });

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 8;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text(
    "Thank you for your payment. Please retain this receipt for your records.",
    14,
    y,
  );

  footer(doc);
  doc.save(`FeeReceipt_${r.receipt_no}.pdf`);
}

export type HomeworkForPdf = {
  title: string;
  subject: string | null;
  className: string;
  due_date: string | null;
  description: string | null;
  media: Array<{ url: string; kind: "image" | "video" }>;
};

export async function downloadHomeworkPdf(h: HomeworkForPdf) {
  const doc = new jsPDF();
  header(doc, "Homework / Assignment");
  let y = 40;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(h.title, 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const info: [string, string][] = [
    ["Class", h.className],
    ["Subject", h.subject ?? "-"],
    ["Due date", h.due_date ? new Date(h.due_date).toLocaleDateString() : "-"],
  ];
  info.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(v, 45, y);
    y += 6;
  });
  y += 4;
  if (h.description) {
    doc.setFont("helvetica", "bold");
    doc.text("Instructions:", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(h.description, 180);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 4;
  }

  const images = h.media.filter((m) => m.kind === "image");
  const videos = h.media.filter((m) => m.kind === "video");

  for (const img of images) {
    try {
      const dataUrl = await urlToDataUrl(img.url);
      if (!dataUrl) continue;
      if (y > 200) {
        doc.addPage();
        y = 20;
      }
      doc.addImage(dataUrl, "JPEG", 14, y, 90, 70, undefined, "FAST");
      y += 76;
    } catch {
      /* skip */
    }
  }

  if (videos.length > 0) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Video links:", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    videos.forEach((v, i) => {
      doc.setTextColor(0, 0, 200);
      doc.textWithLink(`Video ${i + 1} (open in browser)`, 14, y, { url: v.url });
      doc.setTextColor(0, 0, 0);
      y += 6;
    });
  }

  footer(doc);
  doc.save(`Homework_${h.title.replace(/\s+/g, "_").slice(0, 40)}.pdf`);
}

async function urlToDataUrl(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
