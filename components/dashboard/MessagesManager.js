"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Trash2, Check, Loader2 } from "lucide-react";
import { site } from "@/lib/config";
import { formatTanggal, waLink, normalizeWa } from "@/lib/utils";
import { getMessages, updateMessage, deleteMessage, UnauthorizedError } from "@/lib/storage";

// Dashboard inbox for web-chat messages left on the site. Owner reads here and
// replies via WhatsApp.
export default function MessagesManager({ onUnauthorized }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      setList(await getMessages());
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setErr("Gagal memuat pesan. Coba muat ulang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (id) => {
    try {
      await updateMessage(id, { status: "dibaca" });
      await refresh();
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
    }
  };
  const hapus = async (id) => {
    if (!confirm("Hapus pesan ini?")) return;
    try {
      await deleteMessage(id);
      await refresh();
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
    }
  };

  const unread = list.filter((m) => m.status === "baru").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Chat masuk</h2>
        {unread > 0 && (
          <span className="rounded-full bg-rose px-2.5 py-0.5 text-xs font-semibold text-white">{unread} baru</span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {err && (
          <div className="rounded-2xl border border-rose-line bg-white py-4 text-center text-sm text-rose">{err}</div>
        )}
        {loading && list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-rose-line bg-white py-16 text-center text-sm text-muted">
            Memuat…
          </div>
        )}
        {!loading && list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-rose-line bg-white py-16 text-center text-sm text-muted">
            Belum ada chat masuk.
          </div>
        )}

        {list.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border bg-white p-5 ${m.status === "baru" ? "border-rose" : "border-rose-line"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-ink">{m.nama}</h3>
                {m.status === "baru" && (
                  <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-white">Baru</span>
                )}
              </div>
              <span className="text-xs text-muted">{formatTanggal(m.createdAt)}</span>
            </div>
            {m.telepon && <p className="mt-0.5 text-sm text-muted">{m.telepon}</p>}
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">{m.pesan}</p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-rose-line pt-4">
              {m.telepon && (
                <a
                  href={waLink(normalizeWa(m.telepon), `Halo ${m.nama}, terima kasih sudah menghubungi ${site.brand}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-soft px-3 py-1.5 text-xs font-medium text-rose hover:bg-rose-line"
                >
                  <MessageCircle size={14} /> Balas via WA
                </a>
              )}
              {m.status === "baru" && (
                <button
                  onClick={() => markRead(m.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-soft"
                >
                  <Check size={14} /> Tandai dibaca
                </button>
              )}
              <button
                onClick={() => hapus(m.id)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-rose"
              >
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
