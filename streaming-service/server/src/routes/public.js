import express from "express";
import { db } from "../db.js";

export const publicRouter = express.Router();

// Get movie parts
publicRouter.get("/movies/:id/parts", (req, res) => {
  const parts = db.prepare("SELECT * FROM movie_parts WHERE movieId=? ORDER BY partNumber ASC").all(req.params.id);
  res.json(parts);
});

publicRouter.get("/parts/:id", (req, res) => {
  const part = db.prepare("SELECT * FROM movie_parts WHERE id=?").get(req.params.id);
  if (!part) return res.status(404).json({ error: "Part not found" });
  res.json(part);
});

publicRouter.get("/movies", (req, res) => {
  const { search, genre, type, sort, year, minRating } = req.query;
  
  let query = "SELECT * FROM movies WHERE 1=1";
  const params = [];
  
  if (search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (genre) {
    query += " AND genre = ?";
    params.push(genre);
  }
  
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }
  
  if (year) {
    query += " AND year = ?";
    params.push(parseInt(year));
  }
  
  if (minRating) {
    query += " AND averageRating >= ?";
    params.push(parseFloat(minRating));
  }
  
  // Sorting
  switch (sort) {
    case 'newest':
      query += " ORDER BY dateAdded DESC";
      break;
    case 'oldest':
      query += " ORDER BY dateAdded ASC";
      break;
    case 'rating':
      query += " ORDER BY averageRating DESC, totalRatings DESC";
      break;
    case 'title':
      query += " ORDER BY title ASC";
      break;
    default:
      query += " ORDER BY title ASC";
  }
  
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

publicRouter.get("/movies/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM movies WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

publicRouter.get("/shows/:id/episodes", (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM episodes
    WHERE showId=?
    ORDER BY seasonNumber ASC, episodeNumber ASC
  `).all(req.params.id);
  res.json(rows);
});

publicRouter.get("/episodes/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM episodes WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

publicRouter.get("/genres", (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT genre FROM movies
    WHERE genre IS NOT NULL AND TRIM(genre) <> ''
    ORDER BY genre ASC
  `).all();
  res.json(rows.map(r => r.genre));
});

// Recommendations based on watch history and ratings
publicRouter.get("/recommendations/:userId", (req, res) => {
  // Get user's top genres
  const topGenres = db.prepare(`
    SELECT m.genre, COUNT(*) as count
    FROM watch_history wh
    JOIN movies m ON wh.movieId = m.id
    WHERE wh.userId = ? AND m.genre IS NOT NULL
    GROUP BY m.genre
    ORDER BY count DESC
    LIMIT 3
  `).all(req.params.userId);
  
  if (topGenres.length === 0) {
    // Return popular content if no history
    const popular = db.prepare(`
      SELECT * FROM movies
      ORDER BY averageRating DESC, totalRatings DESC
      LIMIT 20
    `).all();
    return res.json(popular);
  }
  
  // Get recommendations from top genres
  const genres = topGenres.map(g => g.genre);
  const placeholders = genres.map(() => '?').join(',');
  
  const recommendations = db.prepare(`
    SELECT DISTINCT m.*
    FROM movies m
    LEFT JOIN watch_history wh ON m.id = wh.movieId AND wh.userId = ?
    WHERE m.genre IN (${placeholders})
    AND wh.id IS NULL
    ORDER BY m.averageRating DESC, m.totalRatings DESC
    LIMIT 20
  `).all(req.params.userId, ...genres);
  
  res.json(recommendations);
});

// Recently added content
publicRouter.get("/recently-added", (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const rows = db.prepare(`
    SELECT * FROM movies 
    ORDER BY dateAdded DESC
    LIMIT ?
  `).all(limit);
  res.json(rows);
});
