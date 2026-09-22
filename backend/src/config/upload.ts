import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Absolute path to the uploads folder (backend/uploads), resolved from the
// compiled location (dist/config -> backend).
export const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads')

// Make sure the folder exists before anything tries to write to / serve from it.
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

// Keep the upload in memory so the controller can validate its dimensions
// before we write anything to disk (no orphan files on a failed registration).
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
})
