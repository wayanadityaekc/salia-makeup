'use client';

import { useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import { backdropMotion, dialogMotion } from '@/lib/motion';
import { X, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useUser } from './UserProvider';
import useBodyLock from '@/lib/useBodyLock';
import { formatMessage } from '@/lib/formatMessage';
import { findFormProblem, loginCodeSchema, loginEmailSchema } from '@/lib/formSchemas';
import messages from '@/messages/id/auth.json';

export default function AuthModal({ onClose }) {
  const { requestCode, verifyCode } = useUser();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [nama, setNama] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const codeRef = useRef(null);
  useBodyLock(true);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleCodeRequest(event) {
    event?.preventDefault();
    if (findFormProblem(loginEmailSchema, email, 'invalidEmail')) return setError(messages.authModal.invalidEmail);
    setError('');
    setBusy(true);
    try {
      const result = await requestCode(email.trim());
      setNote(
        result?.delivered === false
          ? messages.authModal.codeCreatedNoEmail
          : formatMessage(messages.authModal.codeSent, { email: email.trim() }),
      );
      setStep('code');
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (e) {
      setError(messages.authModal.sendCodeFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleCodeVerify(event) {
    event?.preventDefault();
    if (findFormProblem(loginCodeSchema, code, 'invalidCode')) return setError(messages.authModal.invalidCode);
    setError('');
    setBusy(true);
    try {
      await verifyCode(email.trim(), code.trim(), nama.trim() || undefined);
      onClose();
    } catch (e) {
      setError(messages.authModal.wrongCode);
    } finally {
      setBusy(false);
    }
  }

  return (
    <m.div
      {...backdropMotion}
      className="fixed inset-0 z-70 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <m.div
        {...dialogMotion}
        className="w-full max-w-sm overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rose-line px-5 py-3">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            {step === 'code' && (
              <button
                onClick={() => {
                  setStep('email');
                  setError('');
                }}
                aria-label={messages.authModal.back}
                className="rounded-full p-0.5 text-muted hover:text-rose"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            {step === 'email' ? messages.authModal.titleEmail : messages.authModal.titleCode}
          </h2>
          <button
            onClick={onClose}
            aria-label={messages.authModal.close}
            className="rounded-full p-1.5 text-muted hover:bg-rose-soft hover:text-rose"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleCodeRequest} className="space-y-3 p-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft">
              <Mail className="text-rose" size={22} />
            </div>
            <p className="text-center text-sm text-muted">{messages.authModal.emailIntro}</p>
            <div>
              <label className="label">{messages.authModal.emailLabel}</label>
              <input
                className="field"
                type="email"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={messages.authModal.emailPlaceholder}
              />
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} {messages.authModal.sendCode}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeVerify} className="space-y-3 p-5">
            {note && <p className="rounded-lg bg-rose-soft/60 px-3 py-2 text-xs text-ink">{note}</p>}
            <div>
              <label className="label">{messages.authModal.codeLabel}</label>
              <input
                ref={codeRef}
                className="field text-center text-lg tracking-[0.4em]"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={messages.authModal.codePlaceholder}
              />
            </div>
            <div>
              <label className="label">{messages.authModal.nameLabel}</label>
              <input
                className="field"
                value={nama}
                onChange={(event) => setNama(event.target.value)}
                placeholder={messages.authModal.namePlaceholder}
              />
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : null} {messages.authModal.signIn}
            </button>
            <p className="text-center text-sm text-muted">
              {messages.authModal.noCodeReceived}{' '}
              <button type="button" onClick={handleCodeRequest} className="font-semibold text-rose hover:underline">
                {messages.authModal.resend}
              </button>
            </p>
          </form>
        )}
      </m.div>
    </m.div>
  );
}
