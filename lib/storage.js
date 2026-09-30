// Data access to the Salia Makeup API: all snake_case/camelCase mapping lives here, not in components.

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "salia_token";

// Owner token in localStorage so the owner stays logged in (and notifications open); try/catch as storage can throw.
export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}
export function setToken(token) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {}
}
export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

// --- Customer (user) token ---------------------------------------------------
const USER_TOKEN_KEY = "salia_user";
export function getUserToken() {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(USER_TOKEN_KEY); } catch (e) { return null; }
}
export function setUserToken(token) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(USER_TOKEN_KEY, token); } catch (e) {}
}
export function clearUserToken() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(USER_TOKEN_KEY); } catch (e) {}
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

async function apiFetch(path, { method = "GET", body, auth = false, userAuth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (userAuth) {
    const token = getUserToken();
    if (token) headers.Authorization = `Bearer ${token}`;
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
    items: row.items || null,
    orang: row.orang || 1,
    instagram: row.instagram || "",
    email: row.email || "",
    proofUrl: row.proof_url || "",
    userId: row.user_id || null,
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
    deskripsi: row.deskripsi || "",
    detail: row.detail || "",
    info: row.info || "",
    foto: row.foto,
    sort: row.sort,
    active: row.active,
  };
}

function servicesData({ services, hairdo, nailArt, areas, hairdoAddon }) {
  return {
    services: (services || []).map(serviceToUi),
    hairdo: (hairdo || []).map(serviceToUi),
    nailArt: (nailArt || []).map(serviceToUi),
    areas: areas || [],
    hairdoAddon: hairdoAddon || 0,
  };
}

// Public reads: returns null on any failure so callers fall back to the static lib/config.js table.
export async function getServicesData() {
  try {
    return servicesData(await apiFetch("/services"));
  } catch (e) {
    return null;
  }
}

export async function getGallery() {
  try {
    const rows = await apiFetch("/gallery");
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}

// Public site settings (DP %, bank, area fees, socials); safe defaults on failure so the UI never breaks.
export async function getSettings() {
  try {
    const settings = await apiFetch("/settings");
    return {
      dpPercent: typeof settings.dpPercent === "number" ? settings.dpPercent : 50,
      bank: settings.bank || { name: "", number: "", holder: "" },
      areas: Array.isArray(settings.areas) ? settings.areas : [],
      social: settings.social || { instagram: "", tiktok: "", google: "" },
      whatsapp: settings.whatsapp || "",
      content: {
        logo: settings.content?.logo || "",
        heroKicker: settings.content?.heroKicker || "",
        heroTitle: settings.content?.heroTitle || "",
        heroPhoto: settings.content?.heroPhoto || "",
      },
    };
  } catch (e) {
    return {
      dpPercent: 50, bank: { name: "", number: "", holder: "" }, areas: [],
      social: { instagram: "", tiktok: "", google: "" }, whatsapp: "",
      content: { logo: "", heroKicker: "", heroTitle: "", heroPhoto: "" },
    };
  }
}

// --- Email preview / test (admin) --------------------------------------------
export async function getEmailPreview() {
  return apiFetch("/email/preview", { auth: true });
}
export async function sendTestEmail(to) {
  return apiFetch("/email/test", { method: "POST", auth: true, body: { to } });
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
export async function saveBooking({ nama, telepon, serviceId, hairdo, areaId, tanggal, jam, lokasi, catatan }) {
  const row = await apiFetch("/bookings", {
    method: "POST",
    body: {
      nama,
      telepon,
      service_id: serviceId,
      hairdo: !!hairdo,
      area_id: areaId,
      tanggal,
      jam,
      lokasi: lokasi || null,
      catatan: catatan || null,
    },
  });
  return bookingToUi(row);
}

// Cart checkout: server recomputes the total (no client total sent) and needs a valid magic-link token.
export async function saveCartBooking({ nama, telepon, instagram, email, items, orang, areaId, jam, lokasi, catatan, token, proofUrl }) {
  const row = await apiFetch("/bookings", {
    method: "POST",
    userAuth: true,
    body: {
      nama,
      telepon,
      instagram: instagram || null,
      email: email || null,
      // [serviceId, ...]
      items,
      orang,
      area_id: areaId,
      jam,
      lokasi: lokasi || null,
      catatan: catatan || null,
      token,
      proof_url: proofUrl || null,
    },
  });
  return bookingToUi(row);
}

// --- Booking magic-link tokens ----------------------------------------------
export async function getBookingToken(token) {
  try { return await apiFetch(`/booking-token/${encodeURIComponent(token)}`); }
  catch (e) { return { valid: false, reason: "error" }; }
}
export async function createBookingToken(body) {
  return apiFetch("/booking-tokens", { method: "POST", auth: true, body });
}
export async function listBookingTokens() {
  const rows = await apiFetch("/booking-tokens", { auth: true });
  return Array.isArray(rows) ? rows : [];
}

export async function getBookings(status) {
  const query = status && status !== "semua" ? `?status=${encodeURIComponent(status)}` : "";
  const rows = await apiFetch(`/bookings${query}`, { auth: true });
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

// Upload via XHR for real progress; at 100% the server is still processing, so show "processing" until it resolves.
function xhrUpload(path, file, { auth = false, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}${path}`);
    if (auth) {
      const token = getToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch (e) {}
      if (xhr.status === 401) return reject(new UnauthorizedError());
      if (xhr.status >= 200 && xhr.status < 300 && data && data.url) return resolve(data.url);
      const err = new Error((data && data.error) || `upload_failed_${xhr.status}`);
      err.data = data;
      reject(err);
    };
    xhr.onerror = () => reject(new Error("network_error"));
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export function uploadImage(file, onProgress) {
  return xhrUpload("/uploads", file, { auth: true, onProgress });
}
export function uploadProof(file, onProgress) {
  return xhrUpload("/uploads/proof", file, { onProgress });
}
export function uploadReceipt(file, onProgress) {
  return xhrUpload("/uploads/receipt", file, { onProgress });
}

// --- Customer accounts -------------------------------------------------------
export async function registerUser(body) {
  const data = await apiFetch("/users/register", { method: "POST", body });
  if (data?.token) setUserToken(data.token);
  return data?.user || null;
}
export async function loginUser(identifier, password) {
  const data = await apiFetch("/users/login", { method: "POST", body: { identifier, password } });
  if (data?.token) setUserToken(data.token);
  return data?.user || null;
}
export async function getMe() {
  try {
    const data = await apiFetch("/users/me", { userAuth: true });
    return data?.user || null;
  } catch (e) {
    return null;
  }
}

// Passwordless email login (OTP).
export async function requestLoginCode(email) {
  return apiFetch("/users/request-code", { method: "POST", body: { email } });
}
export async function verifyLoginCode(email, code, nama) {
  const data = await apiFetch("/users/verify-code", { method: "POST", body: { email, code, nama } });
  if (data?.token) setUserToken(data.token);
  return data?.user || null;
}

// The logged-in customer's own bookings (history + receipt banner).
export async function getUserBookings() {
  try {
    const rows = await apiFetch("/users/bookings", { userAuth: true });
    return Array.isArray(rows) ? rows.map(bookingToUi) : [];
  } catch (e) {
    return [];
  }
}

// Drop a booking receipt (thank-you + link) into the guest's/user's chat thread.
export async function sendReceiptToChat(cid, { nama, telepon, ref, url }) {
  return apiFetch(`/chat/${cid}/receipt`, { method: "POST", body: { nama, telepon, ref, url } });
}
// Email the receipt to the logged-in account (no-op/skipped if Resend unset).
export async function emailReceipt({ ref, filename, pdfBase64 }) {
  return apiFetch("/receipt/email", { method: "POST", userAuth: true, body: { ref, filename, pdfBase64 } });
}

// Live chat, guest side: the browser-generated conversation id is the read key for that one thread.
export async function sendChatMessage(cid, { nama, telepon, body }) {
  const data = await apiFetch(`/chat/${cid}/messages`, {
    method: "POST",
    body: { nama: nama || null, telepon: telepon || null, body },
  });
  return data?.message || null;
}
export async function pollChatMessages(cid, since = 0) {
  const data = await apiFetch(`/chat/${cid}/messages?since=${since}`);
  return Array.isArray(data?.messages) ? data.messages : [];
}

// Owner side (admin).
export async function getConversations() {
  const rows = await apiFetch("/chat", { auth: true });
  return Array.isArray(rows) ? rows : [];
}
export async function getThread(cid) {
  return apiFetch(`/chat/${cid}`, { auth: true });
}
export async function sendReply(cid, body) {
  const data = await apiFetch(`/chat/${cid}/reply`, { method: "POST", auth: true, body: { body } });
  return data?.message || null;
}
export async function deleteConversation(cid) {
  await apiFetch(`/chat/${cid}`, { method: "DELETE", auth: true });
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
