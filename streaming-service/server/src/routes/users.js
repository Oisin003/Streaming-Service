import express from "express";
import { db } from "../db.js";
import crypto from "crypto";

export const usersRouter = express.Router();

// Simple hash function (in production, use bcrypt)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Register new user
usersRouter.post("/register", (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const hashedPassword = hashPassword(password);
    const result = db.prepare(`
      INSERT INTO users (username, password, email, role)
      VALUES (?, ?, ?, 'user')
    `).run(username, hashedPassword, email || null);

    // Create default preferences
    db.prepare(`
      INSERT INTO user_preferences (userId) VALUES (?)
    `).run(result.lastInsertRowid);

    res.json({ 
      id: result.lastInsertRowid, 
      username,
      message: "User created successfully" 
    });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
usersRouter.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const hashedPassword = hashPassword(password);
  const user = db.prepare(`
    SELECT id, username, email, avatar, role, createdAt 
    FROM users 
    WHERE username = ? AND password = ?
  `).get(username, hashedPassword);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ user, message: "Login successful" });
});

// Get user profile
usersRouter.get("/profile/:id", (req, res) => {
  const user = db.prepare(`
    SELECT id, username, email, avatar, role, createdAt 
    FROM users WHERE id = ?
  `).get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const preferences = db.prepare(`
    SELECT theme, autoplay, language FROM user_preferences WHERE userId = ?
  `).get(req.params.id);

  res.json({ ...user, preferences });
});

// Update user profile
usersRouter.put("/profile/:id", (req, res) => {
  const { email, avatar } = req.body;
  
  db.prepare(`
    UPDATE users SET email = ?, avatar = ? WHERE id = ?
  `).run(email || null, avatar || null, req.params.id);

  res.json({ message: "Profile updated" });
});

// Update user preferences
usersRouter.put("/preferences/:userId", (req, res) => {
  const { theme, autoplay, language } = req.body;
  
  db.prepare(`
    INSERT INTO user_preferences (userId, theme, autoplay, language)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET
      theme = excluded.theme,
      autoplay = excluded.autoplay,
      language = excluded.language
  `).run(req.params.userId, theme, autoplay ? 1 : 0, language);

  res.json({ message: "Preferences updated" });
});

// Watchlist endpoints
usersRouter.get("/watchlist/:userId", (req, res) => {
  const items = db.prepare(`
    SELECT m.*, w.addedAt 
    FROM watchlist w
    JOIN movies m ON w.movieId = m.id
    WHERE w.userId = ?
    ORDER BY w.addedAt DESC
  `).all(req.params.userId);

  res.json(items);
});

usersRouter.post("/watchlist", (req, res) => {
  const { userId, movieId } = req.body;
  
  try {
    db.prepare(`
      INSERT INTO watchlist (userId, movieId) VALUES (?, ?)
    `).run(userId, movieId);
    res.json({ message: "Added to watchlist" });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: "Already in watchlist" });
    }
    res.status(500).json({ error: error.message });
  }
});

usersRouter.delete("/watchlist/:userId/:movieId", (req, res) => {
  db.prepare(`
    DELETE FROM watchlist WHERE userId = ? AND movieId = ?
  `).run(req.params.userId, req.params.movieId);
  
  res.json({ message: "Removed from watchlist" });
});

// Ratings endpoints
usersRouter.get("/ratings/:movieId", (req, res) => {
  const ratings = db.prepare(`
    SELECT r.*, u.username 
    FROM ratings r
    JOIN users u ON r.userId = u.id
    WHERE r.movieId = ?
    ORDER BY r.createdAt DESC
  `).all(req.params.movieId);

  res.json(ratings);
});

