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

function uploadWithProgress(path, formData, onProgress, { admin = false } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress(percentComplete);
      }
    });
    
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    });
    
    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });
    
    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });
    
    xhr.open("POST", `${BASE}${path}`);
    
    if (admin) {
      const headers = adminHeaders();
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });
    }
    
    xhr.send(formData);
  });
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
  // Public content browsing
  listAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return http("GET", `/api/movies${query ? `?${query}` : ""}`);
  },
  getMovie: (id) => http("GET", `/api/movies/${id}`),
  listEpisodes: (showId) => http("GET", `/api/shows/${showId}/episodes`),
  getEpisode: (id) => http("GET", `/api/episodes/${id}`),
  listMovieParts: (movieId) => http("GET", `/api/movies/${movieId}/parts`),
  getMoviePart: (id) => http("GET", `/api/parts/${id}`),
  listGenres: () => http("GET", "/api/genres"),
  getRecentlyAdded: (limit = 20) => http("GET", `/api/recently-added?limit=${limit}`),
  getRecommendations: (userId) => http("GET", `/api/recommendations/${userId}`),
  getStats: () => http("GET", "/api/stats"),

  // User authentication & profile
  userRegister: (data) => http("POST", "/api/users/register", data),
  userLogin: (data) => http("POST", "/api/users/login", data),
  getUserProfile: (userId) => http("GET", `/api/users/profile/${userId}`),
  updateUserProfile: (userId, data) => http("PUT", `/api/users/profile/${userId}`, data),
  getUserPreferences: (userId) => http("GET", `/api/users/preferences/${userId}`),
  updateUserPreferences: (userId, data) => http("PUT", `/api/users/preferences/${userId}`, data),

  // Watchlist
  getWatchlist: (userId) => http("GET", `/api/users/watchlist/${userId}`),
  addToWatchlist: (data) => http("POST", "/api/users/watchlist", data),
  removeFromWatchlist: (userId, movieId) => http("DELETE", `/api/users/watchlist/${userId}/${movieId}`),

  // Ratings & Reviews
  getRatings: (movieId) => http("GET", `/api/users/ratings/${movieId}`),
  rateContent: (data) => http("POST", "/api/users/rate", data),

  // Watch History
  getWatchHistory: (userId) => http("GET", `/api/users/watch-history/${userId}`),
  addToWatchHistory: (data) => http("POST", "/api/users/watch-history", data),

  // Collections
  getCollections: (userId) => http("GET", `/api/users/collections/${userId}`),
  createCollection: (data) => http("POST", "/api/users/collections", data),
  getCollectionItems: (collectionId) => http("GET", `/api/users/collections/${collectionId}/items`),
  addToCollection: (data) => http("POST", `/api/users/collections/items`, data),

  // Downloads
  getDownloads: (userId) => http("GET", `/api/users/downloads/${userId}`),
  requestDownload: (data) => http("POST", "/api/users/downloads", data),

  // Admin - Content Management
  adminList: () => http("GET", "/api/admin/movies", null, { admin: true }),
  adminCreateMovie: (m) => http("POST", "/api/admin/movies", m, { admin: true }),
  adminUpdateMovie: (id, m) => http("PUT", `/api/admin/movies/${id}`, m, { admin: true }),
  adminDeleteMovie: (id) => http("DELETE", `/api/admin/movies/${id}`, null, { admin: true }),

  adminListEpisodes: (showId) => http("GET", `/api/admin/shows/${showId}/episodes`, null, { admin: true }),
  adminCreateEpisode: (ep) => http("POST", "/api/admin/episodes", ep, { admin: true }),
  adminUpdateEpisode: (id, ep) => http("PUT", `/api/admin/episodes/${id}`, ep, { admin: true }),
  adminDeleteEpisode: (id) => http("DELETE", `/api/admin/episodes/${id}`, null, { admin: true }),

  adminListParts: (movieId) => http("GET", `/api/admin/movies/${movieId}/parts`, null, { admin: true }),
  adminCreatePart: (part) => http("POST", "/api/admin/parts", part, { admin: true }),
  adminUpdatePart: (id, part) => http("PUT", `/api/admin/parts/${id}`, part, { admin: true }),
  adminDeletePart: (id) => http("DELETE", `/api/admin/parts/${id}`, null, { admin: true }),

  // Admin - File Uploads
  adminUploadVideo: async (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return uploadWithProgress("/api/admin/upload/video", form, onProgress, { admin: true });
  },

  adminUploadPoster: async (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return uploadWithProgress("/api/admin/upload/poster", form, onProgress, { admin: true });
  },

  adminBulkUpload: async (files, onProgress) => {
    const form = new FormData();
    files.forEach((file) => form.append("videos", file));
    return uploadWithProgress("/api/admin/bulk-upload", form, onProgress, { admin: true });
  },

  // Documents & Audiobooks
  listDocuments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return http("GET", `/api/documents${query ? `?${query}` : ""}`);
  },
  getDocument: (id) => http("GET", `/api/documents/${id}`),
  
  // Reading Progress
  getReadingProgress: (userId, documentId) => http("GET", `/api/reading-progress/${userId}/${documentId}`),
  saveReadingProgress: (data) => http("POST", "/api/reading-progress", data),
  getUserReadingProgress: (userId) => http("GET", `/api/reading-progress/${userId}`),

  // Admin - Document Management
  adminListDocuments: () => http("GET", "/api/admin/documents", null, { admin: true }),
  adminCreateDocument: (doc) => http("POST", "/api/admin/documents", doc, { admin: true }),
  adminUpdateDocument: (id, doc) => http("PUT", `/api/admin/documents/${id}`, doc, { admin: true }),
  adminDeleteDocument: (id) => http("DELETE", `/api/admin/documents/${id}`, null, { admin: true }),

  adminUploadDocument: async (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return uploadWithProgress("/api/admin/upload/document", form, onProgress, { admin: true });
  },

  adminUploadCover: async (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return uploadWithProgress("/api/admin/upload/cover", form, onProgress, { admin: true });
  },

  // Bookmarks
  createBookmark: (data) => http("POST", "/api/bookmarks", data),
  getBookmarks: (userId, documentId) => http("GET", `/api/bookmarks/${userId}/${documentId}`),
  deleteBookmark: (id) => http("DELETE", `/api/bookmarks/${id}`),

  // Highlights
  createHighlight: (data) => http("POST", "/api/highlights", data),
  getHighlights: (userId, documentId) => http("GET", `/api/highlights/${userId}/${documentId}`),
  deleteHighlight: (id) => http("DELETE", `/api/highlights/${id}`),

  // Reading Stats
  saveReadingStats: (data) => http("POST", "/api/reading-stats", data),
  getReadingStats: (userId, documentId) => http("GET", `/api/reading-stats/${userId}/${documentId}`),

  // Reviews
  createReview: (data) => http("POST", "/api/reviews", data),
  getReviews: (contentType, contentId) => http("GET", `/api/reviews/${contentType}/${contentId}`),
  deleteReview: (id) => http("DELETE", `/api/reviews/${id}`),

  // Achievements
  getAchievements: () => http("GET", "/api/achievements"),
  getUserAchievements: (userId) => http("GET", `/api/user-achievements/${userId}`),
  unlockAchievement: (data) => http("POST", "/api/user-achievements", data),

  // Genres
  getGenres: () => http("GET", "/api/genres"),
  createGenre: (name) => http("POST", "/api/genres", { name }),

  // Trailers
  createTrailer: (data) => http("POST", "/api/trailers", data),
  getTrailers: (movieId) => http("GET", `/api/trailers/${movieId}`)
};

export const streamMovieUrl = (id) => `${BASE}/api/stream/movie/${id}`;
export const streamEpisodeUrl = (id) => `${BASE}/api/stream/episode/${id}`;
export const streamPartUrl = (id) => `${BASE}/api/stream/part/${id}`;

// Serve posters safely through server
export const fileUrl = (absPath) => {
  if (!absPath || absPath === 'null' || absPath === 'undefined') return null;
  return `${BASE}/api/stream/file?path=${encodeURIComponent(absPath)}`;
};
