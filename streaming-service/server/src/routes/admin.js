import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db.js";
import { requireAdmin } from "../auth.js";
import { ensureStorage, videosDir, postersDir, safeName } from "../storage.js";

export const adminRouter = express.Router();
adminRouter.use(requireAdmin);

ensureStorage();

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, videosDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${safeName(file.originalname)}`)
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10GB max file size
  }
});

const posterUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, postersDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${safeName(file.originalname)}`)
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

adminRouter.post("/upload/video", videoUpload.single("file"), (req, res) => {
  res.json({ videoPath: path.resolve(req.file.path) });
});

adminRouter.post("/upload/poster", posterUpload.single("file"), (req, res) => {
  res.json({ posterPath: path.resolve(req.file.path) });
});

// Movies / Shows
adminRouter.get("/movies", (req, res) => {
  res.json(db.prepare("SELECT * FROM movies ORDER BY id DESC").all());
});

adminRouter.post("/movies", (req, res) => {
  const { title, description, year, type, genre, posterPath, videoPath } = req.body;
  if (!title || !type) return res.status(400).json({ error: "title and type required" });

  const info = db.prepare(`
    INSERT INTO movies (title, description, year, type, genre, posterPath, videoPath)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || "",
    year ?? null,
    type,
    genre || null,
    posterPath || null,
    videoPath || null
  );

  res.json(db.prepare("SELECT * FROM movies WHERE id=?").get(info.lastInsertRowid));
});

adminRouter.put("/movies/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM movies WHERE id=?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { title, description, year, type, genre, posterPath, videoPath } = req.body;

  db.prepare(`
    UPDATE movies SET title=?, description=?, year=?, type=?, genre=?, posterPath=?, videoPath=?
    WHERE id=?
  `).run(
    title,
    description || "",
    year ?? null,
    type,
    genre || null,
    posterPath || null,
    videoPath || null,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM movies WHERE id=?").get(req.params.id));
});

adminRouter.delete("/movies/:id", (req, res) => {
  db.prepare("DELETE FROM episodes WHERE showId=?").run(req.params.id);

  const m = db.prepare("SELECT * FROM movies WHERE id=?").get(req.params.id);
  db.prepare("DELETE FROM movies WHERE id=?").run(req.params.id);

  // Optional file deletes (disabled by default):
  // if (m?.videoPath && fs.existsSync(m.videoPath)) fs.unlinkSync(m.videoPath);
  // if (m?.posterPath && fs.existsSync(m.posterPath)) fs.unlinkSync(m.posterPath);

  res.json({ ok: true });
});

// Episodes
adminRouter.get("/shows/:showId/episodes", (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM episodes WHERE showId=?
    ORDER BY seasonNumber ASC, episodeNumber ASC
  `).all(req.params.showId);
  res.json(rows);
});

adminRouter.post("/episodes", (req, res) => {
  const { showId, seasonNumber, episodeNumber, title, description, posterPath, videoPath, runtimeSeconds } = req.body;

  if (!showId || !seasonNumber || !episodeNumber || !title || !videoPath) {
    return res.status(400).json({ error: "showId, seasonNumber, episodeNumber, title, videoPath required" });
  }

  const info = db.prepare(`
    INSERT INTO episodes (showId, seasonNumber, episodeNumber, title, description, posterPath, videoPath, runtimeSeconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    showId,
    seasonNumber,
    episodeNumber,
    title,
    description || "",
    posterPath || null,
    videoPath,
    runtimeSeconds ?? null
  );

  res.json(db.prepare("SELECT * FROM episodes WHERE id=?").get(info.lastInsertRowid));
});

adminRouter.put("/episodes/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM episodes WHERE id=?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { showId, seasonNumber, episodeNumber, title, description, posterPath, videoPath, runtimeSeconds } = req.body;

  db.prepare(`
    UPDATE episodes
    SET showId=?, seasonNumber=?, episodeNumber=?, title=?, description=?, posterPath=?, videoPath=?, runtimeSeconds=?
    WHERE id=?
  `).run(
    showId,
    seasonNumber,
    episodeNumber,
    title,
    description || "",
    posterPath || null,
    videoPath,
    runtimeSeconds ?? null,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM episodes WHERE id=?").get(req.params.id));
});

adminRouter.delete("/episodes/:id", (req, res) => {
  const ep = db.prepare("SELECT * FROM episodes WHERE id=?").get(req.params.id);
  db.prepare("DELETE FROM episodes WHERE id=?").run(req.params.id);

  // Optional file deletes:
  // if (ep?.videoPath && fs.existsSync(ep.videoPath)) fs.unlinkSync(ep.videoPath);
  // if (ep?.posterPath && fs.existsSync(ep.posterPath)) fs.unlinkSync(ep.posterPath);

  res.json({ ok: true });
});

// Movie Parts
adminRouter.get("/movies/:movieId/parts", (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM movie_parts WHERE movieId=?
    ORDER BY partNumber ASC
  `).all(req.params.movieId);
  res.json(rows);
});

