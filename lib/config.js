export const site = {
  brand: "Salia Makeup",
  tagline: "Make Up & Nail Art Artist",
  domain: "saliamakeup.com",
  kota: "Denpasar & sekitarnya",
  // GANTI dengan nomor WhatsApp asli Salia. Format: 62..., tanpa + dan tanpa 0 di depan.
  whatsapp: "6281234567890",
  instagram: "saliamakeup",
  email: "hello@saliamakeup.com",
  jam: "Setiap hari, 08.00 - 20.00 WITA",
};

// Layanan make up
export const services = [
  {
    id: "makeup",
    nama: "Make Up",
    ringkas: "Riasan wajah natural sampai bold sesuai acara.",
    base: 150000,
    hairdoIncluded: false,
  },
  {
    id: "makeup-hairdo",
    nama: "Make Up + Hairdo",
    ringkas: "Paket riasan lengkap dengan penataan rambut.",
    base: 250000,
    hairdoIncluded: true,
  },
  {
    id: "wisuda",
    nama: "Wisuda",
    ringkas: "Tampil elegan dan tahan lama untuk hari kelulusan.",
    base: 300000,
    hairdoIncluded: true,
  },
  {
    id: "kundangan",
    nama: "Kundangan",
    ringkas: "Riasan anggun untuk menghadiri undangan.",
    base: 350000,
    hairdoIncluded: true,
  },
  {
    id: "upacara",
    nama: "Upacara Adat",
    ringkas: "Riasan dan sanggul khas untuk upacara adat Bali.",
    base: 500000,
    hairdoIncluded: true,
  },
];

// Layanan nail art
export const nailArt = [
  {
    id: "nail-polish",
    nama: "Nail Polish",
    ringkas: "Cat kuku rapi dengan pilihan warna favorit.",
    base: 75000,
  },
  {
    id: "nail-gel",
    nama: "Gel Polish",
    ringkas: "Gel tahan lama, kilap maksimal hingga 3 minggu.",
    base: 150000,
  },
  {
    id: "nail-extension",
    nama: "Nail Extension",
    ringkas: "Perpanjangan kuku dengan bentuk sesuai keinginan.",
    base: 250000,
  },
  {
    id: "nail-design",
    nama: "Nail Art Design",
    ringkas: "Desain custom, hand-painted, dan aksen premium.",
    base: 300000,
  },
];

export const hairdoAddon = 100000;

export const areas = [
  { id: "dalam-kota", nama: "Dalam kota", fee: 0 },
  { id: "luar-20", nama: "Luar kota (< 20 km)", fee: 50000 },
  { id: "luar-jauh", nama: "Luar kota (> 20 km)", fee: 100000 },
];

// Login dashboard ditangani API (POST /auth/login → JWT). Tidak ada lagi
// password di frontend — lihat api/ + API-BRIEF.md.

// ⚠️ TESTIMONI CONTOH / DUMMY — WAJIB DIGANTI DENGAN REVIEW ASLI SEBELUM LIVE.
// Belum ada sistem rating; ini hanya placeholder untuk melihat tampilan.
// Ganti isinya dengan review asli (atau kosongkan array = section otomatis hilang).
export const reviews = [
  {
    nama: "Putri A.",
    layanan: "Make Up + Hairdo",
    teks: "Hasil makeup-nya rapi dan tahan lama sampai malam. Salia sabar banget menyesuaikan ke tema acara.",
  },
  {
    nama: "Gek Indah",
    layanan: "Wisuda",
    teks: "Dandan wisuda hasilnya natural tapi tetap fresh di foto. Datang tepat waktu juga.",
  },
  {
    nama: "Ayu M.",
    layanan: "Nail Art Design",
    teks: "Nail art-nya detail dan sesuai request. Warnanya awet lebih dari dua minggu.",
  },
];

// Lookup gabungan makeup + nail art
export const allServices = [...services, ...nailArt];
export const findService = (id) => allServices.find((s) => s.id === id);
