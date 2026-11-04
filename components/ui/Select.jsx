'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { dropdownMotion } from '@/lib/motion';
import { ChevronDown, Check } from 'lucide-react';
import messages from '@/messages/id/ui.json';

export default function Select({
  value = '',
  onChange = () => {},
  options = [],
  placeholder = messages.select.placeholder,
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const flat = options.flatMap((option) => (option.options ? option.options : [option]));
  const selected = flat.find((option) => option.value === value);

  function pick(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`field flex items-center justify-between gap-2 text-left ${selected ? 'text-ink' : 'text-muted'} ${invalid ? 'border-rose!' : ''}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            key="dropdown"
            {...dropdownMotion}
            role="listbox"
            className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-rose-line bg-white p-1 shadow-lg"
          >
            {options.map((option, index) =>
              option.options ? (
                <div key={index}>
                  <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {option.group}
                  </div>
                  {option.options.map((child) => (
                    <Opt key={child.value} option={child} value={value} onPick={pick} />
                  ))}
                </div>
              ) : (
                <Opt key={option.value} option={option} value={value} onPick={pick} />
              ),
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Opt({ option = null, value = '', onPick = () => {} }) {
  if (!option) return null;
  const sel = option.value === value;
  return (
    <button
      type="button"
      role="option"
      aria-selected={sel}
      onClick={() => onPick(option.value)}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${sel ? 'bg-rose-soft text-rose' : 'text-ink hover:bg-rose-soft/60'}`}
    >
      <span>{option.label}</span>
      {sel && <Check size={15} className="shrink-0" />}
    </button>
  );
}
