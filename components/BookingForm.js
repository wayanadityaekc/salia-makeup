"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Send, Copy, Check, Upload } from "lucide-react";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import {
  services as cfgServices,
  nailArt as cfgNailArt,
  areas as cfgAreas,
  hairdoAddon as cfgAddon,
  site,
} from "@/lib/config";
import { formatRupiah, formatTanggal, waLink, normalizeWa } from "@/lib/utils";
import { saveBooking, getServicesData, getSettings, uploadProof } from "@/lib/storage";
import { compressImage } from "@/lib/image";

export default function BookingForm() {
  const params = useSearchParams();
  const [step, setStep] = useState("form"); // form | pay | done
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [booked, setBooked] = useState(null); // snapshot for the pay step + WA

  // Live catalog + settings (bank, DP %). Start from static config so the form
  // works before the fetch resolves / if the API is down.
  const [catalog, setCatalog] = useState({
    services: cfgServices,
    nailArt: cfgNailArt,
    areas: cfgAreas,
    hairdoAddon: cfgAddon,
  });
  const [settings, setSettings] = useState({
    dpPercent: 50,
    bank: { name: "", number: "", holder: "" },
  });
  useEffect(() => {
    getServicesData().then((d) => {
      if (d && (d.services.length || d.nailArt.length)) setCatalog(d);
    });
    getSettings().then((s) => setSettings(s));
  }, []);
  const { services, nailArt, areas, hairdoAddon } = catalog;
  const findService = (id) => [...services, ...nailArt].find((s) => s.id === id) || null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nama: "", telepon: "", serviceId: "", hairdo: false,
      areaId: "dalam-kota", tanggal: "", jam: "", lokasi: "", catatan: "",
    },
  });

  useEffect(() => {
    const q = params.get("service");
    if (q && findService(q)) setValue("serviceId", q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, setValue, catalog]);

  const serviceId = watch("serviceId");
  const areaId = watch("areaId");
  const hairdo = watch("hairdo");

  const service = findService(serviceId);
  const area = areas.find((a) => a.id === areaId);
  const bisaHairdo = !!service && service.hairdoIncluded === false;
  const total =
    (service?.base || 0) + (area?.fee || 0) + (bisaHairdo && hairdo ? hairdoAddon : 0);

  // Options for the custom controls (no native select/date).
  const serviceOptions = [
    { group: "Make Up", options: services.map((s) => ({ value: s.id, label: `${s.nama} — ${formatRupiah(s.base)}` })) },
    { group: "Nail Art", options: nailArt.map((n) => ({ value: n.id, label: `${n.nama} — ${formatRupiah(n.base)}` })) },
  ];
  const areaOptions = areas.map((a) => ({
    value: a.id,
    label: `${a.nama} ${a.fee > 0 ? `(+ ${formatRupiah(a.fee)})` : "(Gratis)"}`,
  }));
  const timeOptions = [];
  for (let h = 6; h <= 21; h++) for (const m of [0, 30]) {
    const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    timeOptions.push({ value: t, label: t });
  }

  const onSubmit = async (data) => {
    const svc = findService(data.serviceId);
    const ar = areas.find((a) => a.id === data.areaId);
    const pakaiHairdo = !!svc && svc.hairdoIncluded === false && data.hairdo;

    setSubmitting(true);
    setSubmitErr("");
    let saved;
    try {
      saved = await saveBooking({
        nama: data.nama, telepon: data.telepon, serviceId: data.serviceId,
        hairdo: !!pakaiHairdo, areaId: data.areaId, tanggal: data.tanggal,
        jam: data.jam, lokasi: data.lokasi, catatan: data.catatan,
      });
    } catch (e) {
      setSubmitting(false);
      setSubmitErr("Gagal menyimpan booking. Cek koneksi lalu coba lagi, atau hubungi kami langsung via WhatsApp.");
      return;
    }
    setBooked({
      ...data,
      serviceNama: svc?.nama,
      areaNama: ar?.nama,
      pakaiHairdo,
      total: saved?.total ?? total,
    });
    setSubmitting(false);
    setStep("pay");
  };

  const restart = () => {
    reset();
    setBooked(null);
    setStep("form");
    setSubmitErr("");
  };

  // ---- Step: pay ----
  if (step === "pay" && booked) {
    return <PayStep booked={booked} settings={settings} onSent={() => setStep("done")} onBack={restart} />;
  }

  // ---- Step: done ----
  if (step === "done") {
    return (
      <div className="rounded-2xl border border-rose-line bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto text-rose" size={44} />
        <h3 className="mt-4 text-xl font-bold text-ink">Booking terkirim!</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Kami sudah mengarahkanmu ke WhatsApp untuk konfirmasi. Kalau belum
          terbuka, hubungi kami langsung ya.
        </p>
        <button onClick={restart} className="btn-outline mt-6">Booking lagi</button>
      </div>
    );
  }

  // ---- Step: form ----
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 rounded-2xl border border-rose-line bg-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Nama lengkap</label>
          <input className="field" placeholder="Nama kamu" {...register("nama", { required: "Nama wajib diisi" })} />
          {errors.nama && <p className="mt-1 text-xs text-rose">{errors.nama.message}</p>}
        </div>
        <div>
          <label className="label">No. WhatsApp</label>
          <input className="field" placeholder="08xxxxxxxxxx" inputMode="numeric"
            {...register("telepon", { required: "Nomor wajib diisi", pattern: { value: /^[0-9+]{9,15}$/, message: "Nomor tidak valid" } })} />
          {errors.telepon && <p className="mt-1 text-xs text-rose">{errors.telepon.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Pilih layanan</label>
        <Controller
          name="serviceId"
          control={control}
          rules={{ required: "Pilih salah satu layanan" }}
          render={({ field }) => (
            <Select value={field.value} onChange={field.onChange} options={serviceOptions} placeholder="— Pilih layanan —" invalid={!!errors.serviceId} />
          )}
        />
        {errors.serviceId && <p className="mt-1 text-xs text-rose">{errors.serviceId.message}</p>}
      </div>

      {bisaHairdo && (
        <label className="flex items-center gap-3 rounded-xl border border-rose-line bg-rose-soft/50 px-4 py-3">
          <input type="checkbox" className="h-4 w-4 accent-rose" {...register("hairdo")} />
          <span className="text-sm text-ink">Tambah hairdo (+ {formatRupiah(hairdoAddon)})</span>
        </label>
      )}

      <div>
        <label className="label">Area / lokasi</label>
        <Controller
          name="areaId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onChange={field.onChange} options={areaOptions} placeholder="Pilih area" />
          )}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Tanggal</label>
          <Controller
            name="tanggal"
            control={control}
            rules={{ required: "Pilih tanggal" }}
            render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} invalid={!!errors.tanggal} />}
          />
          {errors.tanggal && <p className="mt-1 text-xs text-rose">{errors.tanggal.message}</p>}
        </div>
        <div>
          <label className="label">Jam</label>
          <Controller
            name="jam"
            control={control}
            rules={{ required: "Pilih jam" }}
            render={({ field }) => (
              <Select value={field.value} onChange={field.onChange} options={timeOptions} placeholder="— Pilih jam —" invalid={!!errors.jam} />
            )}
          />
          {errors.jam && <p className="mt-1 text-xs text-rose">{errors.jam.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Alamat / patokan (opsional)</label>
        <input className="field" placeholder="Alamat kalau minta datang ke lokasi" {...register("lokasi")} />
      </div>

      <div>
        <label className="label">Catatan (opsional)</label>
        <textarea rows={3} className="field resize-none" placeholder="Referensi look, tema acara, dll." {...register("catatan")} />
      </div>

      <div className="rounded-xl bg-rose-soft p-4">
        <div className="flex items-center justify-between text-sm text-muted"><span>Estimasi total</span></div>
        <div className="mt-1 text-2xl font-bold text-rose">{formatRupiah(total)}</div>
        <p className="mt-1 text-xs text-muted">DP {settings.dpPercent}% untuk mengunci jadwal. Sisanya dibayar saat hari-H.</p>
      </div>

      {submitErr && <p className="text-sm text-rose">{submitErr}</p>}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Memproses…" : "Book & lanjut bayar DP"} <Send size={18} />
      </button>
    </form>
  );
}

