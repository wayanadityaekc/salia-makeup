'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { backdropMotion, dialogMotion, sheetMotion } from '@/lib/motion';
import useBodyLock from '@/lib/useBodyLock';
import { Download, Share, Plus, X, MoreVertical } from 'lucide-react';
import messages from '@/messages/id/pwa.json';

const DISMISS_KEY = 'salia_install_dismissed';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [guide, setGuide] = useState(false);
  useBodyLock(guide);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standalone) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch (e) {}

    const userAgent = navigator.userAgent || '';
    const isIOS = /iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
    const isSafari = /safari/i.test(userAgent) && !/(crios|fxios|chrome|android)/i.test(userAgent);
    setIos(isIOS);
    if (isIOS && isSafari) {
      setShow(true);
      return;
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferred(event);
      setShow(true);
    }
    function onInstalled() {
      setShow(false);
      setGuide(false);
      setDeferred(null);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!guide) return;
    function handleKeyDown(event) {
      if (event.key === 'Escape') setGuide(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guide]);

  async function onInstallClick() {
    if (deferred) {
      deferred.prompt();
      try {
        await deferred.userChoice;
      } catch (e) {}
      setDeferred(null);
      setShow(false);
      return;
    }
    setGuide(true);
  }

  function dismiss() {
    setShow(false);
    setGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch (e) {}
  }

  if (!show) return null;

  return (
    <>
      <m.div
        {...sheetMotion}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-rose-line bg-white/95 backdrop-blur-sm"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="container-x flex items-center gap-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose text-rose-soft">
            <span className="text-base font-semibold">{messages.installPrompt.monogram}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{messages.installPrompt.title}</p>
            <p className="mt-0.5 text-xs text-muted">{messages.installPrompt.subtitle}</p>
          </div>
          <button
            onClick={onInstallClick}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-deep"
          >
            <Download size={16} /> {messages.installPrompt.install}
          </button>
          <button
            onClick={dismiss}
            aria-label={messages.installPrompt.close}
            className="shrink-0 rounded-full p-2 text-muted hover:bg-rose-soft hover:text-rose"
          >
            <X size={18} />
          </button>
        </div>
      </m.div>

      <AnimatePresence>
        {guide && (
          <m.div
            key="install-guide"
            {...backdropMotion}
            className="fixed inset-0 z-60 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
            onClick={() => setGuide(false)}
          >
            <m.div
              {...dialogMotion}
              className="w-full max-w-sm rounded-3xl border border-rose-line bg-white p-6"
              style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink">{messages.installPrompt.guideTitle}</h2>
                <button
                  onClick={() => setGuide(false)}
                  aria-label={messages.installPrompt.close}
                  className="rounded-full p-1.5 text-muted hover:bg-rose-soft hover:text-rose"
                >
                  <X size={18} />
                </button>
              </div>

              {ios ? (
                <ol className="mt-4 space-y-3">
                  <Step number={1}>
                    {messages.installPrompt.iosStepShare.before}
                    <b>{messages.installPrompt.iosStepShare.bold}</b>{' '}
                    <Share size={15} className="mx-0.5 inline align-text-bottom text-rose" />{' '}
                    {messages.installPrompt.iosStepShare.after}
                  </Step>
                  <Step number={2}>
                    {messages.installPrompt.iosStepAdd.before}
                    <b>{messages.installPrompt.iosStepAdd.bold}</b>{' '}
                    <Plus size={15} className="mx-0.5 inline align-text-bottom text-rose" />
                    {messages.installPrompt.iosStepAdd.after}
                  </Step>
                  <Step number={3}>
                    {messages.installPrompt.iosStepConfirm.before}
                    <b>{messages.installPrompt.iosStepConfirm.bold}</b>
                    {messages.installPrompt.iosStepConfirm.after}
                  </Step>
                </ol>
              ) : (
                <ol className="mt-4 space-y-3">
                  <Step number={1}>
                    {messages.installPrompt.androidStepMenu.before}
                    <MoreVertical size={15} className="mx-0.5 inline align-text-bottom text-rose" />{' '}
                    {messages.installPrompt.androidStepMenu.after}
                  </Step>
                  <Step number={2}>
                    {messages.installPrompt.androidStepInstall.before}
                    <b>{messages.installPrompt.androidStepInstall.boldInstall}</b>
                    {messages.installPrompt.androidStepInstall.middle}
                    <b>{messages.installPrompt.androidStepInstall.boldAdd}</b>
                    {messages.installPrompt.androidStepInstall.after}
                  </Step>
                  <Step number={3}>{messages.installPrompt.androidStepConfirm}</Step>
                </ol>
              )}

              <button
                onClick={() => setGuide(false)}
                className="mt-6 w-full rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-deep"
              >
                {messages.installPrompt.understood}
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Step({ number = null, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-soft text-xs font-bold text-rose">
        {number}
      </span>
      <span className="text-sm leading-relaxed text-ink">{children}</span>
    </li>
  );
}
