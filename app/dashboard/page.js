'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Lock,
  LogOut,
  Trash2,
  MessageCircle,
  CheckCheck,
  Check,
  Search,
  CalendarDays,
  Wallet,
  Sparkles,
  Images,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { site } from '@/lib/config';
import { formatRupiah, formatTanggal, normalizeWa, waLink } from '@/lib/utils';
import {
  fetchBookings,
  updateBooking,
  deleteBooking,
  login as apiLogin,
  getToken,
  clearToken,
  UnauthorizedError,
} from '@/lib/storage';
import ServicesManager from '@/components/dashboard/ServicesManager';
import GalleryManager from '@/components/dashboard/GalleryManager';
import SettingsManager from '@/components/dashboard/SettingsManager';
import IncomeTracker from '@/components/dashboard/IncomeTracker';
import ChatManager from '@/components/dashboard/ChatManager';
import BookingLinks from '@/components/dashboard/BookingLinks';
import NotifyToggle from '@/components/pwa/NotifyToggle';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/dashboard.json';

const STATUS = {
  baru: { label: messages.dashboardPage.statusLabels.baru, cls: 'bg-rose text-white' },
  konfirmasi: { label: messages.dashboardPage.statusLabels.konfirmasi, cls: 'bg-rose-soft text-rose' },
  selesai: { label: messages.dashboardPage.statusLabels.selesai, cls: 'bg-ink/10 text-ink' },
};

