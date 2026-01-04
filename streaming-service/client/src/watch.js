const BASE = "http://localhost:8080";

export function getAuth() {
  const raw = localStorage.getItem("auth");
  return raw ? JSON.parse(raw) : null;
}
export function setAuth(username, password) {
  localStorage.setItem("auth", JSON.stringify({ username, password }));
}
export function clearAuth() {
  localStorage.removeItem("auth");
}

function adminHeaders() {
  const a = getAuth();
  if (!a) return {};
  return { Authorization: "Basic " + btoa(`${a.username}:${a.password}`) };
}

async function http(method, path, body, { admin = false, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (admin) Object.assign(headers, adminHeaders());

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  listAll: () => http("GET", "/api/movies"),
  getMovie: (id) => http("GET", `/api/movies/${id}`),
  listEpisodes: (showId) => http("GET", `/api/shows/${showId}/episodes`),
  getEpisode: (id) => http("GET", `/api/episodes/${id}`),
  listGenres: () => http("GET", "/api/genres"),

  adminList: () => http("GET", "/api/admin/movies", null, { admin: true }),
  adminCreateMovie: (m) => http("POST", "/api/admin/movies", m, { admin: true }),
  adminUpdateMovie: (id, m) => http("PUT", `/api/admin/movies/${id}`, m, { admin: true }),
  adminDeleteMovie: (id) => http("DELETE", `/api/admin/movies/${id}`, null, { admin: true }),

  adminListEpisodes: (showId) => http("GET", `/api/admin/shows/${showId}/episodes`, null, { admin: true }),
  adminCreateEpisode: (ep) => http("POST", "/api/admin/episodes", ep, { admin: true }),
  adminUpdateEpisode: (id, ep) => http("PUT", `/api/admin/episodes/${id}`, ep, { admin: true }),
  adminDeleteEpisode: (id) => http("DELETE", `/api/admin/episodes/${id}`, null, { admin: true }),

  adminUploadVideo: async (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return uploadWithProgress("/api/admin/upload/video", form, onProgress);
  },

  adminUploadPoster: async (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return uploadWithProgress("/api/admin/upload/poster", form, onProgress);
  }
};

// Upload with progress tracking
async function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    });
    
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
    
    xhr.open("POST", `${BASE}${path}`);
    
    const auth = adminHeaders();
    if (auth.Authorization) {
      xhr.setRequestHeader("Authorization", auth.Authorization);
    }
    
    xhr.send(formData);
  });
}

export const streamMovieUrl = (id) => `${BASE}/api/stream/movie/${id}`;
export const streamEpisodeUrl = (id) => `${BASE}/api/stream/episode/${id}`;

// Serve posters safely through server
export const fileUrl = (absPath) => absPath ? `${BASE}/api/stream/file?path=${encodeURIComponent(absPath)}` : null;

// Continue watching functionality
export function listContinueWatching(limit = 12) {
  try {
    const raw = localStorage.getItem("continueWatching");
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    
    // Enrich each item with progress percentage
    return list.slice(0, limit).map(item => {
      const progress = getProgress(item.key);
      const pct = progress && progress.duration > 0 
        ? progress.seconds / progress.duration 
        : 0;
      return { ...item, pct };
    });
  } catch {
    return [];
  }
}

// Video progress tracking
export function getProgress(key) {
  try {
    const raw = localStorage.getItem(`progress:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setProgress(key, seconds, duration) {
  try {
    localStorage.setItem(`progress:${key}`, JSON.stringify({ seconds, duration, updatedAt: Date.now() }));
    
    // Update continue watching list
    const list = listContinueWatching(100);
    const existing = list.findIndex(item => item.key === key);
    
    if (existing >= 0) {
      list.splice(existing, 1);
    }
    
    // Only add to continue watching if not at the end
    if (seconds > 5 && (duration === 0 || seconds < duration - 30)) {
      list.unshift({ key, updatedAt: Date.now() });
    }
    
    localStorage.setItem("continueWatching", JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.error("Failed to save progress:", e);
  }
}
