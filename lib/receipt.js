// Client-side receipt PDF (jsPDF). Returns a Blob for download/upload + base64
// for emailing. Kept dependency-light: plain text layout, brand colours.
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { PREP_TITLE, PREP_STEPS, PREP_REMINDER } from "@/lib/prepInfo";

const ROSE = [107, 44, 62];
const INK = [36, 28, 30];
const MUTED = [138, 123, 127];

export async function makeReceiptPdf({ ref, nama, telepon, items = [], orang = 1, areaNama, areaFee = 0, tanggal, jam, total, dpPercent = 50, brand = "Salia Makeup" }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ROSE);
  doc.text(brand, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("Struk Booking", margin, y + 16);
  doc.text(ref ? `No. ${ref}` : "", pageWidth - margin, y + 16, { align: "right" });
  y += 40;

  doc.setDrawColor(234, 217, 221);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  function row(label, value, bold) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(label, margin, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...INK);
    doc.text(String(value), pageWidth - margin, y, { align: "right" });
    y += 18;
  }

  row("Nama", nama || "-");
  if (telepon) row("No. WhatsApp", telepon);
  row("Tanggal", formatTanggal(tanggal));
  row("Jam ready", jam || "-");
  if (areaNama) row("Area", areaNama);
  row("Jumlah orang", `${orang} orang`);

  y += 8;
  doc.setDrawColor(234, 217, 221);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Layanan", margin, y);
  y += 18;
  items.forEach((item) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(`${item.nama}${orang > 1 ? ` × ${orang}` : ""}`, margin, y);
    doc.text(formatRupiah((item.base || 0) * orang), pageWidth - margin, y, { align: "right" });
    y += 16;
  });
  if (areaFee > 0) {
    doc.setTextColor(...MUTED);
    doc.text("Ongkir", margin, y);
    doc.setTextColor(...INK);
    doc.text(formatRupiah(areaFee), pageWidth - margin, y, { align: "right" });
    y += 16;
  }

  y += 6;
  doc.setDrawColor(234, 217, 221);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...ROSE);
  doc.text("Total", margin, y);
  doc.text(formatRupiah(total), pageWidth - margin, y, { align: "right" });
  y += 20;
  const downPayment = Math.round((total * dpPercent) / 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`DP ${dpPercent}%`, margin, y);
  doc.setTextColor(...INK);
  doc.text(formatRupiah(downPayment), pageWidth - margin, y, { align: "right" });
  y += 30;

  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text(`Terima kasih sudah booking di ${brand}. Sampai jumpa!`, margin, y);

  // ---- Page 2: Informasi H-1 (client prep) ----
  doc.addPage();
  const contentWidth = pageWidth - margin * 2;
  let page2Y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...ROSE);
  doc.text(PREP_TITLE, margin, page2Y);
  page2Y += 22;

  doc.setDrawColor(234, 217, 221);
  doc.line(margin, page2Y, pageWidth - margin, page2Y);
  page2Y += 20;

  PREP_STEPS.forEach((step, i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(`${i + 1}. ${step.title}`, margin, page2Y);
    page2Y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(step.body, contentWidth);
    doc.text(lines, margin, page2Y);
    page2Y += lines.length * 12 + 10;
  });

  page2Y += 4;
  doc.setDrawColor(234, 217, 221);
  doc.line(margin, page2Y, pageWidth - margin, page2Y);
  page2Y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ROSE);
  doc.text("Pengingat", margin, page2Y);
  page2Y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  PREP_REMINDER.forEach((reminder) => {
    const lines = doc.splitTextToSize(`• ${reminder}`, contentWidth);
    doc.text(lines, margin, page2Y);
    page2Y += lines.length * 12 + 6;
  });

  const blob = doc.output("blob");
  const base64 = doc.output("datauristring").split(",")[1];
  return { blob, base64, filename: `struk-${ref || "salia"}.pdf` };
}
