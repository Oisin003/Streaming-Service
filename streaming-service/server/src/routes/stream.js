import express from "express";
import fs from "fs";
import path from "path";
import mime from "mime";
import { db } from "../db.js";
import { storageDir } from "../storage.js";

export const streamRouter = express.Router();

function streamFile(req, res, filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const contentType = mime.getType(filePath) || "application/octet-stream";

  if (!range) {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes"
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const match = /bytes=(\d+)-(\d+)?/.exec(range);
  const start = match ? parseInt(match[1], 10) : 0;
  const end = match && match[2] ? parseInt(match[2], 10) : fileSize - 1;

  const chunkSize = end - start + 1;

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": contentType
  });

  fs.createReadStream(filePath, { start, end }).pipe(res);
}

// Stream by DB id
streamRouter.get("/movie/:id", (req, res) => {
  const m = db.prepare("SELECT * FROM movies WHERE id=?").get(req.params.id);
  if (!m) return res.status(404).json({ error: "Not found" });
  streamFile(req, res, m.videoPath);
});

streamRouter.get("/episode/:id", (req, res) => {
  const ep = db.prepare("SELECT * FROM episodes WHERE id=?").get(req.params.id);
  if (!ep) return res.status(404).json({ error: "Not found" });
  streamFile(req, res, ep.videoPath);
});

streamRouter.get("/part/:id", (req, res) => {
  const part = db.prepare("SELECT * FROM movie_parts WHERE id=?").get(req.params.id);
  if (!part) return res.status(404).json({ error: "Not found" });
  streamFile(req, res, part.videoPath);
});

// Serve poster files via safe relative path under /storage
// Client sends the absolute path; we convert to storage-relative.
streamRouter.get("/file", (req, res) => {
  const p = req.query.path;
  if (!p || typeof p !== "string") return res.status(400).send("Missing path");

  const abs = path.resolve(p);
  const base = path.resolve(storageDir);

  // Prevent directory traversal: must be inside storageDir
  // Normalize paths for cross-platform comparison
  const normalizedAbs = path.normalize(abs).toLowerCase();
  const normalizedBase = path.normalize(base).toLowerCase();
  
  // Check if file is within storage directory
  const isWithinStorage = normalizedAbs === normalizedBase || 
                          normalizedAbs.startsWith(normalizedBase + path.sep);
  
  if (!isWithinStorage) {
    console.error(`[403] Forbidden: "${abs}" is not within "${base}"`);
    console.error(`Normalized abs: "${normalizedAbs}"`);
    console.error(`Normalized base: "${normalizedBase}"`);
    console.error(`Path separator: "${path.sep}"`);
    return res.status(403).send("Forbidden");
  }

  if (!fs.existsSync(abs)) {
    console.error(`[404] File not found: ${abs}`);
    return res.status(404).send("Not found");
  }

  const contentType = mime.getType(abs) || "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=31536000");
  fs.createReadStream(abs).pipe(res);
});
