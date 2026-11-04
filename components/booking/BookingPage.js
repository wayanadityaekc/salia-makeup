'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Lock,
  ShieldCheck,
  CalendarCheck,
  MessageCircle,
  Send,
  Copy,
  Check,
  Upload,
  Loader2,
  CheckCircle2,
  Minus,
  Plus,
  Download,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import Select from '@/components/ui/Select';
import { site } from '@/lib/config';
import { formatRupiah, formatTanggal, waLink, normalizeWa } from '@/lib/utils';
import {
  fetchBookingToken,
  saveCartBooking,
  uploadProof,
  uploadReceipt,
  sendReceiptToChat,
  emailReceipt,
} from '@/lib/storage';
import { compressImage } from '@/lib/image';
import { makeReceiptPdf } from '@/lib/receipt';
import { CART_KEY } from '@/components/store/CartProvider';
import { chatCidFor } from '@/lib/chat';
import { useUser } from '@/components/auth/UserProvider';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/booking.json';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BOOKING_ERROR_MESSAGES = {
  invalid_token: messages.bookingErrors.invalidToken,
  invalid_email: messages.bookingErrors.invalidEmail,
  too_long: messages.bookingErrors.tooLong,
  invalid_proof_url: messages.bookingErrors.invalidProofUrl,
};

const timeOptions = Array.from({ length: 16 }, (_, index) => index + 6).flatMap((hour) =>
  [0, 30].map((minute) => {
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { value: time, label: time };
  }),
);

