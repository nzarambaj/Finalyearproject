// Base URL of the backend. Set VITE_API_URL on Vercel (no trailing slash),
// e.g. https://finalyearprojectbackend-production-ea86.up.railway.app
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API = `${API_BASE}/api`;
