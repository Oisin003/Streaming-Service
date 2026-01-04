import { Router } from "express";
import { db } from "../db.js";

const router = Router();

// ===== DELETE REVIEW =====
router.delete("/reviews/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM reviews WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== BOOKMARKS =====
router.post("/bookmarks", (req, res) => {
  const { userId, documentId, position, note } = req.body;
  try {
    const result = db.prepare(
      "INSERT INTO bookmarks (userId, documentId, position, note) VALUES (?, ?, ?, ?)"
    ).run(userId, documentId, position, note || null);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/bookmarks/:userId/:documentId", (req, res) => {
  try {
    const bookmarks = db.prepare(
      "SELECT * FROM bookmarks WHERE userId = ? AND documentId = ? ORDER BY position ASC"
    ).all(req.params.userId, req.params.documentId);
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/bookmarks/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM bookmarks WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== HIGHLIGHTS =====
router.post("/highlights", (req, res) => {
  const { userId, documentId, startPosition, endPosition, note, color } = req.body;
  try {
    const result = db.prepare(
      "INSERT INTO highlights (userId, documentId, startPosition, endPosition, note, color) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(userId, documentId, startPosition, endPosition, note || null, color || '#ffeb3b');
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/highlights/:userId/:documentId", (req, res) => {
  try {
    const highlights = db.prepare(
      "SELECT * FROM highlights WHERE userId = ? AND documentId = ? ORDER BY startPosition ASC"
    ).all(req.params.userId, req.params.documentId);
    res.json(highlights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/highlights/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM highlights WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== READING STATS =====
router.post("/reading-stats", (req, res) => {
  const { userId, documentId, timeSeconds, wordsRead } = req.body;
  try {
    // Upsert stats
    const existing = db.prepare(
      "SELECT * FROM reading_stats WHERE userId = ? AND documentId = ?"
    ).get(userId, documentId);

    if (existing) {
      db.prepare(`
        UPDATE reading_stats 
        SET totalTimeSeconds = totalTimeSeconds + ?,
            wordsRead = wordsRead + ?,
            sessionsCount = sessionsCount + 1,
            lastSessionDate = CURRENT_TIMESTAMP
        WHERE userId = ? AND documentId = ?
      `).run(timeSeconds, wordsRead, userId, documentId);
    } else {
      db.prepare(`
        INSERT INTO reading_stats (userId, documentId, totalTimeSeconds, wordsRead, sessionsCount)
        VALUES (?, ?, ?, ?, 1)
      `).run(userId, documentId, timeSeconds, wordsRead);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/reading-stats/:userId/:documentId", (req, res) => {
  try {
    const stats = db.prepare(
      "SELECT * FROM reading_stats WHERE userId = ? AND documentId = ?"
    ).get(req.params.userId, req.params.documentId);
    res.json(stats || { totalTimeSeconds: 0, wordsRead: 0, sessionsCount: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== REVIEWS =====
router.post("/reviews", (req, res) => {
  const { userId, contentId, contentType, rating, reviewText } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO reviews (userId, contentId, contentType, rating, reviewText)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(userId, contentId, contentType) DO UPDATE SET
        rating = excluded.rating,
        reviewText = excluded.reviewText,
        updatedAt = CURRENT_TIMESTAMP
    `).run(userId, contentId, contentType, rating, reviewText || null);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/reviews/:contentType/:contentId", (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, u.username, u.avatar
      FROM reviews r
      JOIN users u ON r.userId = u.id
      WHERE r.contentType = ? AND r.contentId = ?
      ORDER BY r.createdAt DESC
    `).all(req.params.contentType, req.params.contentId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ACHIEVEMENTS =====
router.get("/achievements", (req, res) => {
  try {
    const achievements = db.prepare("SELECT * FROM achievements ORDER BY points ASC").all();
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user-achievements/:userId", (req, res) => {
  try {
    const achievements = db.prepare(`
      SELECT a.*, ua.unlockedAt
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievementId AND ua.userId = ?
      ORDER BY ua.unlockedAt DESC, a.points ASC
    `).all(req.params.userId);
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/user-achievements", (req, res) => {
  const { userId, achievementId } = req.body;
  try {
    db.prepare(`
      INSERT OR IGNORE INTO user_achievements (userId, achievementId)
      VALUES (?, ?)
    `).run(userId, achievementId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== GENRES =====
router.get("/genres", (req, res) => {
  try {
    const genres = db.prepare("SELECT * FROM genres ORDER BY name ASC").all();
    res.json(genres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/genres", (req, res) => {
  const { name } = req.body;
  try {
    const result = db.prepare("INSERT INTO genres (name) VALUES (?)").run(name);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TRAILERS =====
router.post("/trailers", (req, res) => {
  const { movieId, title, trailerPath, duration } = req.body;
  try {
    const result = db.prepare(
      "INSERT INTO movie_trailers (movieId, title, trailerPath, duration) VALUES (?, ?, ?, ?)"
    ).run(movieId, title, trailerPath, duration);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/trailers/:movieId", (req, res) => {
  try {
    const trailers = db.prepare(
      "SELECT * FROM movie_trailers WHERE movieId = ?"
    ).all(req.params.movieId);
    res.json(trailers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
