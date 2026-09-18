const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const token = localStorage.getItem("collabboard_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const authApi = {
  register: (email, password, name) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })
};

export const boardApi = {
  list: () => request("/api/boards"),
  create: (name) =>
    request("/api/boards", { method: "POST", body: JSON.stringify({ name }) }),
  get: (id) => request(`/api/boards/${id}`)
};
