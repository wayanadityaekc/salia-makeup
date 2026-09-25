"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

// Custom dropdown (no native <select>). Matches the .field look.
// options: [{ value, label }] or grouped [{ group, options: [{value,label}] }].
export default function Select({ value, onChange, options = [], placeholder = "Pilih…", invalid = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  const flat = [];
  for (const o of options) (o.options ? o.options : [o]).forEach((x) => flat.push(x));
  const selected = flat.find((o) => o.value === value);

  const pick = (v) => { onChange(v); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`field flex items-center justify-between gap-2 text-left ${selected ? "text-ink" : "text-muted"} ${invalid ? "!border-rose" : ""}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-rose-line bg-white p-1 shadow-lg">
          {options.map((o, i) =>
            o.options ? (
              <div key={i}>
                <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">{o.group}</div>
                {o.options.map((x) => <Opt key={x.value} o={x} value={value} onPick={pick} />)}
              </div>
            ) : (
              <Opt key={o.value} o={o} value={value} onPick={pick} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function Opt({ o, value, onPick }) {
  const sel = o.value === value;
  return (
    <button
      type="button"
      role="option"
      aria-selected={sel}
      onClick={() => onPick(o.value)}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${sel ? "bg-rose-soft text-rose" : "text-ink hover:bg-rose-soft/60"}`}
    >
      <span>{o.label}</span>
      {sel && <Check size={15} className="shrink-0" />}
    </button>
  );
}