// ---- Payment step: show bank + DP, upload proof (optional), then WA ----
function PayStep({ booked, settings, onSent, onBack }) {
  const dpAmount = Math.round((booked.total * (settings.dpPercent || 50)) / 100);
  const bank = settings.bank || {};
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);
  const [copied, setCopied] = useState("");

  const copy = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };

  const onPickProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr("");
    try {
      const compressed = await compressImage(file);
      const url = await uploadProof(compressed);
      setProofUrl(url);
    } catch (e2) {
      setUploadErr(e2?.data?.error === "uploads_not_configured" ? "Upload belum aktif — kirim bukti via WhatsApp saja." : "Gagal upload. Coba lagi atau kirim bukti via WhatsApp.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sendWa = () => {
    const b = booked;
    const pesan =
      `Halo ${site.brand}, saya mau booking:\n\n` +
      `Nama: ${b.nama}\n` +
      `No. HP: ${b.telepon}\n` +
      `Layanan: ${b.serviceNama}\n` +
      (b.pakaiHairdo ? `Tambah hairdo: Ya\n` : ``) +
      `Area: ${b.areaNama}\n` +
      `Tanggal: ${formatTanggal(b.tanggal)}\n` +
      `Jam: ${b.jam}\n` +
      (b.lokasi ? `Lokasi: ${b.lokasi}\n` : ``) +
      (b.catatan ? `Catatan: ${b.catatan}\n` : ``) +
      `\nTotal: ${formatRupiah(b.total)}\n` +
      `DP ${settings.dpPercent}%: ${formatRupiah(dpAmount)}\n` +
      (proofUrl ? `\nBukti transfer: ${proofUrl}` : `\n(Bukti transfer menyusul)`);
    window.open(waLink(normalizeWa(settings.whatsapp || site.whatsapp), pesan), "_blank");
    onSent();
  };

  const Row = ({ label, value, copyKey }) => (
    <div className="flex items-center justify-between gap-3 border-b border-rose-line py-2.5 last:border-0">
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="font-semibold text-ink">{value}</div>
      </div>
      {copyKey && (
        <button type="button" onClick={() => copy(copyKey, value)}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-line px-2.5 py-1.5 text-xs font-medium text-rose hover:bg-rose-soft">
          {copied === copyKey ? <><Check size={13} /> Tersalin</> : <><Copy size={13} /> Salin</>}
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-5 rounded-2xl border border-rose-line bg-white p-6 sm:p-8">
      <div>
        <h3 className="text-xl font-bold text-ink">Bayar DP untuk kunci jadwal</h3>
        <p className="mt-1 text-sm text-muted">Transfer DP di bawah, lalu upload bukti (opsional) & lanjut ke WhatsApp.</p>
      </div>

      {/* DP amount */}
      <div className="rounded-xl bg-rose-soft p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">DP {settings.dpPercent}% dari {formatRupiah(booked.total)}</div>
            <div className="mt-0.5 text-2xl font-bold text-rose">{formatRupiah(dpAmount)}</div>
          </div>
          <button type="button" onClick={() => copy("dp", String(dpAmount))}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-line bg-white px-3 py-2 text-xs font-medium text-rose hover:bg-rose-soft">
            {copied === "dp" ? <><Check size={14} /> Tersalin</> : <><Copy size={14} /> Salin nominal</>}
          </button>
        </div>
      </div>

      {/* Bank */}
      <div className="rounded-xl border border-rose-line p-4">
        {bank.number ? (
          <>
            <Row label="Bank" value={bank.name || "-"} />
            <Row label="No. Rekening" value={bank.number} copyKey="rek" />
            <Row label="Atas Nama" value={bank.holder || "-"} />
          </>
        ) : (
          <p className="text-sm text-muted">Nomor rekening belum diatur. Lanjut ke WhatsApp, admin akan kirim detail pembayaran.</p>
        )}
      </div>

      {/* Proof upload (optional) */}
      <div>
        <label className="label">Bukti transfer (opsional)</label>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickProof} />
        {proofUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofUrl} alt="Bukti transfer" className="h-16 w-16 rounded-lg border border-rose-line object-cover" />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-rose hover:underline">Ganti</button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-rose-soft disabled:opacity-60">
            <Upload size={16} /> {uploading ? "Mengupload…" : "Upload bukti transfer"}
          </button>
        )}
        {uploadErr && <p className="mt-1 text-xs text-rose">{uploadErr}</p>}
      </div>

      <button onClick={sendWa} className="btn-primary w-full">
        {proofUrl ? "Kirim booking + bukti ke WhatsApp" : "Lanjut ke WhatsApp"} <Send size={18} />
      </button>
      <button onClick={onBack} className="text-center text-sm text-muted hover:text-rose">← Ubah booking</button>
    </div>
  );
}
