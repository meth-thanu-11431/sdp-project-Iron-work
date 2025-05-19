// Updated userRouter.js with new routes

import { 
  changePassword,
  deleteUser, 
  getUserById, 
  getUsers, 
  loginUser, 
  registerUser, 
  updateProfileImage,
  updateUserInfo,
  updateUser
} from "../controllers/userController.js";

import authMiddleware from "../middleware/auth.js";
import express from "express";
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const userRouter = express.Router();

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

// Basic authentication routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/delete", authMiddleware, deleteUser);
userRouter.get("/get_users", getUsers);
userRouter.get("/get_user", authMiddleware, getUserById);

// Profile management routes
userRouter.post('/update', authMiddleware, upload.single('profile_image'), updateUser);
userRouter.post('/update_info', authMiddleware, updateUserInfo);
userRouter.post('/change_password', authMiddleware, changePassword);

export default userRouter;