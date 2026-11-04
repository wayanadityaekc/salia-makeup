'use client';

import { useEffect, useState } from 'react';
import { Save, Mail, Loader2, Send } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { fetchSettings, updateSettings, fetchEmailPreview, sendTestEmail, UnauthorizedError } from '@/lib/storage';
import { formatMessage } from '@/lib/formatMessage';
import { site } from '@/lib/config';
import messages from '@/messages/id/settings.json';
import ImageUpload from './ImageUpload';

export default function SettingsManager({ onUnauthorized }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setForm(await fetchSettings());
      } catch (e) {
        setError(messages.settingsManager.loadError);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (loading || !form) return <p className="text-sm text-muted">{messages.settingsManager.loading}</p>;

  function setContent(field, value) {
    setForm((current) => ({ ...current, content: { ...(current.content || {}), [field]: value } }));
    setSaved(false);
  }
  function setBank(field, value) {
    setForm((current) => ({ ...current, bank: { ...current.bank, [field]: value } }));
    setSaved(false);
  }
  function setSocial(field, value) {
    setForm((current) => ({ ...current, social: { ...current.social, [field]: value } }));
    setSaved(false);
  }
  function setAreaFee(id, fee) {
    setForm((current) => ({
      ...current,
      areas: current.areas.map((area) => (area.id === id ? { ...area, fee } : area)),
    }));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const savedSettings = await updateSettings({
        dpPercent: Number(form.dpPercent) || 0,
        bank: form.bank,
        areas: form.areas.map((area) => ({ ...area, fee: Number(area.fee) || 0 })),
        social: form.social,
        whatsapp: form.whatsapp || '',
        content: form.content || {},
      });
      setForm(savedSettings);
      setSaved(true);
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setError(messages.settingsManager.saveError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {error && <p className="text-sm text-rose">{error}</p>}

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">{messages.settingsManager.homeContentTitle}</h3>
        <p className="mt-1 text-sm text-muted">{messages.settingsManager.homeContentHint}</p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">{messages.settingsManager.logoLabel}</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-14 w-32 items-center justify-center overflow-hidden rounded-xl border border-rose-line bg-rose-soft/40">
                {form.content?.logo ? (
                  <img
                    src={form.content.logo}
                    alt={messages.settingsManager.logoAlt}
                    className="max-h-12 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold text-rose">{site.brand}</span>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ImageUpload
                onUploaded={(url) => setContent('logo', url)}
                onUnauthorized={onUnauthorized}
                label={
                  form.content?.logo ? messages.settingsManager.replaceImage : messages.settingsManager.uploadImage
                }
              />
              {form.content?.logo && (
                <button
                  type="button"
                  onClick={() => setContent('logo', '')}
                  className="text-xs text-muted hover:text-rose"
                >
                  {messages.settingsManager.removeImage}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="label">{messages.settingsManager.heroPhotoLabel}</label>
            <div className="mt-1 aspect-4/3 w-full overflow-hidden rounded-xl border border-rose-line bg-rose-soft/40">
              {form.content?.heroPhoto ? (
                <img
                  src={form.content.heroPhoto}
                  alt={messages.settingsManager.heroPhotoAlt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="foto-ph h-full w-full text-xs">{messages.settingsManager.noPhoto}</div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ImageUpload
                onUploaded={(url) => setContent('heroPhoto', url)}
                onUnauthorized={onUnauthorized}
                label={
                  form.content?.heroPhoto ? messages.settingsManager.replaceImage : messages.settingsManager.uploadImage
                }
              />
              {form.content?.heroPhoto && (
                <button
                  type="button"
                  onClick={() => setContent('heroPhoto', '')}
                  className="text-xs text-muted hover:text-rose"
                >
                  {messages.settingsManager.removeImage}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="label">{messages.settingsManager.heroKickerLabel}</label>
            <input
              className="field"
              placeholder={messages.settingsManager.heroKickerPlaceholder}
              value={form.content?.heroKicker || ''}
              onChange={(event) => setContent('heroKicker', event.target.value)}
            />
          </div>
          <div>
            <label className="label">{messages.settingsManager.heroTitleLabel}</label>
            <input
              className="field"
              placeholder={messages.settingsManager.heroTitlePlaceholder}
              value={form.content?.heroTitle || ''}
              onChange={(event) => setContent('heroTitle', event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">{messages.settingsManager.dpTitle}</h3>
        <p className="mt-1 text-sm text-muted">{messages.settingsManager.dpHint}</p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            className="field w-28"
            value={form.dpPercent}
            onChange={(event) => {
              setForm((current) => ({ ...current, dpPercent: event.target.value }));
              setSaved(false);
            }}
          />
          <span className="text-sm text-ink">{messages.settingsManager.dpSuffix}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">{messages.settingsManager.whatsappTitle}</h3>
        <p className="mt-1 text-sm text-muted">{messages.settingsManager.whatsappHint}</p>
        <input
          className="field mt-3 sm:w-72"
          placeholder={messages.settingsManager.whatsappPlaceholder}
          value={form.whatsapp || ''}
          onChange={(event) => {
            setForm((current) => ({ ...current, whatsapp: event.target.value }));
            setSaved(false);
          }}
        />
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">{messages.settingsManager.bankTitle}</h3>
        <p className="mt-1 text-sm text-muted">{messages.settingsManager.bankHint}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">{messages.settingsManager.bankNameLabel}</label>
            <input
              className="field"
              placeholder={messages.settingsManager.bankNamePlaceholder}
              value={form.bank.name}
              onChange={(event) => setBank('name', event.target.value)}
            />
          </div>
          <div>
            <label className="label">{messages.settingsManager.bankNumberLabel}</label>
            <input
              className="field"
              placeholder={messages.settingsManager.bankNumberPlaceholder}
              value={form.bank.number}
              onChange={(event) => setBank('number', event.target.value)}
            />
          </div>
          <div>
            <label className="label">{messages.settingsManager.bankHolderLabel}</label>
            <input
              className="field"
              placeholder={messages.settingsManager.bankHolderPlaceholder}
              value={form.bank.holder}
              onChange={(event) => setBank('holder', event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">{messages.settingsManager.areaFeeTitle}</h3>
        <p className="mt-1 text-sm text-muted">{messages.settingsManager.areaFeeHint}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {form.areas.map((area) => (
            <div key={area.id}>
              <label className="label">{area.nama}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  {messages.settingsManager.currencyPrefix}
                </span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="field pl-9 text-right"
                  value={area.fee}
                  onChange={(event) => setAreaFee(area.id, event.target.value)}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted">
                {Number(area.fee) > 0 ? formatRupiah(Number(area.fee)) : messages.settingsManager.freeFee}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">{messages.settingsManager.socialTitle}</h3>
        <p className="mt-1 text-sm text-muted">{messages.settingsManager.socialHint}</p>
        <div className="mt-3 grid gap-3">
          <div>
            <label className="label">{messages.settingsManager.instagramLabel}</label>
            <input
              className="field"
              placeholder={messages.settingsManager.instagramPlaceholder}
              value={form.social.instagram}
              onChange={(event) => setSocial('instagram', event.target.value)}
            />
          </div>
          <div>
            <label className="label">{messages.settingsManager.tiktokLabel}</label>
            <input
              className="field"
              placeholder={messages.settingsManager.tiktokPlaceholder}
              value={form.social.tiktok}
              onChange={(event) => setSocial('tiktok', event.target.value)}
            />
          </div>
          <div>
            <label className="label">{messages.settingsManager.googleLabel}</label>
            <input
              className="field"
              placeholder={messages.settingsManager.googlePlaceholder}
              value={form.social.google}
              onChange={(event) => setSocial('google', event.target.value)}
            />
          </div>
        </div>
      </section>

      <EmailPreview onUnauthorized={onUnauthorized} />

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary px-5 disabled:opacity-60">
          <Save size={16} />{' '}
          {saved
            ? messages.settingsManager.saved
            : busy
              ? messages.settingsManager.saving
              : messages.settingsManager.save}
        </button>
      </div>
    </div>
  );
}

function EmailPreview({ onUnauthorized }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  async function loadEmailPreview() {
    setLoading(true);
    setStatusMessage('');
    try {
      setData(await fetchEmailPreview());
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setStatusMessage(messages.emailPreview.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function test() {
    if (!recipient.trim()) return setStatusMessage(messages.emailPreview.missingRecipient);
    setSending(true);
    setStatusMessage('');
    try {
      const result = await sendTestEmail(recipient.trim());
      if (result?.ok) setStatusMessage(messages.emailPreview.testSent);
      else if (result?.skipped) setStatusMessage(messages.emailPreview.resendSkipped);
      else
        setStatusMessage(
          formatMessage(messages.emailPreview.sendFailed, {
            error: result?.error || messages.emailPreview.sendFailedFallback,
          }),
        );
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setStatusMessage(messages.emailPreview.testError);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-line bg-white p-5">
      <h3 className="flex items-center gap-2 font-semibold text-ink">
        <Mail size={17} className="text-rose" /> {messages.emailPreview.title}
      </h3>
      <p className="mt-1 text-sm text-muted">{messages.emailPreview.hint}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={loadEmailPreview}
          disabled={loading}
          className="btn-outline px-4 py-2 text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}{' '}
          {data ? messages.emailPreview.reloadPreview : messages.emailPreview.showPreview}
        </button>
        {data && (
          <span className={`text-xs ${data.emailConfigured ? 'text-green-600' : 'text-muted'}`}>
            {data.emailConfigured ? messages.emailPreview.resendActive : messages.emailPreview.resendInactive}
          </span>
        )}
      </div>

      {data && (
        <>
          <div className="mt-3 text-xs text-muted">
            {messages.emailPreview.subjectLabel} <span className="font-medium text-ink">{data.subject}</span>
          </div>
          <iframe
            title={messages.emailPreview.iframeTitle}
            srcDoc={data.html}
            className="mt-2 h-[520px] w-full rounded-xl border border-rose-line bg-white"
          />
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]">
              <label className="label">{messages.emailPreview.recipientLabel}</label>
              <input
                className="field"
                type="email"
                placeholder={messages.emailPreview.recipientPlaceholder}
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={test}
              disabled={sending}
              className="btn-primary px-4 py-2.5 text-sm disabled:opacity-60"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}{' '}
              {messages.emailPreview.sendTest}
            </button>
          </div>
        </>
      )}
      {statusMessage && <p className="mt-2 text-xs text-ink/70">{statusMessage}</p>}
    </section>
  );
}
