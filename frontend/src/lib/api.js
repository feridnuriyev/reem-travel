import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || window.location.origin).replace(/\/$/, "");
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "reem_admin_token";

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  // Attach admin token for admin-only endpoints
  const url = config.url || "";
  const needsAdminAuth =
    url.includes("/admin/") ||
    (url.startsWith("/inquiries") && (config.method || "get").toLowerCase() === "get");
  if (needsAdminAuth) {
    const t = getAdminToken();
    if (t && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${t}`;
    }
  }
  return config;
});

// Gracefully handle expired/invalid admin tokens — clear & redirect once
let redirecting = false;
api.interceptors.response.use(
  (response) => {
    const contentType = response.headers?.["content-type"] || "";
    if (!contentType.includes("application/json")) {
      return Promise.reject(new Error("The API returned an unexpected response."));
    }
    return response;
  },
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";
    const isAdminCall = url.includes("/admin/") || url.includes("/inquiries");
    if (status === 401 && isAdminCall && getAdminToken()) {
      setAdminToken(null);
      if (!redirecting && typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
        redirecting = true;
        window.location.replace("/admin/login");
      }
    }
    return Promise.reject(err);
  }
);

// Public endpoints
export const submitInquiry = (payload) => api.post("/inquiries", payload).then((r) => r.data);
export const listHotels = (params = {}) => api.get("/hotels", { params }).then((r) => r.data);
export const getHotel = (id) => api.get(`/hotels/${id}`).then((r) => r.data);
export const listReviews = () => api.get("/reviews").then((r) => r.data);
export const createReview = (payload) => api.post("/reviews", payload).then((r) => r.data);
export const createBooking = (payload) => api.post("/bookings", payload).then((r) => r.data);

// Admin endpoints
export const adminLogin = (email, password) =>
  api.post("/admin/login", { email, password }).then((r) => r.data);
export const adminTwoFASetup = (tempToken) =>
  api.post("/admin/2fa/setup", {}, { headers: { Authorization: `Bearer ${tempToken}` } }).then((r) => r.data);
export const adminTwoFAVerify = (tempToken, code) =>
  api.post("/admin/2fa/verify", { code }, { headers: { Authorization: `Bearer ${tempToken}` } }).then((r) => r.data);
export const adminMe = () => api.get("/admin/me").then((r) => r.data);
export const adminStats = () => api.get("/admin/stats").then((r) => r.data);
export const adminListHotels = () => api.get("/hotels").then((r) => r.data);
export const adminCreateHotel = (payload) => api.post("/admin/hotels", payload).then((r) => r.data);
export const adminUpdateHotel = (id, payload) => api.patch(`/admin/hotels/${id}`, payload).then((r) => r.data);
export const adminDeleteHotel = (id) => api.delete(`/admin/hotels/${id}`).then((r) => r.data);
export const adminAddRoom = (hotelId, payload) => api.post(`/admin/hotels/${hotelId}/rooms`, payload).then((r) => r.data);
export const adminDeleteRoom = (hotelId, roomId) => api.delete(`/admin/hotels/${hotelId}/rooms/${roomId}`).then((r) => r.data);
export const adminListReviews = (onlyPending = false) =>
  api.get("/admin/reviews", { params: { only_pending: onlyPending } }).then((r) => r.data);
export const adminApproveReview = (id) => api.post(`/admin/reviews/${id}/approve`).then((r) => r.data);
export const adminDeleteReview = (id) => api.delete(`/admin/reviews/${id}`).then((r) => r.data);
export const adminListBookings = () => api.get("/admin/bookings").then((r) => r.data);
export const adminListInquiries = () => api.get("/inquiries").then((r) => r.data);
export const adminUpdateBooking = (id, body) => api.patch(`/admin/bookings/${id}`, body).then((r) => r.data);
