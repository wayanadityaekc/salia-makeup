// Client-side receipt PDF (jsPDF). Returns a Blob for download/upload + base64
// for emailing. Kept dependency-light: plain text layout, brand colours.
import { formatRupiah, formatTanggal } from "@/lib/utils";

const ROSE = [107, 44, 62];
const INK = [36, 28, 30];
const MUTED = [138, 123, 127];

export async function makeReceiptPdf({ ref, nama, telepon, items = [], orang = 1, areaNama, areaFee = 0, tanggal, jam, total, dpPercent = 50, brand = "Salia Makeup" }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a5" });
  const W = doc.internal.pageSize.getWidth();
  const M = 36;
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ROSE);
  doc.text(brand, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("Struk Booking", M, y + 16);
  doc.text(ref ? `No. ${ref}` : "", W - M, y + 16, { align: "right" });
  y += 40;

  doc.setDrawColor(234, 217, 221);
  doc.line(M, y, W - M, y);
  y += 22;

  const row = (label, value, bold) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(label, M, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...INK);
    doc.text(String(value), W - M, y, { align: "right" });
    y += 18;
  };

  row("Nama", nama || "-");
  if (telepon) row("No. WhatsApp", telepon);
  row("Tanggal", formatTanggal(tanggal));
  row("Jam ready", jam || "-");
  if (areaNama) row("Area", areaNama);
  row("Jumlah orang", `${orang} orang`);

  y += 8;
  doc.setDrawColor(234, 217, 221);
  doc.line(M, y, W - M, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Layanan", M, y);
  y += 18;
  for (const it of items) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(`${it.nama}${orang > 1 ? ` × ${orang}` : ""}`, M, y);
    doc.text(formatRupiah((it.base || 0) * orang), W - M, y, { align: "right" });
    y += 16;
  }
  if (areaFee > 0) {
    doc.setTextColor(...MUTED);
    doc.text("Ongkir", M, y);
    doc.setTextColor(...INK);
    doc.text(formatRupiah(areaFee), W - M, y, { align: "right" });
    y += 16;
  }

  y += 6;
  doc.setDrawColor(234, 217, 221);
  doc.line(M, y, W - M, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...ROSE);
  doc.text("Total", M, y);
  doc.text(formatRupiah(total), W - M, y, { align: "right" });
  y += 20;
  const dp = Math.round((total * dpPercent) / 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`DP ${dpPercent}%`, M, y);
  doc.setTextColor(...INK);
  doc.text(formatRupiah(dp), W - M, y, { align: "right" });
  y += 30;

  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text("Terima kasih sudah booking di " + brand + ". Sampai jumpa!", M, y);

  const blob = doc.output("blob");
  const base64 = doc.output("datauristring").split(",")[1];
  return { blob, base64, filename: `struk-${ref || "salia"}.pdf` };
}
