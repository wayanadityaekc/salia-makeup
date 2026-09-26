"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Lock, LogOut, Trash2, MessageCircle, CheckCheck, Check, Search,
  CalendarDays, Wallet, Sparkles, Images, Settings,
} from "lucide-react";
import { site } from "@/lib/config";
import { formatRupiah, formatTanggal, normalizeWa, waLink } from "@/lib/utils";
import {
  getBookings,
  updateBooking,
  deleteBooking,
  login as apiLogin,
  getToken,
  clearToken,
  UnauthorizedError,
} from "@/lib/storage";
import ServicesManager from "@/components/dashboard/ServicesManager";
import GalleryManager from "@/components/dashboard/GalleryManager";
import SettingsManager from "@/components/dashboard/SettingsManager";
import IncomeTracker from "@/components/dashboard/IncomeTracker";

const STATUS = {
  baru: { label: "Baru", cls: "bg-rose text-white" },
  konfirmasi: { label: "Dikonfirmasi", cls: "bg-rose-soft text-rose" },
  selesai: { label: "Selesai", cls: "bg-ink/10 text-ink" },
};

// One source of truth for the dashboard sections — used by the top tabs (browser)
// and the bottom bar (installed app). "short" is the compact label for the bar.
const TABS = [
  { key: "booking", label: "Booking", short: "Booking", Icon: CalendarDays },
  { key: "income", label: "Income", short: "Income", Icon: Wallet },
  { key: "layanan", label: "Layanan", short: "Layanan", Icon: Sparkles },
  { key: "galeri", label: "Galeri", short: "Galeri", Icon: Images },
  { key: "pengaturan", label: "Pengaturan", short: "Atur", Icon: Settings },
];

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [filter, setFilter] = useState("semua");
  const [range, setRange] = useState("semua"); // semua | minggu | bulan | tahun
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("booking"); // booking | layanan | galeri
  const [standalone, setStandalone] = useState(false); // true when launched as installed PWA

  useEffect(() => {
    if (getToken()) setAuthed(true);
  }, []);

  // Detect installed-app (standalone) launch so we can show the bottom bar there
  // and the top tabs in the browser. Read after mount to keep SSR markup stable.
  useEffect(() => {
    const check = () =>
      setStandalone(
        window.matchMedia?.("(display-mode: standalone)").matches ||
          window.navigator.standalone === true
      );
    check();
    const mq = window.matchMedia?.("(display-mode: standalone)");
    mq?.addEventListener?.("change", check);
    return () => mq?.removeEventListener?.("change", check);
  }, []);

  // Any 401 means the token is gone/expired: drop back to the login gate.
  const handleUnauthorized = () => {
    clearToken();
    setAuthed(false);
    setErr("Sesi berakhir. Masuk lagi ya.");
  };

  const refresh = async () => {
    setLoading(true);
    setLoadErr("");
    try {
      setList(await getBookings());
    } catch (e) {
      if (e instanceof UnauthorizedError) handleUnauthorized();
      else setLoadErr("Gagal memuat data. Coba muat ulang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await apiLogin(pass);
      setPass("");
      setAuthed(true);
    } catch (e) {
      setErr(e instanceof UnauthorizedError ? "Password salah." : "Gagal masuk. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearToken();
    setAuthed(false);
    setPass("");
  };

  const setStatus = async (id, status) => {
    try {
      await updateBooking(id, { status });
      await refresh();
    } catch (e) {
      if (e instanceof UnauthorizedError) handleUnauthorized();
    }
  };
  const hapus = async (id) => {
    if (!confirm("Hapus booking ini?")) return;
    try {
      await deleteBooking(id);
      await refresh();
    } catch (e) {
      if (e instanceof UnauthorizedError) handleUnauthorized();
    }
  };

  // Bookings within the selected time window (by when they were created).
  const inRange = (b) => {
    if (range === "semua") return true;
    const t = b.createdAt ? new Date(b.createdAt) : null;
    if (!t || isNaN(t)) return false;
    const now = new Date();
    if (range === "tahun") return t.getFullYear() === now.getFullYear();
    if (range === "bulan")
      return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
    if (range === "minggu") {
      // Current week, Monday as the first day.
      const start = new Date(now);
      const dow = (start.getDay() + 6) % 7; // Mon=0 … Sun=6
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - dow);
      return t >= start;
    }
    return true;
  };

  const ranged = useMemo(() => list.filter(inRange), [list, range]);

  const shown = useMemo(() => {
    return ranged
      .filter((b) => (filter === "semua" ? true : b.status === filter))
      .filter((b) =>
        q
          ? (b.nama + b.telepon + (b.serviceNama || "")).toLowerCase().includes(q.toLowerCase())
          : true
      );
  }, [ranged, filter, q]);

  const stats = useMemo(() => {
    const baru = ranged.filter((b) => b.status === "baru").length;
    const pendapatan = ranged
      .filter((b) => b.status === "selesai")
      .reduce((s, b) => s + (b.total || 0), 0);
    return { total: ranged.length, baru, pendapatan };
  }, [ranged]);

  // Gate
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rose-soft px-5">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-rose-line bg-white p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft">
            <Lock className="text-rose" size={22} />
          </div>
          <h1 className="mt-4 text-center text-xl font-bold text-ink">Dashboard {site.brand}</h1>
          <p className="mt-1 text-center text-sm text-muted">Khusus admin. Masukkan password.</p>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password"
            className="field mt-6"
          />
          {err && <p className="mt-2 text-xs text-rose">{err}</p>}
          <button type="submit" disabled={busy} className="btn-primary mt-4 w-full disabled:opacity-60">
            {busy ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </div>
    );
  }

  // Dashboard
  return (
    <div
      className="min-h-screen bg-rose-soft/40"
      // In the installed app, leave room for the fixed bottom bar (+ iPhone inset).
      style={standalone ? { paddingBottom: "calc(68px + env(safe-area-inset-bottom))" } : undefined}
    >
      {/* Sticky header (+ tabs in browser) */}
      <div className="sticky top-0 z-30">
        <header className="border-b border-rose-line bg-white">
          <div className="container-x flex h-16 items-center justify-between">
            <div className="font-bold text-rose">{site.brand} · Admin</div>
            <button onClick={logout} className="inline-flex items-center gap-2 text-sm text-muted hover:text-rose">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </header>

        {/* Top tabs — browser only; the app uses the bottom bar instead */}
        {!standalone && (
          <div className="border-b border-rose-line bg-white">
            <div className="container-x flex gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [touch-action:pan-x] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                    tab === key ? "border-rose text-rose" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {tab === "layanan" && (
        <div className="container-x py-8">
          <ServicesManager onUnauthorized={handleUnauthorized} />
        </div>
      )}

      {tab === "galeri" && (
        <div className="container-x py-8">
          <GalleryManager onUnauthorized={handleUnauthorized} />
        </div>
      )}

      {tab === "income" && (
        <div className="container-x py-8">
          <IncomeTracker onUnauthorized={handleUnauthorized} />
        </div>
      )}

      {tab === "pengaturan" && (
        <div className="container-x py-8">
          <SettingsManager onUnauthorized={handleUnauthorized} />
        </div>
      )}

      <div className={`container-x py-8 ${tab === "booking" ? "" : "hidden"}`}>
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total booking" value={stats.total} />
          <Stat label="Perlu ditangani" value={stats.baru} />
          <Stat label="Pendapatan (selesai)" value={formatRupiah(stats.pendapatan)} />
        </div>

        {/* Filter periode */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ["semua", "Semua"],
            ["minggu", "Minggu ini"],
            ["bulan", "Bulan ini"],
            ["tahun", "Tahun ini"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                range === key ? "bg-rose text-white" : "border border-rose-line bg-white text-ink hover:bg-rose-soft"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Kontrol */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {["semua", "baru", "konfirmasi", "selesai"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${
                  filter === f ? "bg-rose text-white" : "border border-rose-line bg-white text-ink hover:bg-rose-soft"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama / layanan…"
              className="field w-64 pl-9"
            />
          </div>
        </div>

        {/* List */}
        <div className="mt-6 space-y-3">
          {loadErr && (
            <div className="rounded-2xl border border-rose-line bg-white py-4 text-center text-sm text-rose">
              {loadErr}
            </div>
          )}
          {loading && list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-rose-line bg-white py-16 text-center text-sm text-muted">
              Memuat…
            </div>
          )}
          {!loading && shown.length === 0 && (
            <div className="rounded-2xl border border-dashed border-rose-line bg-white py-16 text-center text-sm text-muted">
              Belum ada booking.
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
                    {b.serviceNama}{b.hairdo ? " + Hairdo" : ""} · {b.areaNama}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatTanggal(b.tanggal)} · {b.jam} · {b.telepon}
                  </p>
                  {b.catatan && <p className="mt-1 text-sm text-ink/70">“{b.catatan}”</p>}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-rose">{formatRupiah(b.total)}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-rose-line pt-4">
                <a
                  href={waLink(normalizeWa(b.telepon), `Halo ${b.nama}, terima kasih sudah booking di ${site.brand}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-soft px-3 py-1.5 text-xs font-medium text-rose hover:bg-rose-line"
                >
                  <MessageCircle size={14} /> Chat klien
                </a>
                {b.status !== "konfirmasi" && b.status !== "selesai" && (
                  <button onClick={() => setStatus(b.id, "konfirmasi")} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-soft">
                    <Check size={14} /> Konfirmasi
                  </button>
                )}
                {b.status !== "selesai" && (
                  <button onClick={() => setStatus(b.id, "selesai")} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-soft">
                    <CheckCheck size={14} /> Selesai
                  </button>
                )}
                <button onClick={() => hapus(b.id)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-rose">
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar — installed app only. Drives the same tab state, so no logic
          changes; hidden in the browser so the web layout is untouched. */}
      {standalone && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-line bg-white/95 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Navigasi dashboard"
        >
          <div className="mx-auto flex max-w-content items-stretch justify-around px-2">
            {TABS.map(({ key, short, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                    active ? "text-rose" : "text-muted"
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
