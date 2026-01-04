import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import mammoth from "mammoth";
import { db } from "../db.js";
import { requireAdmin } from "../auth.js";
import { safeName } from "../storage.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export const documentsRouter = express.Router();

// Create documents directory
const documentsDir = path.join(process.cwd(), "storage", "documents");
const coversDir = path.join(process.cwd(), "storage", "covers");

function ensureDocumentStorage() {
  if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });
  if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
}

ensureDocumentStorage();

const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, documentsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${safeName(file.originalname)}`)
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
});

const coverUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, coversDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${safeName(file.originalname)}`)
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Extract text from uploaded document
async function extractText(filePath, fileType) {
  try {
    if (fileType === 'PDF') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return { text: data.text, pageCount: data.numpages };
    } else if (fileType === 'DOCX') {
      const result = await mammoth.extractRawText({ path: filePath });
      return { text: result.value, pageCount: null };
    }
  } catch (error) {
    console.error("Text extraction error:", error);
    return { text: "", pageCount: null };
  }
}

// Admin routes (protected)
documentsRouter.post("/admin/upload/document", requireAdmin, documentUpload.single("file"), async (req, res) => {
  try {
    const filePath = path.resolve(req.file.path);
    const ext = path.extname(req.file.originalname).toUpperCase();
    const fileType = ext === '.PDF' ? 'PDF' : 'DOCX';
    
    // Extract text from the document
    const { text, pageCount } = await extractText(filePath, fileType);
    
    res.json({ 
      filePath, 
      fileType,
      extractedText: text,
      pageCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

documentsRouter.post("/admin/upload/cover", requireAdmin, coverUpload.single("file"), (req, res) => {
  res.json({ coverPath: path.resolve(req.file.path) });
});

// Admin - Document Management
documentsRouter.get("/admin/documents", requireAdmin, (req, res) => {
  const docs = db.prepare("SELECT * FROM documents ORDER BY dateAdded DESC").all();
  res.json(docs);
});

documentsRouter.post("/admin/documents", requireAdmin, (req, res) => {
  const { title, author, description, coverPath, filePath, fileType, extractedText, pageCount } = req.body;
  
  if (!title || !filePath || !fileType) {
    return res.status(400).json({ error: "title, filePath, and fileType required" });
  }

  const info = db.prepare(`
    INSERT INTO documents (title, author, description, coverPath, filePath, fileType, extractedText, pageCount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    author || null,
    description || null,
    coverPath || null,
    filePath,
    fileType,
    extractedText || null,
    pageCount || null
  );

  res.json(db.prepare("SELECT * FROM documents WHERE id=?").get(info.lastInsertRowid));
});

documentsRouter.put("/admin/documents/:id", requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT * FROM documents WHERE id=?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { title, author, description, coverPath } = req.body;

  db.prepare(`
    UPDATE documents SET title=?, author=?, description=?, coverPath=?
    WHERE id=?
  `).run(title, author || null, description || null, coverPath || null, req.params.id);

  res.json(db.prepare("SELECT * FROM documents WHERE id=?").get(req.params.id));
});

documentsRouter.delete("/admin/documents/:id", requireAdmin, (req, res) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id=?").get(req.params.id);
  db.prepare("DELETE FROM documents WHERE id=?").run(req.params.id);
  
  // Optional file deletion (commented out for safety)
  // if (doc?.filePath && fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
  // if (doc?.coverPath && fs.existsSync(doc.coverPath)) fs.unlinkSync(doc.coverPath);

  res.json({ ok: true });
});

// Public routes - Document browsing
documentsRouter.get("/documents", (req, res) => {
  const { search, author } = req.query;
  
  let query = "SELECT id, title, author, description, coverPath, fileType, pageCount, dateAdded FROM documents WHERE 1=1";
  const params = [];
  
  if (search) {
    query += " AND (title LIKE ? OR author LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (author) {
    query += " AND author = ?";
    params.push(author);
  }
  
  query += " ORDER BY dateAdded DESC";
  
  const docs = db.prepare(query).all(...params);
  res.json(docs);
});

documentsRouter.get("/documents/:id", (req, res) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id=?").get(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

// Reading progress endpoints
documentsRouter.get("/reading-progress/:userId/:documentId", (req, res) => {
  const progress = db.prepare(`
    SELECT * FROM reading_progress 
    WHERE userId=? AND documentId=?
  `).get(req.params.userId, req.params.documentId);
  
  res.json(progress || { currentPosition: 0 });
});

documentsRouter.post("/reading-progress", (req, res) => {
  const { userId, documentId, currentPosition } = req.body;
  
  if (!userId || !documentId || currentPosition === undefined) {
    return res.status(400).json({ error: "userId, documentId, and currentPosition required" });
  }

  const existing = db.prepare(`
    SELECT * FROM reading_progress WHERE userId=? AND documentId=?
  `).get(userId, documentId);

  if (existing) {
    db.prepare(`
      UPDATE reading_progress 
      SET currentPosition=?, lastRead=CURRENT_TIMESTAMP
      WHERE userId=? AND documentId=?
    `).run(currentPosition, userId, documentId);
  } else {
    db.prepare(`
      INSERT INTO reading_progress (userId, documentId, currentPosition)
      VALUES (?, ?, ?)
    `).run(userId, documentId, currentPosition);
  }

  res.json({ ok: true });
});

documentsRouter.get("/reading-progress/:userId", (req, res) => {
  const progress = db.prepare(`
    SELECT rp.*, d.title, d.author, d.coverPath
    FROM reading_progress rp
    JOIN documents d ON rp.documentId = d.id
    WHERE rp.userId=?
    ORDER BY rp.lastRead DESC
  `).all(req.params.userId);
  
  res.json(progress);
});
