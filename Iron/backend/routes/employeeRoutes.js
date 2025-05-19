import { addEmployee, deleteEmployee, getAllEmployees, updateEmployee, toggleEmployeeActive } from '../controllers/employeeController.js';

import express from 'express';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

const employeeRouter = express.Router();

employeeRouter.post('/add', upload.single('profileImage'), addEmployee);
employeeRouter.get('/get', getAllEmployees);
employeeRouter.put('/update', updateEmployee);
employeeRouter.delete('/delete', deleteEmployee);
employeeRouter.put('/toggle-active', toggleEmployeeActive);

export default employeeRouter;
