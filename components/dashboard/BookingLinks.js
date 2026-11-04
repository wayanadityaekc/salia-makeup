'use client';

import { useEffect, useState } from 'react';
import { LinkIcon, Copy, Check, Loader2, Plus } from 'lucide-react';
import { formatTanggal } from '@/lib/utils';
import { createBookingToken, fetchBookingTokens, UnauthorizedError } from '@/lib/storage';
import DatePicker from '@/components/ui/DatePicker';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/dashboard.json';

export default function BookingLinks({ onUnauthorized }) {
  const [tanggal, setTanggal] = useState('');
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [list, setList] = useState([]);
  const [copied, setCopied] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  function fullUrl(path) {
    return path?.startsWith('http') ? path : `${origin}${path || ''}`;
  }

  async function loadBookingTokens() {
    try {
      setList(await fetchBookingTokens());
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
    }
  }
  useEffect(() => {
    loadBookingTokens();
  }, []);

  async function create() {
    if (!tanggal) return setError(messages.bookingLinks.missingDate);
    setError('');
    setBusy(true);
    try {
      await createBookingToken({ tanggal, days: Number(days) || 3 });
      setTanggal('');
      await loadBookingTokens();
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setError(messages.bookingLinks.createFailed);
    } finally {
      setBusy(false);
    }
  }

  async function copy(key, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {}
  }

  function state(bookingToken) {
    if (bookingToken.used_at) return { label: messages.bookingLinks.stateUsed, cls: 'bg-ink/10 text-ink' };
    if (new Date(bookingToken.expires_at) < new Date())
      return { label: messages.bookingLinks.stateExpired, cls: 'bg-rose-soft text-rose' };
    return { label: messages.bookingLinks.stateActive, cls: 'bg-green-100 text-green-700' };
  }

  return (
    <section className="rounded-2xl border border-rose-line bg-white p-5">
      <h3 className="flex items-center gap-2 font-semibold text-ink">
        <LinkIcon size={17} className="text-rose" /> {messages.bookingLinks.title}
      </h3>
      <p className="mt-1 text-sm text-muted">{messages.bookingLinks.description}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <label className="label">{messages.bookingLinks.approvedDate}</label>
          <DatePicker value={tanggal} onChange={setTanggal} />
        </div>
        <div className="w-28">
          <label className="label">{messages.bookingLinks.validDays}</label>
          <input
            type="number"
            min="1"
            max="30"
            className="field"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </div>
        <button onClick={create} disabled={busy} className="btn-primary px-4 py-2.5 text-sm disabled:opacity-60">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {messages.bookingLinks.create}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-rose">{error}</p>}

      {list.length > 0 && (
        <div className="mt-5 space-y-2">
          {list.map((bookingToken) => {
            const tokenState = state(bookingToken);
            const url = fullUrl(`/booking?token=${bookingToken.token}`);
            return (
              <div
                key={bookingToken.token}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-line px-3 py-2.5"
              >
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tokenState.cls}`}>
                  {tokenState.label}
                </span>
                <span className="text-sm font-medium text-ink">{formatTanggal(bookingToken.tanggal)}</span>
                <span className="text-xs text-muted">
                  {formatMessage(messages.bookingLinks.expires, { date: formatTanggal(bookingToken.expires_at) })}
                </span>
                <button
                  onClick={() => copy(bookingToken.token, url)}
                  disabled={bookingToken.used_at || new Date(bookingToken.expires_at) < new Date()}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-rose-line px-2.5 py-1.5 text-xs font-medium text-rose hover:bg-rose-soft disabled:opacity-40"
                >
                  {copied === bookingToken.token ? (
                    <>
                      <Check size={13} /> {messages.bookingLinks.copied}
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> {messages.bookingLinks.copy}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
