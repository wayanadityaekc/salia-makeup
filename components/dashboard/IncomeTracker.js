"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatRupiah } from "@/lib/utils";
import { getBookings, getSettings, UnauthorizedError } from "@/lib/storage";

const ROSE = "#6B2C3E";
const LINE = "#EAD9DD";
const MUTED = "#8A7B7F";

// Compact IDR for the y-axis (1.5jt / 250rb).
function compact(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}rb`;
  return String(v);
}

export default function IncomeTracker({ onUnauthorized }) {
  const [bookings, setBookings] = useState([]);
  const [areaFee, setAreaFee] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [list, s] = await Promise.all([getBookings(), getSettings()]);
        setBookings(list);
        const map = {};
        (s.areas || []).forEach((a) => { map[a.id] = a.fee || 0; });
        setAreaFee(map);
      } catch (e) {
        if (e instanceof UnauthorizedError) onUnauthorized?.();
        else setErr("Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { monthly, stats } = useMemo(() => {
    // "selesai" = realized income. Build the last 12 months.
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("id-ID", { month: "short" }), income: 0 });
    }
    const byKey = Object.fromEntries(months.map((m) => [m.key, m]));
    const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let totalRealized = 0, thisMonth = 0, countRealized = 0, upcoming = 0, ongkir = 0;
    for (const b of bookings) {
      if (b.status === "konfirmasi") upcoming += b.total || 0;
      if (b.status !== "selesai") continue;
      countRealized++;
      totalRealized += b.total || 0;
      ongkir += areaFee[b.areaId] || 0;
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (byKey[key]) byKey[key].income += b.total || 0;
      if (key === thisKey) thisMonth += b.total || 0;
    }
    return { monthly: months, stats: { totalRealized, thisMonth, countRealized, upcoming, ongkir } };
  }, [bookings, areaFee]);

  if (loading) return <p className="text-sm text-muted">Memuat…</p>;
  if (err) return <p className="text-sm text-rose">{err}</p>;

  const empty = stats.countRealized === 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total pendapatan" value={formatRupiah(stats.totalRealized)} hint="dari booking selesai" />
        <Stat label="Bulan ini" value={formatRupiah(stats.thisMonth)} />
        <Stat label="Booking selesai" value={stats.countRealized} />
        <Stat label="Akan datang" value={formatRupiah(stats.upcoming)} hint="terkonfirmasi, belum selesai" />
      </div>

      <div className="rounded-2xl border border-rose-line bg-white p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-ink">Pendapatan per bulan</h3>
          <span className="text-xs text-muted">termasuk ongkir · 12 bulan terakhir</span>
        </div>
        {empty ? (
          <div className="py-16 text-center text-sm text-muted">
            Belum ada booking selesai. Grafik muncul setelah ada booking yang ditandai “Selesai”.
          </div>
        ) : (
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={LINE} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 12 }} />
                <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={44} tick={{ fill: MUTED, fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(107,44,62,0.06)" }}
                  formatter={(v) => [formatRupiah(v), "Pendapatan"]}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 13 }}
                />
                <Bar dataKey="income" fill={ROSE} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">Ongkir terkumpul (selesai): <span className="font-semibold text-ink">{formatRupiah(stats.ongkir)}</span></p>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-rose-line bg-white p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}
