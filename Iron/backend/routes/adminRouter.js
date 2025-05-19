import { loginAdmin, registerAdmin } from "../controllers/adminConroller.js";

import express from "express";

const adminRouter = express.Router();

adminRouter.post("/register", registerAdmin);
adminRouter.post("/login", loginAdmin);

export default adminRouter;
