import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

export default function ServiceCard({ item, badge }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-rose-line bg-white transition hover:shadow-[0_12px_40px_-18px_rgba(107,44,62,0.35)]">
      <div className="foto-ph aspect-[4/3] text-sm">Foto {item.nama}</div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">{item.nama}</h3>
          {badge && (
            <span className="rounded-full bg-rose-soft px-2.5 py-1 text-[11px] font-semibold text-rose">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.ringkas}</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted">Mulai dari</span>
            <div className="text-lg font-bold text-rose">{formatRupiah(item.base)}</div>
          </div>
          <Link
            href={`/booking?service=${item.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-rose transition group-hover:gap-2"
          >
            Booking <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
