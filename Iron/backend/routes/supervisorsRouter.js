import { deleteSupervisor, getSupervisorById, getSupervisors, loginSupervisor, registerSupervisor, updateProfileImage } from "../controllers/supervisorsController.js";

import authMiddleware from "../middleware/auth.js";
import express from "express";
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const supervisorsRouter = express.Router();

// Set up multer for file upload
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Define routes
supervisorsRouter.post("/register", registerSupervisor);
supervisorsRouter.post("/login", loginSupervisor);
supervisorsRouter.post("/delete", authMiddleware, deleteSupervisor);
supervisorsRouter.get("/get_guides", getSupervisors);
supervisorsRouter.get("/get_guide", authMiddleware, getSupervisorById);
supervisorsRouter.post('/update', authMiddleware, upload.single('profile_image'), updateProfileImage);

export default supervisorsRouter;