const TABS = [
  {
    key: 'booking',
    label: messages.dashboardPage.tabs.booking.label,
    short: messages.dashboardPage.tabs.booking.short,
    Icon: CalendarDays,
  },
  {
    key: 'chat',
    label: messages.dashboardPage.tabs.chat.label,
    short: messages.dashboardPage.tabs.chat.short,
    Icon: MessageSquare,
  },
  {
    key: 'income',
    label: messages.dashboardPage.tabs.income.label,
    short: messages.dashboardPage.tabs.income.short,
    Icon: Wallet,
  },
  {
    key: 'layanan',
    label: messages.dashboardPage.tabs.layanan.label,
    short: messages.dashboardPage.tabs.layanan.short,
    Icon: Sparkles,
  },
  {
    key: 'galeri',
    label: messages.dashboardPage.tabs.galeri.label,
    short: messages.dashboardPage.tabs.galeri.short,
    Icon: Images,
  },
  {
    key: 'pengaturan',
    label: messages.dashboardPage.tabs.pengaturan.label,
    short: messages.dashboardPage.tabs.pengaturan.short,
    Icon: Settings,
  },
];

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('semua');
  const [range, setRange] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('booking');
  const [standalone, setStandalone] = useState(false);
  const topRef = useRef(null);
  const [topBarHeight, setTopBarHeight] = useState(0);

  useEffect(() => {
    if (getToken()) setAuthed(true);
  }, []);

  useEffect(() => {
    function check() {
      return setStandalone(
        window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true,
      );
    }
    check();
    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)');
    standaloneQuery?.addEventListener?.('change', check);
    return () => standaloneQuery?.removeEventListener?.('change', check);
  }, []);

  useEffect(() => {
    if (!authed) return;
    const element = topRef.current;
    if (!element) return;
    function measure() {
      return setTopBarHeight(element.offsetHeight);
    }
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [authed, standalone]);

  function handleUnauthorized() {
    clearToken();
    setAuthed(false);
    setError(messages.dashboardPage.sessionExpired);
  }

  async function refresh() {
    setLoading(true);
    setLoadError('');
    try {
      setList(await fetchBookings());
    } catch (e) {
      if (e instanceof UnauthorizedError) handleUnauthorized();
      else setLoadError(messages.dashboardPage.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) refresh();
  }, [authed]);

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiLogin(pass);
      setPass('');
      setAuthed(true);
    } catch (e) {
      setError(
        e instanceof UnauthorizedError ? messages.dashboardPage.wrongPassword : messages.dashboardPage.loginFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearToken();
    setAuthed(false);
    setPass('');
  }

  async function setStatus(id, status) {
    try {
      await updateBooking(id, { status });
      await refresh();
    } catch (e) {
      if (e instanceof UnauthorizedError) handleUnauthorized();
    }
  }
  async function hapus(id) {
    if (!confirm(messages.dashboardPage.confirmDelete)) return;
    try {
      await deleteBooking(id);
      await refresh();
    } catch (e) {
      if (e instanceof UnauthorizedError) handleUnauthorized();
    }
  }

  function inRange(booking) {
    if (range === 'semua') return true;
    const createdDate = booking.createdAt ? new Date(booking.createdAt) : null;
    if (!createdDate || isNaN(createdDate)) return false;
    const now = new Date();
    if (range === 'tahun') return createdDate.getFullYear() === now.getFullYear();
    if (range === 'bulan')
      return createdDate.getFullYear() === now.getFullYear() && createdDate.getMonth() === now.getMonth();
    if (range === 'minggu') {
      const start = new Date(now);
      const dow = (start.getDay() + 6) % 7;
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - dow);
      return createdDate >= start;
    }
    return true;
  }

  const ranged = useMemo(() => list.filter(inRange), [list, range]);

  const shown = useMemo(() => {
    return ranged
      .filter((booking) => (filter === 'semua' ? true : booking.status === filter))
      .filter((booking) =>
        searchQuery
          ? (booking.nama + booking.telepon + (booking.serviceNama || ''))
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          : true,
      );
  }, [ranged, filter, searchQuery]);

  const stats = useMemo(() => {
    const baru = ranged.filter((booking) => booking.status === 'baru').length;
    const pendapatan = ranged
      .filter((booking) => booking.status === 'selesai')
      .reduce((sum, booking) => sum + (booking.total || 0), 0);
    return { total: ranged.length, baru, pendapatan };
  }, [ranged]);

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rose-soft px-5">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-rose-line bg-white p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft">
            <Lock className="text-rose" size={22} />
          </div>
          <h1 className="mt-4 text-center text-xl font-bold text-ink">
            {formatMessage(messages.dashboardPage.loginTitle, { brand: site.brand })}
          </h1>
          <p className="mt-1 text-center text-sm text-muted">{messages.dashboardPage.loginSubtitle}</p>
          <input
            type="password"
            value={pass}
            onChange={(event) => setPass(event.target.value)}
            placeholder={messages.dashboardPage.passwordPlaceholder}
            className="field mt-6"
          />
          {error && <p className="mt-2 text-xs text-rose">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary mt-4 w-full disabled:opacity-60">
            {busy ? messages.dashboardPage.checking : messages.dashboardPage.login}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-rose-soft/40"
      style={standalone && tab !== 'chat' ? { paddingBottom: 'calc(68px + env(safe-area-inset-bottom))' } : undefined}
    >
      <div ref={topRef} className="sticky top-0 z-30">
        <header className="border-b border-rose-line bg-white">
          <div className="container-x flex h-16 items-center justify-between">
            <div className="font-bold text-rose">
              {formatMessage(messages.dashboardPage.headerTitle, { brand: site.brand })}
            </div>
            <button onClick={logout} className="inline-flex items-center gap-2 text-sm text-muted hover:text-rose">
              <LogOut size={16} /> {messages.dashboardPage.logout}
            </button>
          </div>
        </header>

        {!standalone && (
          <div className="border-b border-rose-line bg-white">
            <div className="container-x flex gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [touch-action:pan-x] scrollbar-none [&::-webkit-scrollbar]:hidden">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                    tab === key ? 'border-rose text-rose' : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {tab === 'layanan' && (
        <div className="container-x py-8">
          <ServicesManager onUnauthorized={handleUnauthorized} />
        </div>
      )}

      {tab === 'galeri' && (
        <div className="container-x py-8">
          <GalleryManager onUnauthorized={handleUnauthorized} />
        </div>
      )}

      {tab === 'chat' && (
        <div
          className="container-x py-4"
          style={{
            height: `calc(100dvh - ${topBarHeight}px${standalone ? ' - 68px - env(safe-area-inset-bottom)' : ''})`,
          }}
        >
          <ChatManager onUnauthorized={handleUnauthorized} />
        </div>
      )}

      {tab === 'income' && (
        <div className="container-x py-8">
          <IncomeTracker onUnauthorized={handleUnauthorized} />
        </div>
      )}

      {tab === 'pengaturan' && (
        <div className="container-x space-y-8 py-8">
          <NotifyToggle />
          <SettingsManager onUnauthorized={handleUnauthorized} />
        </div>
      )}

      <div className={`container-x py-8 ${tab === 'booking' ? '' : 'hidden'}`}>
        <div className="mb-6">
          <BookingLinks onUnauthorized={handleUnauthorized} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label={messages.dashboardPage.statTotal} value={stats.total} />
          <Stat label={messages.dashboardPage.statNeedsAction} value={stats.baru} />
          <Stat label={messages.dashboardPage.statIncome} value={formatRupiah(stats.pendapatan)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(messages.dashboardPage.ranges).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                range === key ? 'bg-rose text-white' : 'border border-rose-line bg-white text-ink hover:bg-rose-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {['semua', 'baru', 'konfirmasi', 'selesai'].map((statusFilter) => (
              <button
                key={statusFilter}
                onClick={() => setFilter(statusFilter)}
                className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${
                  filter === statusFilter
                    ? 'bg-rose text-white'
                    : 'border border-rose-line bg-white text-ink hover:bg-rose-soft'
                }`}
              >
                {statusFilter}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={messages.dashboardPage.searchPlaceholder}
              className="field w-64 pl-9"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {loadError && (
            <div className="rounded-2xl border border-rose-line bg-white py-4 text-center text-sm text-rose">
              {loadError}
            </div>
          )}
          {loading && list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-rose-line bg-white py-16 text-center text-sm text-muted">
              {messages.dashboardPage.loading}
            </div>
          )}
          {!loading && shown.length === 0 && (
            <div className="rounded-2xl border border-dashed border-rose-line bg-white py-16 text-center text-sm text-muted">
              {messages.dashboardPage.empty}
            </div>
          )}

          {shown.map((b) => (
            <div key={b.id} className="rounded-2xl border border-rose-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">{b.nama}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS[b.status]?.cls}`}>
                      {STATUS[b.status]?.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {b.serviceNama}
                    {b.hairdo ? messages.dashboardPage.hairdoSuffix : ''}
                    {b.orang > 1 ? formatMessage(messages.dashboardPage.peopleCount, { count: b.orang }) : ''} ·{' '}
                    {b.areaNama}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatMessage(messages.dashboardPage.scheduleLine, {
                      date: formatTanggal(b.tanggal),
                      time: b.jam,
                      phone: b.telepon,
                    })}
                    {b.instagram ? formatMessage(messages.dashboardPage.instagram, { instagram: b.instagram }) : ''}
                    {b.email ? ` · ${b.email}` : ''}
                  </p>
                  {b.catatan && (
                    <p className="mt-1 text-sm text-ink/70">
                      {formatMessage(messages.dashboardPage.note, { note: b.catatan })}
                    </p>
                  )}
                  {b.proofUrl && (
                    <a
                      href={b.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm font-medium text-rose hover:underline"
                    >
                      {messages.dashboardPage.viewProof}
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-rose">{formatRupiah(b.total)}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-rose-line pt-4">
                <a
                  href={waLink(
                    normalizeWa(b.telepon),
                    formatMessage(messages.dashboardPage.whatsappMessage, { name: b.nama, brand: site.brand }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-soft px-3 py-1.5 text-xs font-medium text-rose hover:bg-rose-line"
                >
                  <MessageCircle size={14} /> {messages.dashboardPage.chatClient}
                </a>
                {b.status !== 'konfirmasi' && b.status !== 'selesai' && (
                  <button
                    onClick={() => setStatus(b.id, 'konfirmasi')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-soft"
                  >
                    <Check size={14} /> {messages.dashboardPage.confirm}
                  </button>
                )}
                {b.status !== 'selesai' && (
                  <button
                    onClick={() => setStatus(b.id, 'selesai')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-soft"
                  >
                    <CheckCheck size={14} /> {messages.dashboardPage.complete}
                  </button>
                )}
                <button
                  onClick={() => hapus(b.id)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-rose"
                >
                  <Trash2 size={14} /> {messages.dashboardPage.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {standalone && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-line bg-white/95 backdrop-blur-sm"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label={messages.dashboardPage.navAriaLabel}
        >
          <div className="mx-auto flex max-w-content items-stretch justify-around px-2">
            {TABS.map(({ key, short, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                    active ? 'text-rose' : 'text-muted'
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
                  {short}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-rose-line bg-white p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}
