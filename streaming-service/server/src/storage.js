import fs from "fs";
import path from "path";

export const storageDir = path.resolve("storage");
export const videosDir = path.join(storageDir, "videos");
export const postersDir = path.join(storageDir, "posters");

export function ensureStorage() {
  fs.mkdirSync(videosDir, { recursive: true });
  fs.mkdirSync(postersDir, { recursive: true });
}

export function safeName(name = "file") {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
