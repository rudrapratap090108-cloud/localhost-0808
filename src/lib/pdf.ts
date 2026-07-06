import { jsPDF } from "jspdf";
import logoAsset from "@/assets/logo.asset.json";

const BRAND = "Mighty Mindz International Pre-school";
const TRUST = "Tara Devi Educational and Welfare Trust";
const ADDRESS = "Sec 11A/197, Vrindavan Yojna, Lucknow, UP 226029";
const CONTACT = "+91 84001 00348 · seema.m.bansal@gmail.com";

// Cache logo dataURL so we don't refetch per PDF
let _logoDataUrl: string | null = null;
async function getLogoDataUrl(): Promise<string | null> {
  if (_logoDataUrl) return _logoDataUrl;
  try {
    const res = await fetch(logoAsset.url);
    if (!res.ok) return null;
    const blob = await res.blob();
    _logoDataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return _logoDataUrl;
  } catch {
    return null;
  }
}

function header(doc: jsPDF, subtitle: string, logo?: string | null) {
  // Warm cream band
  doc.setFillColor(255, 236, 205);
  doc.rect(0, 0, 210, 34, "F");
  // Accent stripe
  doc.setFillColor(232, 90, 79);
  doc.rect(0, 34, 210, 2.5, "F");
  // Playful dots
  doc.setFillColor(255, 205, 90);
  doc.circle(190, 8, 3, "F");
  doc.setFillColor(120, 190, 130);
  doc.circle(200, 20, 2.4, "F");
  doc.setFillColor(90, 160, 220);
  doc.circle(182, 26, 2, "F");

  if (logo) {
    try {
      doc.addImage(logo, "PNG", 12, 6, 22, 22);
    } catch {
      /* ignore */
    }
  }
  const x = logo ? 38 : 14;
  doc.setTextColor(60, 40, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(BRAND, x, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(TRUST, x, 20);
  doc.setFontSize(8);
  doc.setTextColor(110, 90, 70);
  doc.text(ADDRESS, x, 25);
  doc.text(CONTACT, x, 29.5);
  doc.setTextColor(60, 40, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(subtitle, 14, 44);
  doc.setTextColor(0, 0, 0);
}

function footer(doc: jsPDF) {
  // Accent bottom stripe
  doc.setFillColor(232, 90, 79);
  doc.rect(0, 288, 210, 1.5, "F");
  doc.setFillColor(255, 205, 90);
  doc.circle(6, 293, 2, "F");
  doc.setFillColor(120, 190, 130);
  doc.circle(204, 293, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generated ${new Date().toLocaleString()} · ${TRUST} · Computer-generated document.`,
    14,
    294,
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

export async function downloadResultPdf(r: ResultForPdf) {
  const doc = new jsPDF();
  const logo = await getLogoDataUrl();
  header(doc, `Result — ${r.term === "annual" ? "Annual" : "Half-yearly"} ${r.year}`, logo);

  doc.setFontSize(12);
  let y = 54;
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
