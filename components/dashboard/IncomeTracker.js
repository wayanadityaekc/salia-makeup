'use client';

import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatRupiah } from '@/lib/utils';
import { fetchBookings, fetchSettings, UnauthorizedError } from '@/lib/storage';

const ROSE = '#6B2C3E';
const LINE = '#EAD9DD';
const MUTED = '#8A7B7F';

const MONTHS_SHOWN = 12;

function buildMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function compact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return String(value);
}

export default function IncomeTracker({ onUnauthorized }) {
  const [bookings, setBookings] = useState([]);
  const [areaFee, setAreaFee] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [list, siteSettings] = await Promise.all([fetchBookings(), fetchSettings()]);
        setBookings(list);
        const map = {};
        (siteSettings.areas || []).forEach((area) => {
          map[area.id] = area.fee || 0;
        });
        setAreaFee(map);
      } catch (e) {
        if (e instanceof UnauthorizedError) onUnauthorized?.();
        else setError('Gagal memuat data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { monthly, stats } = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: MONTHS_SHOWN }, (_, position) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1 - position), 1);
      return {
        key: buildMonthKey(monthStart),
        label: monthStart.toLocaleDateString('id-ID', { month: 'short' }),
        income: 0,
      };
    });
    const byKey = Object.fromEntries(months.map((month) => [month.key, month]));
    const thisKey = buildMonthKey(now);
    const totals = { totalRealized: 0, thisMonth: 0, countRealized: 0, upcoming: 0, ongkir: 0 };
    bookings.forEach((booking) => {
      const amount = booking.total || 0;
      if (booking.status === 'konfirmasi') totals.upcoming += amount;
      if (booking.status !== 'selesai') return;
      totals.countRealized += 1;
      totals.totalRealized += amount;
      totals.ongkir += areaFee[booking.areaId] || 0;
      const key = buildMonthKey(new Date(booking.createdAt));
      if (byKey[key]) byKey[key].income += amount;
      if (key === thisKey) totals.thisMonth += amount;
    });
    return { monthly: months, stats: totals };
  }, [bookings, areaFee]);

  if (loading) return <p className="text-sm text-muted">Memuat…</p>;
  if (error) return <p className="text-sm text-rose">{error}</p>;

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
                <YAxis
                  tickFormatter={compact}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fill: MUTED, fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(107,44,62,0.06)' }}
                  formatter={(value) => [formatRupiah(value), 'Pendapatan']}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 13 }}
                />
                <Bar dataKey="income" fill={ROSE} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          Ongkir terkumpul (selesai): <span className="font-semibold text-ink">{formatRupiah(stats.ongkir)}</span>
        </p>
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
