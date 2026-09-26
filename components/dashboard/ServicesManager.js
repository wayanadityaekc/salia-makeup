"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, EyeOff } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import Select from "@/components/ui/Select";
import {
  getServicesAdmin,
  createService,
  updateService,
  deleteService,
  UnauthorizedError,
} from "@/lib/storage";
import ImageUpload from "./ImageUpload";

export default function ServicesManager({ onUnauthorized }) {
  const [groups, setGroups] = useState({ services: [], hairdo: [], nailArt: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const guard = (e) => {
    if (e instanceof UnauthorizedError) onUnauthorized?.();
    else setErr("Terjadi kesalahan. Coba lagi.");
  };

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const d = await getServicesAdmin();
      setGroups({ services: d.services, hairdo: d.hairdo || [], nailArt: d.nailArt });
    } catch (e) {
      guard(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      {err && <p className="text-sm text-rose">{err}</p>}
      <AddService onDone={refresh} onUnauthorized={onUnauthorized} />

      <Group title="Make Up" items={groups.services} onChange={refresh} onUnauthorized={onUnauthorized} />
      <Group title="Hairdo" items={groups.hairdo} onChange={refresh} onUnauthorized={onUnauthorized} />
      <Group title="Nail Art" items={groups.nailArt} onChange={refresh} onUnauthorized={onUnauthorized} />

      {loading && <p className="text-sm text-muted">Memuat…</p>}
    </div>
  );
}

function Group({ title, items, onChange, onUnauthorized }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{title}</h3>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted">Belum ada layanan.</p>}
        {items.map((s) => (
          <ServiceRow key={s.id} svc={s} onChange={onChange} onUnauthorized={onUnauthorized} />
        ))}
      </div>
    </div>
  );
}

function ServiceRow({ svc, onChange, onUnauthorized }) {
  const [form, setForm] = useState({
    nama: svc.nama,
    ringkas: svc.ringkas || "",
    deskripsi: svc.deskripsi || "",
    detail: svc.detail || "",
    info: svc.info || "",
    base: svc.base,
    foto: svc.foto || "",
    hairdoIncluded: svc.hairdoIncluded === true,
    active: svc.active,
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const isMakeup = svc.kind === "makeup";

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  const guard = (e) => {
    if (e instanceof UnauthorizedError) onUnauthorized?.();
    else alert("Gagal menyimpan. Coba lagi.");
  };

  const save = async () => {
    setBusy(true);
    try {
      await updateService(svc.id, {
        nama: form.nama,
        ringkas: form.ringkas,
        deskripsi: form.deskripsi,
        detail: form.detail,
        info: form.info,
        base: form.base,
        foto: form.foto || null,
        hairdo_included: isMakeup ? form.hairdoIncluded : null,
        active: form.active,
      });
      setSaved(true);
    } catch (e) {
      guard(e);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Hapus layanan "${svc.nama}"?`)) return;
    setBusy(true);
    try {
      await deleteService(svc.id);
      onChange();
    } catch (e) {
      guard(e);
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-rose-line bg-white p-4 ${form.active ? "" : "opacity-70"}`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Foto */}
        <div className="sm:w-40 shrink-0">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-rose-line bg-rose-soft">
            {form.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.foto} alt={form.nama} className="h-full w-full object-cover" />
            ) : (
              <div className="foto-ph h-full w-full text-xs">Belum ada foto</div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ImageUpload onUploaded={(url) => set("foto", url)} onUnauthorized={onUnauthorized} label={form.foto ? "Ganti" : "Upload"} />
            {form.foto && (
              <button type="button" onClick={() => set("foto", "")} className="text-xs text-muted hover:text-rose">
                Hapus foto
              </button>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Nama</label>
              <input className="field" value={form.nama} onChange={(e) => set("nama", e.target.value)} />
            </div>
            <div>
              <label className="label">Harga (Rp)</label>
              <input
                type="number"
                min="0"
                className="field"
                value={form.base}
                onChange={(e) => set("base", e.target.value)}
              />
              <p className="mt-1 text-xs text-muted">{formatRupiah(Number(form.base) || 0)}</p>
            </div>
          </div>
          <div>
            <label className="label">Deskripsi singkat</label>
            <input className="field" value={form.ringkas} onChange={(e) => set("ringkas", e.target.value)} />
          </div>
          <div>
            <label className="label">Deskripsi lengkap (tampil di card)</label>
            <textarea rows={3} className="field resize-none" value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} placeholder="Penjelasan lebih panjang tentang layanan ini." />
          </div>
          <div>
            <label className="label">Detail (satu poin per baris)</label>
            <textarea rows={3} className="field resize-none" value={form.detail} onChange={(e) => set("detail", e.target.value)} placeholder={"mis.\nTermasuk konsultasi look\nProduk tahan lama\nBisa datang ke lokasi"} />
          </div>
          <div>
            <label className="label">Detail produk (tampil di popup)</label>
            <textarea rows={3} className="field resize-none" value={form.info} onChange={(e) => set("info", e.target.value)} placeholder="Info produk yang dipakai, brand, ketahanan, syarat, dll." />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {isMakeup && (
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-rose"
                  checked={form.hairdoIncluded}
                  onChange={(e) => set("hairdoIncluded", e.target.checked)}
                />
                Sudah termasuk hairdo
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-rose"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
              />
              Tampil di web
            </label>
            {!form.active && (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <EyeOff size={12} /> disembunyikan
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button onClick={save} disabled={busy} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
                <Save size={15} /> {saved ? "Tersimpan" : "Simpan"}
              </button>
              <button onClick={remove} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:text-rose">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddService({ onDone, onUnauthorized }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ kind: "makeup", nama: "", base: "", ringkas: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) return;
    setBusy(true);
    try {
      await createService({
        kind: form.kind,
        nama: form.nama.trim(),
        base: Number(form.base) || 0,
        ringkas: form.ringkas.trim() || null,
      });
      setForm({ kind: "makeup", nama: "", base: "", ringkas: "" });
      setOpen(false);
      onDone();
    } catch (e2) {
      if (e2 instanceof UnauthorizedError) onUnauthorized?.();
      else alert(e2?.data?.error === "id_exists" ? "Nama layanan sudah ada." : "Gagal menambah layanan.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline px-4 py-2 text-sm">
        <Plus size={16} /> Tambah layanan
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-rose-line bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Kategori</label>
          <Select
            value={form.kind}
            onChange={(v) => setForm({ ...form, kind: v })}
            options={[{ value: "makeup", label: "Make Up" }, { value: "hairdo", label: "Hairdo" }, { value: "nail", label: "Nail Art" }]}
          />
        </div>
        <div>
          <label className="label">Nama layanan</label>
          <input className="field" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="mis. Prewedding" />
        </div>
        <div>
          <label className="label">Harga (Rp)</label>
          <input type="number" min="0" className="field" value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} placeholder="0" />
        </div>
        <div>
          <label className="label">Deskripsi singkat</label>
          <input className="field" value={form.ringkas} onChange={(e) => setForm({ ...form, ringkas: e.target.value })} placeholder="opsional" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline px-4 py-2 text-sm">
          Batal
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Foto bisa ditambahkan setelah layanan dibuat.</p>
    </form>
  );
}