export default function BookingPage({ settings }) {
  const search = useSearchParams();
  const token = search.get('token') || '';
  const { user } = useUser();

  const [cart, setCart] = useState({ items: [], orang: 1 });
  const [tok, setTok] = useState({ status: 'checking' });
  const [step, setStep] = useState('form');
  const [doneReceipt, setDoneReceipt] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      const items = [saved?.sel?.makeup, saved?.sel?.hairdo, saved?.sel?.nail].filter(Boolean);
      setCart({ items, orang: saved?.orang || 1 });
    } catch (e) {}
  }, []);

  useEffect(() => {
    let alive = true;
    if (!token) {
      setTok({ status: 'invalid', reason: 'missing' });
      return;
    }
    async function check() {
      try {
        const { valid, tanggal, reason } = (await fetchBookingToken(token)) || {};
        if (!alive) return;
        setTok(valid ? { status: 'valid', tanggal } : { status: 'invalid', reason: reason || 'invalid' });
      } catch (e) {}
    }
    check();
    return () => {
      alive = false;
    };
  }, [token]);

  const areas = settings?.areas || [];
  const subtotal = cart.items.reduce((sum, item) => sum + (item.base || 0), 0);

  if (step === 'done') {
    return <DonePanel receipt={doneReceipt} user={user} />;
  }

  return (
    <div className="container-x py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-rose">
          <ArrowLeft size={16} /> {messages.bookingPage.back}
        </Link>
        <h1 className="text-2xl font-bold text-ink">{messages.bookingPage.title}</h1>

        {cart.items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-rose-line bg-white p-8 text-center">
            <p className="text-sm text-muted">{messages.bookingPage.emptyCart}</p>
            <Link href="/#pilih" className="btn-primary mt-4 inline-flex">
              {messages.bookingPage.chooseService}
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-2xl border border-rose-line bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose">
                {messages.bookingPage.selectedServices}
              </div>
              <ul className="mt-3 space-y-2">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{item.nama}</span>
                    <span className="font-semibold text-ink">{formatRupiah(item.base)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-rose-line pt-3 text-sm">
                <span className="text-muted">{messages.bookingPage.estimatePerPerson}</span>
                <span className="font-bold text-rose">{formatRupiah(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">{messages.bookingPage.finalTotalNote}</p>
            </div>

            {tok.status === 'valid' ? (
              <UnlockedForm
                cart={cart}
                areas={areas}
                settings={settings}
                token={token}
                tanggal={tok.tanggal}
                user={user}
                onDone={(receipt) => {
                  setDoneReceipt(receipt);
                  setStep('done');
                }}
              />
            ) : (
              <LockedPanel status={tok.status} reason={tok.reason} cart={cart} settings={settings} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LockedPanel({ status = 'invalid', reason = '', cart = { items: [], orang: 1 }, settings = null }) {
  const whatsappNumber = normalizeWa(settings?.whatsapp || site.whatsapp);
  const list = cart.items
    .map((item) => formatMessage(messages.lockedPanel.whatsappListItem, { name: item.nama }))
    .join('\n');
  const message = formatMessage(messages.lockedPanel.whatsappMessage, {
    brand: site.brand,
    list,
    orang: cart.orang,
  });
  const href = waLink(whatsappNumber, message);

  const expired = reason === 'expired';
  const used = reason === 'used';

  return (
    <div className="relative mt-5">
      <div
        aria-hidden
        className="pointer-events-none select-none rounded-2xl border border-rose-line bg-white p-5 opacity-40 blur-[1px]"
      >
        <div className="grid grid-cols-2 gap-3">
          {messages.lockedPanel.previewFieldLabels.map((label) => (
            <div key={label}>
              <div className="mb-1 text-xs text-muted">{label}</div>
              <div className="h-9 rounded-xl border border-rose-line bg-rose-soft/40" />
            </div>
          ))}
        </div>
        <div className="mt-3 h-20 rounded-xl border border-rose-line bg-rose-soft/40" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-rose-line bg-white p-6 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft">
            <Lock className="text-rose" size={22} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-ink">
            {expired
              ? messages.lockedPanel.expiredTitle
              : used
                ? messages.lockedPanel.usedTitle
                : messages.lockedPanel.checkTitle}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {expired
              ? messages.lockedPanel.expiredBody
              : used
                ? messages.lockedPanel.usedBody
                : messages.lockedPanel.checkBody}
          </p>
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full justify-center">
            <MessageCircle size={18} /> {messages.lockedPanel.checkButton}
          </a>
          <p className="mt-3 text-[11px] text-muted">{messages.lockedPanel.freeNote}</p>
        </div>
      </div>
    </div>
  );
}

function UnlockedForm({
  cart = { items: [], orang: 1 },
  areas = [],
  settings = null,
  token = '',
  tanggal = '',
  user = null,
  onDone = () => {},
}) {
  const [form, setForm] = useState({
    nama: '',
    telepon: '',
    email: '',
    instagram: '',
    areaId: areas[0]?.id || 'dalam-kota',
    jam: '',
    lokasi: '',
    catatan: '',
  });
  const [orang, setOrang] = useState(cart.orang || 1);
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [copied, setCopied] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (user)
      setForm((prev) => ({
        ...prev,
        nama: prev.nama || user.nama || '',
        email: prev.email || user.email || '',
        telepon: prev.telepon || user.telepon || '',
      }));
  }, [user]);

  const area = areas.find((area) => area.id === form.areaId) || areas[0] || { fee: 0, nama: '' };
  const subtotal = cart.items.reduce((sum, item) => sum + (item.base || 0), 0);
  const total = subtotal * orang + (area.fee || 0);
  const dpPercent = settings?.dpPercent || 50;
  const downPayment = Math.round((total * dpPercent) / 100);
  const bank = settings?.bank || {};
  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  const areaOptions = areas.map((area) => ({
    value: area.id,
    label: `${area.nama} ${area.fee > 0 ? formatMessage(messages.unlockedForm.areaFee, { fee: formatRupiah(area.fee) }) : messages.unlockedForm.areaFree}`,
  }));

  async function copy(key, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch (e) {}
  }

  async function handleProofPick(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setUploadPercent(0);
    try {
      const compressed = await compressImage(file);
      const url = await uploadProof(compressed, (percent) => setUploadPercent(percent));
      setProofUrl(url);
    } catch (e) {
      setUploadError(
        e?.data?.error === 'uploads_not_configured'
          ? messages.unlockedForm.uploadNotConfigured
          : messages.unlockedForm.uploadFailed,
      );
    } finally {
      setUploading(false);
      setUploadPercent(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.nama.trim() || !form.telepon.trim()) return setError(messages.unlockedForm.missingNameOrPhone);
    if (!/^[0-9+]{9,15}$/.test(form.telepon.trim())) return setError(messages.unlockedForm.invalidPhone);
    if (!form.jam) return setError(messages.unlockedForm.missingTime);
    if (!form.lokasi.trim()) return setError(messages.unlockedForm.missingAddress);
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) return setError(messages.unlockedForm.invalidEmail);
    setError('');
    setBusy(true);
    let saved;
    try {
      saved = await saveCartBooking({
        nama: form.nama,
        telepon: form.telepon,
        instagram: form.instagram,
        email: form.email,
        items: cart.items.map((item) => item.id),
        orang,
        areaId: form.areaId,
        jam: form.jam,
        lokasi: form.lokasi,
        catatan: form.catatan,
        token,
        proofUrl,
      });
    } catch (e) {
      setBusy(false);
      return setError(BOOKING_ERROR_MESSAGES[e?.data?.error] || messages.unlockedForm.saveFailed);
    }
    const ref = saved?.id ? `SALIA-${saved.id}` : '';
    let receipt = null;
    try {
      const pdf = await makeReceiptPdf({
        ref,
        nama: form.nama,
        telepon: form.telepon,
        items: cart.items.map((item) => ({ nama: item.nama, base: item.base })),
        orang,
        areaNama: area.nama,
        areaFee: area.fee || 0,
        tanggal,
        jam: form.jam,
        total: saved?.total ?? total,
        dpPercent,
        brand: site.brand,
      });
      receipt = { blob: pdf.blob, filename: pdf.filename };
      const cid = chatCidFor(user);
      const file = new File([pdf.blob], pdf.filename, { type: 'application/pdf' });
      let url = '';
      try {
        url = await uploadReceipt(file);
      } catch (e) {}
      if (url) await sendReceiptToChat(cid, { nama: form.nama, telepon: form.telepon, ref, url }).catch(() => {});
      if (user) await emailReceipt({ ref, filename: pdf.filename, pdfBase64: pdf.base64 }).catch(() => {});
    } catch (e) {}
    setBusy(false);
    onDone(receipt);
  }

  function Row({ label = '', value = '', copyKey = '' }) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-rose-line py-2.5 last:border-0">
        <div>
          <div className="text-xs text-muted">{label}</div>
          <div className="font-semibold text-ink">{value}</div>
        </div>
        {copyKey && (
          <button
            type="button"
            onClick={() => copy(copyKey, value)}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-line px-2.5 py-1.5 text-xs font-medium text-rose hover:bg-rose-soft"
          >
            {copied === copyKey ? (
              <>
                <Check size={13} /> {messages.unlockedForm.copied}
              </>
            ) : (
              <>
                <Copy size={13} /> {messages.unlockedForm.copy}
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
        <CalendarCheck className="shrink-0 text-green-600" size={20} />
        <div className="text-sm">
          <div className="font-semibold text-ink">{messages.unlockedForm.dateLocked}</div>
          <div className="text-muted">{formatTanggal(tanggal)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-line bg-white p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="label">{messages.unlockedForm.nameLabel}</label>
            <input
              className="field"
              value={form.nama}
              onChange={(event) => set('nama', event.target.value)}
              placeholder={messages.unlockedForm.namePlaceholder}
            />
          </div>
          <div>
            <label className="label">{messages.unlockedForm.phoneLabel}</label>
            <input
              className="field"
              inputMode="numeric"
              value={form.telepon}
              onChange={(event) => set('telepon', event.target.value)}
              placeholder={messages.unlockedForm.phonePlaceholder}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="label">
              {messages.unlockedForm.emailLabel} {user ? '' : messages.unlockedForm.emailOptional}
            </label>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(event) => set('email', event.target.value)}
              placeholder={messages.unlockedForm.emailPlaceholder}
            />
          </div>
          <div>
            <label className="label">{messages.unlockedForm.instagramLabel}</label>
            <input
              className="field"
              value={form.instagram}
              onChange={(event) => set('instagram', event.target.value)}
              placeholder={messages.unlockedForm.instagramPlaceholder}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 items-end gap-2.5">
          <div>
            <label className="label">{messages.unlockedForm.peopleLabel}</label>
            <div className="flex items-center justify-between rounded-xl border border-rose-line px-2 py-1">
              <button
                type="button"
                onClick={() => setOrang(Math.max(1, orang - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-rose hover:bg-rose-soft"
              >
                <Minus size={16} />
              </button>
              <span className="text-base font-bold text-ink">{orang}</span>
              <button
                type="button"
                onClick={() => setOrang(Math.min(50, orang + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-rose hover:bg-rose-soft"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="label">{messages.unlockedForm.timeLabel}</label>
            <Select
              value={form.jam}
              onChange={(time) => set('jam', time)}
              options={timeOptions}
              placeholder={messages.unlockedForm.timePlaceholder}
            />
          </div>
        </div>
        <div>
          <label className="label">{messages.unlockedForm.areaLabel}</label>
          <Select
            value={form.areaId}
            onChange={(areaId) => set('areaId', areaId)}
            options={areaOptions}
            placeholder={messages.unlockedForm.areaPlaceholder}
          />
        </div>
        <div>
          <label className="label">{messages.unlockedForm.addressLabel}</label>
          <textarea
            rows={3}
            className="field resize-none"
            value={form.lokasi}
            onChange={(event) => set('lokasi', event.target.value)}
            placeholder={messages.unlockedForm.addressPlaceholder}
          />
        </div>
        <div>
          <label className="label">{messages.unlockedForm.notesLabel}</label>
          <input
            className="field"
            value={form.catatan}
            onChange={(event) => set('catatan', event.target.value)}
            placeholder={messages.unlockedForm.notesPlaceholder}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-rose-soft px-4 py-3">
        <div>
          <div className="text-xs text-muted">
            {formatMessage(messages.unlockedForm.totalLabel, {
              orang,
              shipping: area.fee > 0 ? messages.unlockedForm.totalShipping : '',
            })}
          </div>
          <div className="text-xl font-bold text-rose">{formatRupiah(total)}</div>
        </div>
        <div className="text-right text-[11px] leading-tight text-muted">
          {formatMessage(messages.unlockedForm.downPaymentLabel, { dpPercent })}
          <br />
          {formatRupiah(downPayment)}
        </div>
      </div>

      <div className="rounded-2xl border border-rose-line bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-rose">
          {messages.unlockedForm.payDownPaymentTitle}
        </div>
        <div className="mt-3 rounded-xl border border-rose-line p-4">
          {bank.number ? (
            <>
              <Row label={messages.unlockedForm.bankLabel} value={bank.name || '-'} />
              <Row label={messages.unlockedForm.accountNumberLabel} value={bank.number} copyKey="rek" />
              <Row label={messages.unlockedForm.accountHolderLabel} value={bank.holder || '-'} />
              <Row
                label={formatMessage(messages.unlockedForm.downPaymentLabel, { dpPercent })}
                value={formatRupiah(downPayment)}
                copyKey="dp"
              />
            </>
          ) : (
            <p className="text-sm text-muted">{messages.unlockedForm.bankMissing}</p>
          )}
        </div>
        <div className="mt-3">
          <label className="label">{messages.unlockedForm.proofLabel}</label>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleProofPick} />
          {proofUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={proofUrl}
                alt={messages.unlockedForm.proofAlt}
                className="h-16 w-16 rounded-lg border border-rose-line object-cover"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-sm text-rose hover:underline"
              >
                {messages.unlockedForm.replaceProof}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-rose-soft disabled:opacity-60"
            >
              <Upload size={16} />{' '}
              {uploading
                ? formatMessage(messages.unlockedForm.uploading, { percent: uploadPercent })
                : messages.unlockedForm.uploadProof}
            </button>
          )}
          {uploadError && <p className="mt-1 text-xs text-rose">{uploadError}</p>}
        </div>
      </div>

      {error && <p className="text-sm text-rose">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} {messages.unlockedForm.submit}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        <ShieldCheck size={13} /> {messages.unlockedForm.processingNote}
      </p>
    </form>
  );
}

function DonePanel({ receipt = null, user = null }) {
  function download() {
    if (!receipt) return;
    const url = URL.createObjectURL(receipt.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = receipt.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-rose-line bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto text-rose" size={44} />
        <h1 className="mt-4 text-xl font-bold text-ink">{messages.donePanel.title}</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          {messages.donePanel.bodyBefore}
          <b>{messages.donePanel.bodyBold}</b>
          {user ? messages.donePanel.bodyEmail : ''}
          {messages.donePanel.bodyAfter}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={download}
            disabled={!receipt}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            <Download size={18} /> {messages.donePanel.downloadReceipt}
          </button>
          <Link href="/" className="btn-outline w-full justify-center">
            {messages.donePanel.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
