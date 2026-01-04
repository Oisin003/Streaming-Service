import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initSchema } from "./schema.js";
import { ensureStorage } from "./storage.js";
import { db } from "./db.js";

import { publicRouter } from "./routes/public.js";
import { adminRouter } from "./routes/admin.js";
import { streamRouter } from "./routes/stream.js";
import { usersRouter } from "./routes/users.js";
import { documentsRouter } from "./routes/documents.js";
import audiobookFeaturesRouter from "./routes/audiobook-features.js";

dotenv.config();

initSchema();
ensureStorage();

const app = express();
app.use(express.json({ limit: "10mb" }));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true
}));

const serverStartTime = Date.now();

app.get("/health", (req, res) => {
  try {
    // Get database counts
    const movieCount = db.prepare("SELECT COUNT(*) as count FROM movies WHERE type='MOVIE'").get().count;
    const showCount = db.prepare("SELECT COUNT(*) as count FROM movies WHERE type='SHOW'").get().count;
    const episodeCount = db.prepare("SELECT COUNT(*) as count FROM episodes").get().count;
    
    // Calculate uptime
    const uptimeMs = Date.now() - serverStartTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memoryInfo = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
    };
    
    const data = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: {
        formatted: uptimeFormatted,
        seconds: uptimeSeconds,
        days,
        hours,
        minutes,
        seconds
      },
      database: {
        connected: true,
        movies: movieCount,
        shows: showCount,
        episodes: episodeCount,
        totalContent: movieCount + showCount
      },
      memory: memoryInfo,
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid
      }
    };
    
    // Return JSON if requested
    if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
      return res.json(data);
    }
    
    // Return beautiful HTML page
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Status - Achilles+</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #141414;
      color: #ffffff;
      padding: 40px 20px;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 48px;
    }
    
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .brand-mark {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: #e50914;
      box-shadow: 0 4px 16px rgba(229, 9, 20, 0.4);
    }
    
    .brand-name {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    
    .brand-name span {
      color: #e50914;
    }
    
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 24px;
      background: linear-gradient(135deg, #46d369, #2ecc71);
      color: white;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 4px 16px rgba(70, 211, 105, 0.3);
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    
    .subtitle {
      color: rgba(255,255,255,0.6);
      font-size: 14px;
      margin-top: 8px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .card {
      background: rgba(25, 25, 25, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      transition: all 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(229, 9, 20, 0.3);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
    }
    
    .card-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }
    
    .card-title {
      font-size: 14px;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .card-value {
      font-size: 36px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 4px;
      letter-spacing: -1px;
    }
    
    .card-label {
      font-size: 13px;
      color: rgba(255,255,255,0.5);
    }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    
    .stat-row:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      color: rgba(255,255,255,0.6);
      font-size: 14px;
    }
    
    .stat-value {
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
    }
    
    .big-card {
      grid-column: 1 / -1;
    }
    
    .uptime-display {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    
    .uptime-unit {
      text-align: center;
      padding: 12px 20px;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .uptime-number {
      font-size: 28px;
      font-weight: 800;
      color: #e50914;
    }
    
    .uptime-label {
      font-size: 11px;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    
    .footer {
      text-align: center;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.4);
      font-size: 13px;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      color: white;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s ease;
      margin-top: 16px;
    }
    
    .btn:hover {
      background: rgba(255,255,255,0.15);
      border-color: rgba(229, 9, 20, 0.5);
      transform: translateY(-2px);
    }
    
    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .brand-name {
        font-size: 24px;
      }
      .card-value {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-mark"></div>
        <div class="brand-name">Achilles<span>+</span></div>
      </div>
      <div>
        <div class="status-badge">● System Healthy</div>
        <div class="subtitle">Last updated: ${new Date().toLocaleString()}</div>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <div class="card-icon">🎬</div>
        <div class="card-title">Movies</div>
        <div class="card-value">${data.database.movies}</div>
        <div class="card-label">Available to stream</div>
      </div>
      
      <div class="card">
        <div class="card-icon">📺</div>
        <div class="card-title">TV Shows</div>
        <div class="card-value">${data.database.shows}</div>
        <div class="card-label">Series in library</div>
      </div>
      
      <div class="card">
        <div class="card-icon">🎭</div>
        <div class="card-title">Episodes</div>
        <div class="card-value">${data.database.episodes}</div>
        <div class="card-label">Total episodes</div>
      </div>
      
      <div class="card">
        <div class="card-icon">📊</div>
        <div class="card-title">Total Content</div>
        <div class="card-value">${data.database.totalContent}</div>
        <div class="card-label">Movies + Shows</div>
      </div>
    </div>
    
    <div class="grid">
      <div class="card big-card">
        <div class="card-icon">⏱️</div>
        <div class="card-title">Server Uptime</div>
        <div class="uptime-display">
          <div class="uptime-unit">
            <div class="uptime-number">${data.uptime.days}</div>
            <div class="uptime-label">Days</div>
          </div>
          <div class="uptime-unit">
            <div class="uptime-number">${data.uptime.hours}</div>
            <div class="uptime-label">Hours</div>
          </div>
          <div class="uptime-unit">
            <div class="uptime-number">${data.uptime.minutes}</div>
            <div class="uptime-label">Minutes</div>
          </div>
          <div class="uptime-unit">
            <div class="uptime-number">${data.uptime.seconds}</div>
            <div class="uptime-label">Seconds</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <div class="card-icon">💾</div>
        <div class="card-title">Memory Usage</div>
        <div class="stat-row">
          <span class="stat-label">RSS</span>
          <span class="stat-value">${data.memory.rss} MB</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Heap Used</span>
          <span class="stat-value">${data.memory.heapUsed} MB</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Heap Total</span>
          <span class="stat-value">${data.memory.heapTotal} MB</span>
        </div>
      </div>
      
      <div class="card">
        <div class="card-icon">⚙️</div>
        <div class="card-title">Server Info</div>
        <div class="stat-row">
          <span class="stat-label">Node.js</span>
          <span class="stat-value">${data.server.nodeVersion}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Platform</span>
          <span class="stat-value">${data.server.platform}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Process ID</span>
          <span class="stat-value">${data.server.pid}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Database</span>
          <span class="stat-value">✓ Connected</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div>Achilles+ Streaming Service</div>
      <div style="margin-top: 8px;">
        <a href="http://localhost:5173" class="btn">← Back to Home</a>
        <a href="/health?format=json" class="btn">View JSON</a>
      </div>
    </div>
  </div>
  
  <script>
    // Auto-refresh every 5 seconds
    setTimeout(() => location.reload(), 5000);
  </script>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Error - Achilles+</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #141414;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .error-container {
      text-align: center;
      max-width: 600px;
    }
    .error-icon { font-size: 64px; margin-bottom: 16px; }
    h1 { color: #e50914; margin-bottom: 16px; }
    p { color: rgba(255,255,255,0.7); line-height: 1.6; }
    .error-details {
      background: rgba(229, 9, 20, 0.1);
      border: 1px solid rgba(229, 9, 20, 0.3);
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      text-align: left;
      font-family: monospace;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <h1>Server Error</h1>
    <p>Unable to retrieve server status information.</p>
    <div class="error-details">${error.message}</div>
  </div>
</body>
</html>
    `);
  }
});

app.use("/api", publicRouter);
app.use("/api/admin", adminRouter);
app.use("/api/stream", streamRouter);
app.use("/api/users", usersRouter);
app.use("/api", documentsRouter);
app.use("/api", audiobookFeaturesRouter);

// Statistics endpoint
app.get("/api/stats", (req, res) => {
  try {
    const movieCount = db.prepare("SELECT COUNT(*) as count FROM movies WHERE type='MOVIE'").get().count;
    const showCount = db.prepare("SELECT COUNT(*) as count FROM movies WHERE type='SHOW'").get().count;
    const episodeCount = db.prepare("SELECT COUNT(*) as count FROM episodes").get().count;
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
    
    // Most watched content
    const mostWatched = db.prepare(`
      SELECT m.id, m.title, m.type, m.posterPath, COUNT(wh.id) as watchCount
      FROM movies m
      LEFT JOIN watch_history wh ON m.id = wh.movieId
      GROUP BY m.id
      ORDER BY watchCount DESC
      LIMIT 10
    `).all();
    
    // Top rated content
    const topRated = db.prepare(`
      SELECT * FROM movies 
      WHERE totalRatings > 0
      ORDER BY averageRating DESC, totalRatings DESC
      LIMIT 10
    `).all();
    
    // Recently added
    const recentlyAdded = db.prepare(`
      SELECT * FROM movies 
      ORDER BY dateAdded DESC
      LIMIT 20
    `).all();
    
    // Genre distribution
    const genreStats = db.prepare(`
      SELECT genre, COUNT(*) as count
      FROM movies
      WHERE genre IS NOT NULL AND genre != ''
      GROUP BY genre
      ORDER BY count DESC
    `).all();

    res.json({
      overview: {
        movies: movieCount,
        shows: showCount,
        episodes: episodeCount,
        users: userCount,
        totalContent: movieCount + showCount
      },
      mostWatched,
      topRated,
      recentlyAdded,
      genreStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT || 8080);
const server = app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

// Increase timeout for large file uploads (30 minutes)
server.timeout = 1800000;
server.headersTimeout = 1800000;
server.keepAliveTimeout = 1800000;
