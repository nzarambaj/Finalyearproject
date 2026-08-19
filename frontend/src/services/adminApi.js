import { API } from "./api";

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  };
}

export async function adminGet(path) {
  const res = await fetch(`${API}/admin${path}`, {
    headers: authHeaders()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function adminSend(method, path, body) {
  const res = await fetch(`${API}/admin${path}`, {
    method,
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}
