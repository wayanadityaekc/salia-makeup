// Data access — talks to the Salia Makeup API (see the salia-makeup-api repo +
// API-BRIEF.md). The API speaks snake_case; the UI uses camelCase; all mapping
// lives here so components only had to add `await`.

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "salia_token";

// --- Owner token (dashboard) -------------------------------------------------
export function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (typeof window !== "undefined") sessionStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  if (typeof window !== "undefined") sessionStorage.removeItem(TOKEN_KEY);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401) throw new UnauthorizedError();
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.error) || `request_failed_${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

// --- Mappers -----------------------------------------------------------------
function bookingToUi(row) {
  if (!row) return row;
  return {
    id: String(row.id),
    nama: row.nama,
    telepon: row.telepon,
    serviceId: row.service_id,
    serviceNama: row.service_nama,
    hairdo: row.hairdo,
    areaId: row.area_id,
    areaNama: row.area_nama,
    tanggal: row.tanggal,
    jam: row.jam,
    lokasi: row.lokasi,
    catatan: row.catatan,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
  };
}

function serviceToUi(row) {
  if (!row) return row;
  return {
    id: row.id,
    kind: row.kind,
    nama: row.nama,
    ringkas: row.ringkas,
    base: row.base,
    hairdoIncluded: row.hairdo_included,
    foto: row.foto,
    sort: row.sort,
    active: row.active,
  };
}

function servicesData(data) {
  return {
    services: (data.services || []).map(serviceToUi),
    nailArt: (data.nailArt || []).map(serviceToUi),
    areas: data.areas || [],
    hairdoAddon: data.hairdoAddon || 0,
  };
}

// --- Public reads (used by server components + booking form) -----------------
// Returns { services, nailArt, areas, hairdoAddon } or null on any failure so
// callers can fall back to the static lib/config.js table.
export async function getServicesData() {
  try {
    return servicesData(await apiFetch("/services"));
  } catch {
    return null;
  }
}

export async function getGallery() {
  try {
    const rows = await apiFetch("/gallery");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

// Public site settings (DP %, bank account, area fees, social links). Returns
// safe defaults on failure so the UI never breaks.
export async function getSettings() {
  try {
    const s = await apiFetch("/settings");
    return {
      dpPercent: typeof s.dpPercent === "number" ? s.dpPercent : 50,
      bank: s.bank || { name: "", number: "", holder: "" },
      areas: Array.isArray(s.areas) ? s.areas : [],
      social: s.social || { instagram: "", tiktok: "", google: "" },
      whatsapp: s.whatsapp || "",
    };
  } catch {
    return { dpPercent: 50, bank: { name: "", number: "", holder: "" }, areas: [], social: { instagram: "", tiktok: "", google: "" }, whatsapp: "" };
  }
}

export async function updateSettings(body) {
  return apiFetch("/settings", { method: "PATCH", auth: true, body });
}

// Public transfer-proof upload (no auth) for the booking flow.
export async function uploadProof(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/uploads/proof`, { method: "POST", body: fd });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.error) || `upload_failed_${res.status}`);
    err.data = data;
    throw err;
  }
  return data.url;
}

// --- Auth --------------------------------------------------------------------
export async function login(password) {
  const data = await apiFetch("/auth/login", { method: "POST", body: { password } });
  setToken(data.token);
  return data.token;
}

// --- Bookings ----------------------------------------------------------------
export async function saveBooking(booking) {
  const row = await apiFetch("/bookings", {
    method: "POST",
    body: {
      nama: booking.nama,
      telepon: booking.telepon,
      service_id: booking.serviceId,
      hairdo: !!booking.hairdo,
      area_id: booking.areaId,
      tanggal: booking.tanggal,
      jam: booking.jam,
      lokasi: booking.lokasi || null,
      catatan: booking.catatan || null,
    },
  });
  return bookingToUi(row);
}

export async function getBookings(status) {
  const qs = status && status !== "semua" ? `?status=${encodeURIComponent(status)}` : "";
  const rows = await apiFetch(`/bookings${qs}`, { auth: true });
  return Array.isArray(rows) ? rows.map(bookingToUi) : [];
}
export async function updateBooking(id, patch) {
  return bookingToUi(await apiFetch(`/bookings/${id}`, { method: "PATCH", auth: true, body: patch }));
}
export async function deleteBooking(id) {
  await apiFetch(`/bookings/${id}`, { method: "DELETE", auth: true });
  return true;
}

// --- Services (admin) --------------------------------------------------------
export async function getServicesAdmin() {
  return servicesData(await apiFetch("/services?all=1", { auth: true }));
}
export async function createService(body) {
  return serviceToUi(await apiFetch("/services", { method: "POST", auth: true, body }));
}
export async function updateService(id, body) {
  return serviceToUi(await apiFetch(`/services/${id}`, { method: "PATCH", auth: true, body }));
}
export async function deleteService(id) {
  await apiFetch(`/services/${id}`, { method: "DELETE", auth: true });
  return true;
}

// --- Gallery (admin) ---------------------------------------------------------
export async function createGalleryItem(body) {
  return apiFetch("/gallery", { method: "POST", auth: true, body });
}
export async function deleteGalleryItem(id) {
  await apiFetch(`/gallery/${id}`, { method: "DELETE", auth: true });
  return true;
}

// --- Image upload (admin, multipart) -----------------------------------------
// Returns the hosted image URL. Content-Type is left unset so the browser adds
// the multipart boundary itself.
export async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const headers = {};
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API}/uploads`, { method: "POST", headers, body: fd });
  if (res.status === 401) throw new UnauthorizedError();
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.error) || `upload_failed_${res.status}`);
    err.data = data;
    throw err;
  }
  return data.url;
}
