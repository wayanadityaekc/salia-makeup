"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const HARI = ["M", "S", "S", "R", "K", "J", "S"];

const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

// Custom date picker (no native <input type=date>). value/onChange are "YYYY-MM-DD".
// Dates before `min` (default: today) are disabled.
export default function DatePicker({ value, onChange, invalid = false, placeholder = "Pilih tanggal" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const min = useMemo(() => startOfDay(new Date()), []);
  const selected = value ? startOfDay(new Date(value + "T00:00:00")) : null;
  const [view, setView] = useState(() => {
    const base = selected || min;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const label = selected
    ? selected.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`field flex items-center justify-between gap-2 text-left ${selected ? "text-ink" : "text-muted"} ${invalid ? "!border-rose" : ""}`}
      >
        <span className="truncate">{label}</span>
        <Calendar size={16} className="shrink-0 text-muted" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-[18rem] rounded-xl border border-rose-line bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between px-1">
            <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} className="rounded-lg p-1.5 text-muted hover:bg-rose-soft"><ChevronLeft size={18} /></button>
            <div className="text-sm font-semibold text-ink">{BULAN[month]} {year}</div>
            <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} className="rounded-lg p-1.5 text-muted hover:bg-rose-soft"><ChevronRight size={18} /></button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs text-muted">
            {HARI.map((h, i) => <div key={i} className="py-1">{h}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const disabled = d < min;
              const isSel = selected && toStr(d) === toStr(selected);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(toStr(d)); setOpen(false); }}
                  className={`h-9 rounded-lg text-sm transition ${
                    isSel ? "bg-rose text-white" : disabled ? "text-muted/40" : "text-ink hover:bg-rose-soft"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
