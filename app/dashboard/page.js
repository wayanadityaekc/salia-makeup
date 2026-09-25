"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Lock, LogOut, Trash2, MessageCircle, CheckCheck, Check, Search,
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

const STATUS = {
  baru: { label: "Baru", cls: "bg-rose text-white" },
  konfirmasi: { label: "Dikonfirmasi", cls: "bg-rose-soft text-rose" },
  selesai: { label: "Selesai", cls: "bg-ink/10 text-ink" },
};

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [filter, setFilter] = useState("semua");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("booking"); // booking | layanan | galeri

  useEffect(() => {
    if (getToken()) setAuthed(true);
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

  const shown = useMemo(() => {
    return list
      .filter((b) => (filter === "semua" ? true : b.status === filter))
      .filter((b) =>
        q
          ? (b.nama + b.telepon + (b.serviceNama || "")).toLowerCase().includes(q.toLowerCase())
          : true
      );
  }, [list, filter, q]);

  const stats = useMemo(() => {
    const baru = list.filter((b) => b.status === "baru").length;
    const pendapatan = list
      .filter((b) => b.status === "selesai")
      .reduce((s, b) => s + (b.total || 0), 0);
    return { total: list.length, baru, pendapatan };
  }, [list]);

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
    <div className="min-h-screen bg-rose-soft/40">
      <header className="border-b border-rose-line bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <div className="font-bold text-rose">{site.brand} · Admin</div>
          <button onClick={logout} className="inline-flex items-center gap-2 text-sm text-muted hover:text-rose">
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-rose-line bg-white">
        <div className="container-x flex gap-1">
          {[
            ["booking", "Booking"],
            ["layanan", "Layanan"],
            ["galeri", "Galeri"],
            ["pengaturan", "Pengaturan"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === key ? "border-rose text-rose" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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

        {/* Kontrol */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
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
