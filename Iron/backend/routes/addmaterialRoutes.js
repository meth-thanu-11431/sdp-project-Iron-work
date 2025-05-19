import { addMaterial, deleteMaterial, fetchAllMaterials, getAllMaterials, updateMaterial, updateMaterialQuantity, getMaterialById } from '../controllers/addMaterial.js';

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

const materialRouter = express.Router();

// Define the POST route for adding a new tour
materialRouter.post('/add', upload.array('images',10), addMaterial);
materialRouter.get('/get',getAllMaterials)
materialRouter.put('/update',updateMaterial)
materialRouter.delete('/delete',deleteMaterial)
materialRouter.get('/get_all',fetchAllMaterials)
materialRouter.put('/update_all',updateMaterialQuantity)
materialRouter.put('/update_quantity', updateMaterialQuantity);
materialRouter.get('/get_one/:id', getMaterialById);
export default materialRouter;
