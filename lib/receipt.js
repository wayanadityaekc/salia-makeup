import { formatRupiah, formatTanggal } from '@/lib/utils';
import { PREP_TITLE, PREP_STEPS, PREP_REMINDER } from '@/lib/prepInfo';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/booking.json';

const ROSE = [107, 44, 62];
const INK = [36, 28, 30];
const MUTED = [138, 123, 127];
const LABELS = messages.receiptPdf;

export async function makeReceiptPdf({
  ref,
  nama,
  telepon,
  items = [],
  orang = 1,
  areaNama,
  areaFee = 0,
  tanggal,
  jam,
  total,
  dpPercent = 50,
  brand = 'Salia Makeup',
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  let y = 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...ROSE);
  doc.text(brand, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(LABELS.title, margin, y + 16);
  doc.text(ref ? formatMessage(LABELS.refNumber, { ref }) : '', pageWidth - margin, y + 16, { align: 'right' });
  y += 40;

  doc.setDrawColor(234, 217, 221);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  function row(label, value, bold) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(label, margin, y);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...INK);
    doc.text(String(value), pageWidth - margin, y, { align: 'right' });
    y += 18;
  }

  row(LABELS.nameLabel, nama || '-');
  if (telepon) row(LABELS.phoneLabel, telepon);
  row(LABELS.dateLabel, formatTanggal(tanggal));
  row(LABELS.timeLabel, jam || '-');
  if (areaNama) row(LABELS.areaLabel, areaNama);
  row(LABELS.peopleLabel, formatMessage(LABELS.peopleValue, { orang }));

  y += 8;
  doc.setDrawColor(234, 217, 221);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(LABELS.servicesTitle, margin, y);
  y += 18;
  items.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(`${item.nama}${orang > 1 ? formatMessage(LABELS.quantitySuffix, { orang }) : ''}`, margin, y);
    doc.text(formatRupiah((item.base || 0) * orang), pageWidth - margin, y, { align: 'right' });
    y += 16;
  });
  if (areaFee > 0) {
    doc.setTextColor(...MUTED);
    doc.text(LABELS.shippingLabel, margin, y);
    doc.setTextColor(...INK);
    doc.text(formatRupiah(areaFee), pageWidth - margin, y, { align: 'right' });
    y += 16;
  }

  y += 6;
  doc.setDrawColor(234, 217, 221);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...ROSE);
  doc.text(LABELS.totalLabel, margin, y);
  doc.text(formatRupiah(total), pageWidth - margin, y, { align: 'right' });
  y += 20;
  const downPayment = Math.round((total * dpPercent) / 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(formatMessage(LABELS.downPaymentLabel, { dpPercent }), margin, y);
  doc.setTextColor(...INK);
  doc.text(formatRupiah(downPayment), pageWidth - margin, y, { align: 'right' });
  y += 30;

  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text(formatMessage(LABELS.thankYou, { brand }), margin, y);

  doc.addPage();
  const contentWidth = pageWidth - margin * 2;
  let page2Y = 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...ROSE);
  doc.text(PREP_TITLE, margin, page2Y);
  page2Y += 22;

  doc.setDrawColor(234, 217, 221);
  doc.line(margin, page2Y, pageWidth - margin, page2Y);
  page2Y += 20;

  PREP_STEPS.forEach((step, index) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(`${index + 1}. ${step.title}`, margin, page2Y);
    page2Y += 15;
    doc.setFont('helvetica', 'normal');
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

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ROSE);
  doc.text(LABELS.reminderTitle, margin, page2Y);
  page2Y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  PREP_REMINDER.forEach((reminder) => {
    const lines = doc.splitTextToSize(`• ${reminder}`, contentWidth);
    doc.text(lines, margin, page2Y);
    page2Y += lines.length * 12 + 6;
  });

  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1];
  return { blob, base64, filename: `struk-${ref || 'salia'}.pdf` };
}
