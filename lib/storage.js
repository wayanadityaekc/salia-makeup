const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'salia_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}
export function setToken(token) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {}
}
export function clearToken() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

const USER_TOKEN_KEY = 'salia_user';
export function getUserToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(USER_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}
export function setUserToken(token) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_TOKEN_KEY, token);
  } catch (e) {}
}
export function clearUserToken() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_TOKEN_KEY);
  } catch (e) {}
}

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'UnauthorizedError';
  }
}

async function fetchApi(path, { method = 'GET', body, auth = false, userAuth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (userAuth) {
    const token = getUserToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (response.status === 401) throw new UnauthorizedError();
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error((data && data.error) || `request_failed_${response.status}`);
    error.data = data;
    throw error;
  }
  return data;
}

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
    instagram: row.instagram || '',
    email: row.email || '',
    proofUrl: row.proof_url || '',
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
    deskripsi: row.deskripsi || '',
    detail: row.detail || '',
    info: row.info || '',
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

export async function fetchServicesData() {
  try {
    return servicesData(await fetchApi('/services'));
  } catch (e) {
    return null;
  }
}

export async function fetchGallery() {
  try {
    const rows = await fetchApi('/gallery');
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}

export async function fetchSettings() {
  try {
    const settings = await fetchApi('/settings');
    return {
      dpPercent: typeof settings.dpPercent === 'number' ? settings.dpPercent : 50,
      bank: settings.bank || { name: '', number: '', holder: '' },
      areas: Array.isArray(settings.areas) ? settings.areas : [],
      social: settings.social || { instagram: '', tiktok: '', google: '' },
      whatsapp: settings.whatsapp || '',
      content: {
        logo: settings.content?.logo || '',
        heroKicker: settings.content?.heroKicker || '',
        heroTitle: settings.content?.heroTitle || '',
        heroPhoto: settings.content?.heroPhoto || '',
      },
    };
  } catch (e) {
    return {
      dpPercent: 50,
      bank: { name: '', number: '', holder: '' },
      areas: [],
      social: { instagram: '', tiktok: '', google: '' },
      whatsapp: '',
      content: { logo: '', heroKicker: '', heroTitle: '', heroPhoto: '' },
    };
  }
}

export async function fetchEmailPreview() {
  return fetchApi('/email/preview', { auth: true });
}
export async function sendTestEmail(recipient) {
  return fetchApi('/email/test', { method: 'POST', auth: true, body: { to: recipient } });
}

export async function updateSettings(body) {
  return fetchApi('/settings', { method: 'PATCH', auth: true, body });
}

export async function login(password) {
  const data = await fetchApi('/auth/login', { method: 'POST', body: { password } });
  setToken(data.token);
  return data.token;
}

export async function saveBooking({ nama, telepon, serviceId, hairdo, areaId, tanggal, jam, lokasi, catatan }) {
  const row = await fetchApi('/bookings', {
    method: 'POST',
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

export async function saveCartBooking({
  nama,
  telepon,
  instagram,
  email,
  items,
  orang,
  areaId,
  jam,
  lokasi,
  catatan,
  token,
  proofUrl,
}) {
  const row = await fetchApi('/bookings', {
    method: 'POST',
    userAuth: true,
    body: {
      nama,
      telepon,
      instagram: instagram || null,
      email: email || null,
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

export async function fetchBookingToken(token) {
  try {
    return await fetchApi(`/booking-token/${encodeURIComponent(token)}`);
  } catch (e) {
    return { valid: false, reason: 'error' };
  }
}
export async function createBookingToken(body) {
  return fetchApi('/booking-tokens', { method: 'POST', auth: true, body });
}
export async function fetchBookingTokens() {
  const rows = await fetchApi('/booking-tokens', { auth: true });
  return Array.isArray(rows) ? rows : [];
}

export async function fetchBookings(status) {
  const query = status && status !== 'semua' ? `?status=${encodeURIComponent(status)}` : '';
  const rows = await fetchApi(`/bookings${query}`, { auth: true });
  return Array.isArray(rows) ? rows.map(bookingToUi) : [];
}
export async function updateBooking(id, patch) {
  return bookingToUi(await fetchApi(`/bookings/${id}`, { method: 'PATCH', auth: true, body: patch }));
}
export async function deleteBooking(id) {
  await fetchApi(`/bookings/${id}`, { method: 'DELETE', auth: true });
  return true;
}

export async function fetchServicesAdmin() {
  return servicesData(await fetchApi('/services?all=1', { auth: true }));
}
export async function createService(body) {
  return serviceToUi(await fetchApi('/services', { method: 'POST', auth: true, body }));
}
export async function updateService(id, body) {
  return serviceToUi(await fetchApi(`/services/${id}`, { method: 'PATCH', auth: true, body }));
}
export async function deleteService(id) {
  await fetchApi(`/services/${id}`, { method: 'DELETE', auth: true });
  return true;
}

export async function createGalleryItem(body) {
  return fetchApi('/gallery', { method: 'POST', auth: true, body });
}
export async function deleteGalleryItem(id) {
  await fetchApi(`/gallery/${id}`, { method: 'DELETE', auth: true });
  return true;
}

function xhrUpload(path, file, { auth = false, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API}${path}`);
    if (auth) {
      const token = getToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
    }
    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {}
      if (xhr.status === 401) return reject(new UnauthorizedError());
      if (xhr.status >= 200 && xhr.status < 300 && data && data.url) return resolve(data.url);
      const error = new Error((data && data.error) || `upload_failed_${xhr.status}`);
      error.data = data;
      reject(error);
    };
    xhr.onerror = () => reject(new Error('network_error'));
    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

export function uploadImage(file, onProgress) {
  return xhrUpload('/uploads', file, { auth: true, onProgress });
}
export function uploadProof(file, onProgress) {
  return xhrUpload('/uploads/proof', file, { onProgress });
}
export function uploadReceipt(file, onProgress) {
  return xhrUpload('/uploads/receipt', file, { onProgress });
}

export async function registerUser(body) {
  const data = await fetchApi('/users/register', { method: 'POST', body });
  if (data?.token) setUserToken(data.token);
  return data?.user || null;
}
export async function loginUser(identifier, password) {
  const data = await fetchApi('/users/login', { method: 'POST', body: { identifier, password } });
  if (data?.token) setUserToken(data.token);
  return data?.user || null;
}
export async function fetchCurrentUser() {
  try {
    const data = await fetchApi('/users/me', { userAuth: true });
    return data?.user || null;
  } catch (e) {
    return null;
  }
}

export async function requestLoginCode(email) {
  return fetchApi('/users/request-code', { method: 'POST', body: { email } });
}
export async function verifyLoginCode(email, code, nama) {
  const data = await fetchApi('/users/verify-code', { method: 'POST', body: { email, code, nama } });
  if (data?.token) setUserToken(data.token);
  return data?.user || null;
}

export async function fetchUserBookings() {
  try {
    const rows = await fetchApi('/users/bookings', { userAuth: true });
    return Array.isArray(rows) ? rows.map(bookingToUi) : [];
  } catch (e) {
    return [];
  }
}

export async function sendReceiptToChat(cid, { nama, telepon, ref, url }) {
  return fetchApi(`/chat/${cid}/receipt`, { method: 'POST', body: { nama, telepon, ref, url } });
}
export async function emailReceipt({ ref, filename, pdfBase64 }) {
  return fetchApi('/receipt/email', { method: 'POST', userAuth: true, body: { ref, filename, pdfBase64 } });
}

export async function sendChatMessage(cid, { nama, telepon, body }) {
  const data = await fetchApi(`/chat/${cid}/messages`, {
    method: 'POST',
    body: { nama: nama || null, telepon: telepon || null, body },
  });
  return data?.message || null;
}
export async function fetchChatMessages(cid, since = 0) {
  const data = await fetchApi(`/chat/${cid}/messages?since=${since}`);
  return Array.isArray(data?.messages) ? data.messages : [];
}

export async function fetchConversations() {
  const rows = await fetchApi('/chat', { auth: true });
  return Array.isArray(rows) ? rows : [];
}
export async function fetchThread(cid) {
  return fetchApi(`/chat/${cid}`, { auth: true });
}
export async function sendReply(cid, body) {
  const data = await fetchApi(`/chat/${cid}/reply`, { method: 'POST', auth: true, body: { body } });
  return data?.message || null;
}
export async function deleteConversation(cid) {
  await fetchApi(`/chat/${cid}`, { method: 'DELETE', auth: true });
  return true;
}

export async function fetchPushPublicKey() {
  const data = await fetchApi('/push/public-key');
  return data?.publicKey || null;
}
export async function savePushSubscription(subscription) {
  return fetchApi('/push/subscribe', { method: 'POST', auth: true, body: subscription });
}
export async function removePushSubscription(endpoint) {
  return fetchApi('/push/unsubscribe', { method: 'POST', auth: true, body: { endpoint } });
}
