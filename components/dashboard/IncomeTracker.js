'use client';

import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatRupiah } from '@/lib/utils';
import { fetchBookings, fetchSettings, UnauthorizedError } from '@/lib/storage';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/dashboard.json';

const ROSE = '#6B2C3E';
const LINE = '#EAD9DD';
const MUTED = '#8A7B7F';

const MONTHS_SHOWN = 12;

function buildMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function compact(value) {
  if (value >= 1_000_000)
    return formatMessage(messages.incomeTracker.compactMillion, {
      value: (value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }),
    });
  if (value >= 1_000)
    return formatMessage(messages.incomeTracker.compactThousand, { value: Math.round(value / 1_000) });
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
        else setError(messages.incomeTracker.loadFailed);
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

  if (loading) return <p className="text-sm text-muted">{messages.incomeTracker.loading}</p>;
  if (error) return <p className="text-sm text-rose">{error}</p>;

  const empty = stats.countRealized === 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={messages.incomeTracker.statTotal}
          value={formatRupiah(stats.totalRealized)}
          hint={messages.incomeTracker.statTotalHint}
        />
        <Stat label={messages.incomeTracker.statThisMonth} value={formatRupiah(stats.thisMonth)} />
        <Stat label={messages.incomeTracker.statCompleted} value={stats.countRealized} />
        <Stat
          label={messages.incomeTracker.statUpcoming}
          value={formatRupiah(stats.upcoming)}
          hint={messages.incomeTracker.statUpcomingHint}
        />
      </div>

      <div className="rounded-2xl border border-rose-line bg-white p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-ink">{messages.incomeTracker.chartTitle}</h3>
          <span className="text-xs text-muted">
            {formatMessage(messages.incomeTracker.chartSubtitle, { months: MONTHS_SHOWN })}
          </span>
        </div>
        {empty ? (
          <div className="py-16 text-center text-sm text-muted">{messages.incomeTracker.chartEmpty}</div>
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
                  formatter={(value) => [formatRupiah(value), messages.incomeTracker.tooltipLabel]}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 13 }}
                />
                <Bar dataKey="income" fill={ROSE} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          {messages.incomeTracker.ongkirCollected}{' '}
          <span className="font-semibold text-ink">{formatRupiah(stats.ongkir)}</span>
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
