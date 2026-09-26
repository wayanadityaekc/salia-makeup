// Data access — talks to the Salia Makeup API (see the salia-makeup-api repo +
// API-BRIEF.md). The API speaks snake_case; the UI uses camelCase; all mapping
// lives here so components only had to add `await`.

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "salia_token";

// --- Owner token (dashboard) -------------------------------------------------
// Stored in localStorage so the owner stays logged in after closing the app —
// otherwise they'd have to log in every launch, and a logged-out app can't show
// the booking/chat behind a tapped notification. Cleared only on explicit logout
// or a 401 (expired token). try/catch: storage can throw in private mode.
export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(t) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {}
}
export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
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

// (Image/proof uploads with progress are defined below.)

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

// --- Image upload (multipart, with progress) ---------------------------------
// XHR so we can report real upload progress. onProgress(percent 0..100) fires
// while bytes are sent; once at 100 the server is still processing (Cloudinary),
// so callers show a "processing" state until the promise resolves.
function xhrUpload(path, file, { auth = false, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}${path}`);
    if (auth) {
      const t = getToken();
      if (t) xhr.setRequestHeader("Authorization", `Bearer ${t}`);
    }
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status === 401) return reject(new UnauthorizedError());
      if (xhr.status >= 200 && xhr.status < 300 && data && data.url) return resolve(data.url);
      const err = new Error((data && data.error) || `upload_failed_${xhr.status}`);
      err.data = data;
      reject(err);
    };
    xhr.onerror = () => reject(new Error("network_error"));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

export function uploadImage(file, onProgress) {
  return xhrUpload("/uploads", file, { auth: true, onProgress });
}
export function uploadProof(file, onProgress) {
  return xhrUpload("/uploads/proof", file, { onProgress });
}

// --- Messages (web chat) -----------------------------------------------------
function messageToUi(row) {
  if (!row) return row;
  return {
    id: String(row.id),
    nama: row.nama,
    telepon: row.telepon,
    pesan: row.pesan,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Public: a guest sends a chat message from the site.
export async function sendMessage({ nama, telepon, pesan }) {
  return apiFetch("/messages", { method: "POST", body: { nama, telepon: telepon || null, pesan } });
}
export async function getMessages() {
  const rows = await apiFetch("/messages", { auth: true });
  return Array.isArray(rows) ? rows.map(messageToUi) : [];
}
export async function updateMessage(id, patch) {
  return messageToUi(await apiFetch(`/messages/${id}`, { method: "PATCH", auth: true, body: patch }));
}
export async function deleteMessage(id) {
  await apiFetch(`/messages/${id}`, { method: "DELETE", auth: true });
  return true;
}

// --- Push notifications -------------------------------------------------------
export async function getPushPublicKey() {
  const data = await apiFetch("/push/public-key");
  return data?.publicKey || null;
}
export async function savePushSubscription(subscription) {
  return apiFetch("/push/subscribe", { method: "POST", auth: true, body: subscription });
}
export async function removePushSubscription(endpoint) {
  return apiFetch("/push/unsubscribe", { method: "POST", auth: true, body: { endpoint } });
}