adminRouter.post("/parts", (req, res) => {
  const { movieId, partNumber, title, description, videoPath, runtimeSeconds } = req.body;

  if (!movieId || !partNumber || !title || !videoPath) {
    return res.status(400).json({ error: "movieId, partNumber, title, videoPath required" });
  }

  const info = db.prepare(`
    INSERT INTO movie_parts (movieId, partNumber, title, description, videoPath, runtimeSeconds)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    movieId,
    partNumber,
    title,
    description || "",
    videoPath,
    runtimeSeconds ?? null
  );

  res.json(db.prepare("SELECT * FROM movie_parts WHERE id=?").get(info.lastInsertRowid));
});

adminRouter.put("/parts/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM movie_parts WHERE id=?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { movieId, partNumber, title, description, videoPath, runtimeSeconds } = req.body;

  db.prepare(`
    UPDATE movie_parts
    SET movieId=?, partNumber=?, title=?, description=?, videoPath=?, runtimeSeconds=?
    WHERE id=?
  `).run(
    movieId,
    partNumber,
    title,
    description || "",
    videoPath,
    runtimeSeconds ?? null,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM movie_parts WHERE id=?").get(req.params.id));
});

adminRouter.delete("/parts/:id", (req, res) => {
  const part = db.prepare("SELECT * FROM movie_parts WHERE id=?").get(req.params.id);
  db.prepare("DELETE FROM movie_parts WHERE id=?").run(req.params.id);

  // Optional file deletes:
  // if (part?.videoPath && fs.existsSync(part.videoPath)) fs.unlinkSync(part.videoPath);

  res.json({ ok: true });
});

// Bulk upload endpoint
adminRouter.post("/bulk-upload", videoUpload.array("files", 50), async (req, res) => {
  try {
    const results = [];
    const errors = [];
    
    for (const file of req.files) {
      try {
        const videoPath = path.resolve(file.path);
        const title = path.parse(file.originalname).name;
        
        // Try to detect if it's a TV show episode based on filename
        // Pattern: ShowName - S01E01 or ShowName.S01E01
        const episodeMatch = title.match(/(.+?)[\s\.\-]+[Ss](\d+)[Ee](\d+)/);
        
        let type = 'MOVIE';
        let seasonNumber = null;
        let episodeNumber = null;
        let showTitle = title;
        
        if (episodeMatch) {
          type = 'EPISODE';
          showTitle = episodeMatch[1].trim();
          seasonNumber = parseInt(episodeMatch[2]);
          episodeNumber = parseInt(episodeMatch[3]);
        }
        
        if (type === 'EPISODE') {
          // Find or create show
          let show = db.prepare("SELECT * FROM movies WHERE title = ? AND type = 'SHOW'").get(showTitle);
          
          if (!show) {
            const showResult = db.prepare(`
              INSERT INTO movies (title, type, description)
              VALUES (?, 'SHOW', ?)
            `).run(showTitle, `Auto-created from bulk upload`);
            show = db.prepare("SELECT * FROM movies WHERE id = ?").get(showResult.lastInsertRowid);
          }
          
          // Create episode
          const epResult = db.prepare(`
            INSERT INTO episodes (showId, seasonNumber, episodeNumber, title, videoPath)
            VALUES (?, ?, ?, ?, ?)
          `).run(show.id, seasonNumber, episodeNumber, title, videoPath);
          
          results.push({
            type: 'episode',
            showTitle: showTitle,
            season: seasonNumber,
            episode: episodeNumber,
            id: epResult.lastInsertRowid
          });
        } else {
          // Create movie
          const movieResult = db.prepare(`
            INSERT INTO movies (title, type, videoPath)
            VALUES (?, 'MOVIE', ?)
          `).run(title, videoPath);
          
          results.push({
            type: 'movie',
            title: title,
            id: movieResult.lastInsertRowid
          });
        }
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error.message
        });
      }
    }
    
    res.json({
      success: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

