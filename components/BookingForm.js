"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import {
  services as cfgServices,
  nailArt as cfgNailArt,
  areas as cfgAreas,
  hairdoAddon as cfgAddon,
  site,
} from "@/lib/config";
import { formatRupiah, formatTanggal, waLink } from "@/lib/utils";
import { saveBooking, getServicesData } from "@/lib/storage";

export default function BookingForm() {
  const params = useSearchParams();
  const [done, setDone] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  // Live catalog from the API; starts from the static config so the form works
  // before the fetch resolves (and if the API is down).
  const [catalog, setCatalog] = useState({
    services: cfgServices,
    nailArt: cfgNailArt,
    areas: cfgAreas,
    hairdoAddon: cfgAddon,
  });
  useEffect(() => {
    getServicesData().then((d) => {
      if (d && (d.services.length || d.nailArt.length)) setCatalog(d);
    });
  }, []);
  const { services, nailArt, areas, hairdoAddon } = catalog;
  const findService = (id) => [...services, ...nailArt].find((s) => s.id === id) || null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nama: "",
      telepon: "",
      serviceId: "",
      hairdo: false,
      areaId: "dalam-kota",
      tanggal: "",
      jam: "",
      lokasi: "",
      catatan: "",
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
    (service?.base || 0) +
    (area?.fee || 0) +
    (bisaHairdo && hairdo ? hairdoAddon : 0);

  const onSubmit = async (data) => {
    const svc = findService(data.serviceId);
    const ar = areas.find((a) => a.id === data.areaId);
    const pakaiHairdo = !!svc && svc.hairdoIncluded === false && data.hairdo;

    setSubmitting(true);
    setSubmitErr("");

    let saved;
    try {
      // Persist first; the server recomputes and returns the authoritative total.
      saved = await saveBooking({
        nama: data.nama,
        telepon: data.telepon,
        serviceId: data.serviceId,
        hairdo: !!pakaiHairdo,
        areaId: data.areaId,
        tanggal: data.tanggal,
        jam: data.jam,
        lokasi: data.lokasi,
        catatan: data.catatan,
      });
    } catch (e) {
      setSubmitting(false);
      setSubmitErr(
        "Gagal menyimpan booking. Cek koneksi lalu coba lagi, atau hubungi kami langsung via WhatsApp."
      );
      return;
    }

    const finalTotal = saved?.total ?? total;

    // WhatsApp handoff — only after the booking is saved.
    const pesan =
      `Halo ${site.brand}, saya mau booking:\n\n` +
      `Nama: ${data.nama}\n` +
      `No. HP: ${data.telepon}\n` +
      `Layanan: ${svc?.nama}\n` +
      (pakaiHairdo ? `Tambah hairdo: Ya\n` : ``) +
      `Area: ${ar?.nama}\n` +
      `Tanggal: ${formatTanggal(data.tanggal)}\n` +
      `Jam: ${data.jam}\n` +
      (data.lokasi ? `Lokasi: ${data.lokasi}\n` : ``) +
      (data.catatan ? `Catatan: ${data.catatan}\n` : ``) +
      `\nEstimasi total: ${formatRupiah(finalTotal)}`;

    window.open(waLink(site.whatsapp, pesan), "_blank");
    setSubmitting(false);
    setDone(saved);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-rose-line bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto text-rose" size={44} />
        <h3 className="mt-4 text-xl font-bold text-ink">Booking terkirim!</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Kami sudah mengarahkanmu ke WhatsApp untuk konfirmasi. Kalau belum
          terbuka, hubungi kami langsung ya.
        </p>
        <button onClick={() => setDone(null)} className="btn-outline mt-6">
          Booking lagi
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-5 rounded-2xl border border-rose-line bg-white p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Nama lengkap</label>
          <input
            className="field"
            placeholder="Nama kamu"
            {...register("nama", { required: "Nama wajib diisi" })}
          />
          {errors.nama && <p className="mt-1 text-xs text-rose">{errors.nama.message}</p>}
        </div>
        <div>
          <label className="label">No. WhatsApp</label>
          <input
            className="field"
            placeholder="08xxxxxxxxxx"
            inputMode="numeric"
            {...register("telepon", {
              required: "Nomor wajib diisi",
              pattern: { value: /^[0-9+]{9,15}$/, message: "Nomor tidak valid" },
            })}
          />
          {errors.telepon && <p className="mt-1 text-xs text-rose">{errors.telepon.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Pilih layanan</label>
        <select
          className="field"
          {...register("serviceId", { required: "Pilih salah satu layanan" })}
        >
          <option value="">— Pilih layanan —</option>
          <optgroup label="Make Up">
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} — {formatRupiah(s.base)}
              </option>
            ))}
          </optgroup>
          <optgroup label="Nail Art">
            {nailArt.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nama} — {formatRupiah(n.base)}
              </option>
            ))}
          </optgroup>
        </select>
        {errors.serviceId && <p className="mt-1 text-xs text-rose">{errors.serviceId.message}</p>}
      </div>

      {bisaHairdo && (
        <label className="flex items-center gap-3 rounded-xl border border-rose-line bg-rose-soft/50 px-4 py-3">
          <input type="checkbox" className="h-4 w-4 accent-rose" {...register("hairdo")} />
          <span className="text-sm text-ink">
            Tambah hairdo (+ {formatRupiah(hairdoAddon)})
          </span>
        </label>
      )}

      <div>
        <label className="label">Area / lokasi</label>
        <select className="field" {...register("areaId")}>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nama} {a.fee > 0 ? `(+ ${formatRupiah(a.fee)})` : "(Gratis)"}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Tanggal</label>
          <input type="date" className="field" {...register("tanggal", { required: "Pilih tanggal" })} />
          {errors.tanggal && <p className="mt-1 text-xs text-rose">{errors.tanggal.message}</p>}
        </div>
        <div>
          <label className="label">Jam</label>
          <input type="time" className="field" {...register("jam", { required: "Pilih jam" })} />
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

      {/* Ringkasan */}
      <div className="rounded-xl bg-rose-soft p-4">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Estimasi total</span>
        </div>
        <div className="mt-1 text-2xl font-bold text-rose">{formatRupiah(total)}</div>
        <p className="mt-1 text-xs text-muted">
          Harga final dikonfirmasi lewat WhatsApp.
        </p>
      </div>

      {submitErr && <p className="text-sm text-rose">{submitErr}</p>}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Menyimpan…" : "Kirim via WhatsApp"} <Send size={18} />
      </button>
    </form>
  );
}
