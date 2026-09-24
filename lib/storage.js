// Booking data access — talks to the Salia Makeup API (see api/ + API-BRIEF.md).
// Replaces the old localStorage store so bookings persist across devices.
//
// The API speaks snake_case (matches the DB columns); the UI components use
// camelCase. All of that mapping lives here, so the components only had to add
// `await`.

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

// Thrown on any 401 so the dashboard can drop back to the login gate.
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

// row (snake_case from API) -> booking (camelCase for the UI)
function toUi(row) {
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

// --- Public ------------------------------------------------------------------
export async function login(password) {
  const data = await apiFetch("/auth/login", { method: "POST", body: { password } });
  setToken(data.token);
  return data.token;
}

// Create a booking. Sends only the inputs — the server recomputes the total.
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
  return toUi(row);
}

// --- Admin (require a token) -------------------------------------------------
export async function getBookings(status) {
  const qs = status && status !== "semua" ? `?status=${encodeURIComponent(status)}` : "";
  const rows = await apiFetch(`/bookings${qs}`, { auth: true });
  return Array.isArray(rows) ? rows.map(toUi) : [];
}

export async function updateBooking(id, patch) {
  const row = await apiFetch(`/bookings/${id}`, { method: "PATCH", auth: true, body: patch });
  return toUi(row);
}

export async function deleteBooking(id) {
  await apiFetch(`/bookings/${id}`, { method: "DELETE", auth: true });
  return true;
}
