import { db } from "./db.js";

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      year INTEGER,
      type TEXT NOT NULL CHECK (type IN ('MOVIE','SHOW')),
      genre TEXT,
      posterPath TEXT,
      videoPath TEXT,
      dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP,
      averageRating REAL DEFAULT 0,
      totalRatings INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      showId INTEGER NOT NULL,
      seasonNumber INTEGER NOT NULL,
      episodeNumber INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      posterPath TEXT,
      videoPath TEXT NOT NULL,
      runtimeSeconds INTEGER,
      airDate DATE,
      FOREIGN KEY(showId) REFERENCES movies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS movie_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movieId INTEGER NOT NULL,
      partNumber INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      videoPath TEXT NOT NULL,
      runtimeSeconds INTEGER,
      FOREIGN KEY(movieId) REFERENCES movies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('admin','user')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      movieId INTEGER NOT NULL,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(movieId) REFERENCES movies(id) ON DELETE CASCADE,
      UNIQUE(userId, movieId)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      movieId INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(movieId) REFERENCES movies(id) ON DELETE CASCADE,
      UNIQUE(userId, movieId)
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      movieId INTEGER,
      episodeId INTEGER,
      watchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration INTEGER,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(movieId) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY(episodeId) REFERENCES episodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      isPublic INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collection_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collectionId INTEGER NOT NULL,
      movieId INTEGER NOT NULL,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(collectionId) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY(movieId) REFERENCES movies(id) ON DELETE CASCADE,
      UNIQUE(collectionId, movieId)
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      movieId INTEGER,
      episodeId INTEGER,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
      filePath TEXT,
      downloadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(movieId) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY(episodeId) REFERENCES episodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      userId INTEGER PRIMARY KEY,
      theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark','light')),
      autoplay INTEGER DEFAULT 1,
      language TEXT DEFAULT 'en',
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      description TEXT,
      coverPath TEXT,
      filePath TEXT NOT NULL,
      fileType TEXT NOT NULL CHECK (fileType IN ('PDF','DOCX')),
      extractedText TEXT,
      pageCount INTEGER,
      dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      documentId INTEGER NOT NULL,
      currentPosition INTEGER DEFAULT 0,
      lastRead DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE,
      UNIQUE(userId, documentId)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      documentId INTEGER NOT NULL,
      position INTEGER NOT NULL,
      note TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      documentId INTEGER NOT NULL,
      startPosition INTEGER NOT NULL,
      endPosition INTEGER NOT NULL,
      note TEXT,
      color TEXT DEFAULT '#ffeb3b',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reading_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      documentId INTEGER NOT NULL,
      totalTimeSeconds INTEGER DEFAULT 0,
      wordsRead INTEGER DEFAULT 0,
      sessionsCount INTEGER DEFAULT 0,
      lastSessionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE,
      UNIQUE(userId, documentId)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      contentId INTEGER NOT NULL,
      contentType TEXT NOT NULL CHECK (contentType IN ('movie','document')),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      reviewText TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, contentId, contentType)
    );

    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movie_genres (
      movieId INTEGER NOT NULL,
      genreId INTEGER NOT NULL,
      FOREIGN KEY(movieId) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY(genreId) REFERENCES genres(id) ON DELETE CASCADE,
      PRIMARY KEY(movieId, genreId)
    );

    CREATE TABLE IF NOT EXISTS document_genres (
      documentId INTEGER NOT NULL,
      genreId INTEGER NOT NULL,
      FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY(genreId) REFERENCES genres(id) ON DELETE CASCADE,
      PRIMARY KEY(documentId, genreId)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      requirement TEXT,
      points INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      achievementId INTEGER NOT NULL,
      unlockedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(achievementId) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(userId, achievementId)
    );

    CREATE TABLE IF NOT EXISTS movie_trailers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movieId INTEGER NOT NULL,
      title TEXT,
      trailerPath TEXT NOT NULL,
      duration INTEGER,
      FOREIGN KEY(movieId) REFERENCES movies(id) ON DELETE CASCADE
    );
  `);

  // basic migrations (safe to run repeatedly)
  try { db.exec(`ALTER TABLE movies ADD COLUMN genre TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE movies ADD COLUMN posterPath TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE episodes ADD COLUMN posterPath TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE movies ADD COLUMN dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP;`); } catch {}
  try { db.exec(`ALTER TABLE movies ADD COLUMN averageRating REAL DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE movies ADD COLUMN totalRatings INTEGER DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE episodes ADD COLUMN airDate DATE;`); } catch {}
  try { db.exec(`ALTER TABLE documents ADD COLUMN averageRating REAL DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE documents ADD COLUMN totalRatings INTEGER DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE reading_progress ADD COLUMN voicePreference TEXT;`); } catch {}

  // Seed default achievements
  const achievements = [
    { name: 'First Steps', description: 'Create your account', icon: '🎬', requirement: 'register', points: 10 },
    { name: 'Movie Buff', description: 'Watch 10 movies', icon: '🍿', requirement: 'watch_10_movies', points: 50 },
    { name: 'Binge Watcher', description: 'Watch 50 movies', icon: '📺', requirement: 'watch_50_movies', points: 100 },
    { name: 'Bookworm', description: 'Read 5 audiobooks', icon: '📚', requirement: 'read_5_books', points: 50 },
    { name: 'Speed Reader', description: 'Read 100,000 words', icon: '⚡', requirement: 'read_100k_words', points: 75 },
    { name: 'Critic', description: 'Leave 10 reviews', icon: '⭐', requirement: 'review_10_items', points: 40 },
    { name: 'Curator', description: 'Add 20 items to watchlist', icon: '📋', requirement: 'watchlist_20_items', points: 30 },
    { name: 'Night Owl', description: 'Watch content at 2 AM', icon: '🦉', requirement: 'watch_at_2am', points: 20 },
    { name: 'Marathon', description: 'Watch for 12 hours straight', icon: '🏃', requirement: 'watch_12_hours', points: 100 },
    { name: 'Annotator', description: 'Create 50 highlights/notes', icon: '✍️', requirement: 'create_50_notes', points: 60 }
  ];

  achievements.forEach(a => {
    try {
      db.prepare('INSERT OR IGNORE INTO achievements (name, description, icon, requirement, points) VALUES (?, ?, ?, ?, ?)')
        .run(a.name, a.description, a.icon, a.requirement, a.points);
    } catch {}
  });
}
