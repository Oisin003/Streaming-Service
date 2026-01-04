import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.resolve("data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "app.db"));
db.pragma("journal_mode = WAL");
