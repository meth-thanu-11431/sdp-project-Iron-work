import { addMachine, deleteMachine, getAllMachines, updateMachine } from '../controllers/machineController.js';

import express from 'express';
import multer from 'multer';
import path from 'path';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Extract the file extension
    cb(null, `${Date.now()}-${file.fieldname}${ext}`); // Generate a unique filename
  },
});

// Initialize multer
const upload = multer({ storage: storage });

const machineRouter = express.Router();

// Define the POST route for adding a new tour
machineRouter.post('/add', upload.array('images',10), addMachine);
machineRouter.get('/get',getAllMachines)
machineRouter.delete('/delete',deleteMachine)
machineRouter.put('/update',updateMachine)
export default machineRouter;