usersRouter.post("/rate", (req, res) => {
  const { userId, movieId, rating, review } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    db.prepare(`
      INSERT INTO ratings (userId, movieId, rating, review)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(userId, movieId) DO UPDATE SET
        rating = excluded.rating,
        review = excluded.review,
        createdAt = CURRENT_TIMESTAMP
    `).run(userId, movieId, rating, review || null);

    // Update movie average rating
    const avgRating = db.prepare(`
      SELECT AVG(rating) as avg, COUNT(*) as count 
      FROM ratings WHERE movieId = ?
    `).get(movieId);

    db.prepare(`
      UPDATE movies 
      SET averageRating = ?, totalRatings = ?
      WHERE id = ?
    `).run(avgRating.avg, avgRating.count, movieId);

    res.json({ message: "Rating submitted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Watch history
usersRouter.get("/history/:userId", (req, res) => {
  const history = db.prepare(`
    SELECT 
      wh.*,
      m.title as movieTitle,
      m.type as movieType,
      m.posterPath,
      e.title as episodeTitle,
      e.seasonNumber,
      e.episodeNumber
    FROM watch_history wh
    LEFT JOIN movies m ON wh.movieId = m.id
    LEFT JOIN episodes e ON wh.episodeId = e.id
    WHERE wh.userId = ?
    ORDER BY wh.watchedAt DESC
    LIMIT 100
  `).all(req.params.userId);

  res.json(history);
});

usersRouter.post("/history", (req, res) => {
  const { userId, movieId, episodeId, duration } = req.body;
  
  db.prepare(`
    INSERT INTO watch_history (userId, movieId, episodeId, duration)
    VALUES (?, ?, ?, ?)
  `).run(userId, movieId || null, episodeId || null, duration || null);

  res.json({ message: "Watch history recorded" });
});

// Collections
usersRouter.get("/collections/:userId", (req, res) => {
  const collections = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM collection_items WHERE collectionId = c.id) as itemCount
    FROM collections c
    WHERE c.userId = ? OR c.isPublic = 1
    ORDER BY c.createdAt DESC
  `).all(req.params.userId);

  res.json(collections);
});

usersRouter.post("/collections", (req, res) => {
  const { userId, name, description, isPublic } = req.body;
  
  const result = db.prepare(`
    INSERT INTO collections (userId, name, description, isPublic)
    VALUES (?, ?, ?, ?)
  `).run(userId, name, description || null, isPublic ? 1 : 0);

  res.json({ id: result.lastInsertRowid, message: "Collection created" });
});

usersRouter.post("/collections/:collectionId/items", (req, res) => {
  const { movieId } = req.body;
  
  try {
    db.prepare(`
      INSERT INTO collection_items (collectionId, movieId)
      VALUES (?, ?)
    `).run(req.params.collectionId, movieId);
    res.json({ message: "Added to collection" });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: "Already in collection" });
    }
    res.status(500).json({ error: error.message });
  }
});

usersRouter.get("/collections/:collectionId/items", (req, res) => {
  const items = db.prepare(`
    SELECT m.*, ci.addedAt
    FROM collection_items ci
    JOIN movies m ON ci.movieId = m.id
    WHERE ci.collectionId = ?
    ORDER BY ci.addedAt DESC
  `).all(req.params.collectionId);

  res.json(items);
});

// Downloads
usersRouter.get("/downloads/:userId", (req, res) => {
  const downloads = db.prepare(`
    SELECT 
      d.*,
      m.title as movieTitle,
      e.title as episodeTitle
    FROM downloads d
    LEFT JOIN movies m ON d.movieId = m.id
    LEFT JOIN episodes e ON d.episodeId = e.id
    WHERE d.userId = ?
    ORDER BY d.downloadedAt DESC
  `).all(req.params.userId);

  res.json(downloads);
});

usersRouter.post("/downloads", (req, res) => {
  const { userId, movieId, episodeId } = req.body;
  
  const result = db.prepare(`
    INSERT INTO downloads (userId, movieId, episodeId, status)
    VALUES (?, ?, ?, 'pending')
  `).run(userId, movieId || null, episodeId || null);

  res.json({ id: result.lastInsertRowid, message: "Download queued" });
});
