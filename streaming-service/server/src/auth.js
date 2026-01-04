import dotenv from "dotenv";
dotenv.config();

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) {
    return res.status(401).json({ error: "Missing Basic auth" });
  }

  const raw = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
  const [user, pass] = raw.split(":");

  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
}
