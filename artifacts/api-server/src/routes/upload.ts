import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import fs from "fs";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.role) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString("hex");
    cb(null, `${name}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed (jpg, png, webp, gif)"));
    }
  },
});

router.post("/upload", requireAuth, upload.single("file"), (req: any, res: any) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const domain = process.env.APP_DOMAIN ?? process.env.REPLIT_DEV_DOMAIN ?? "localhost";
  const url = `https://${domain}/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
