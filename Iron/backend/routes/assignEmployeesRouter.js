import {
  assignResources,
  getAssignedResources,
  getJobsByDate,
  updateJobResources,   // Import new controller functions
  removeJobResources
} from '../controllers/assignEmployeesController.js';

import express from "express";

const assignRouter = express.Router();

// Original routes
assignRouter.post("/assign", assignResources);
assignRouter.get("/assigned/:jobId", getAssignedResources);
assignRouter.get('/by-date/:date', getJobsByDate);

// New routes for updating and removing resources
assignRouter.post("/update", updateJobResources);
assignRouter.post("/remove", removeJobResources);

export default assignRouter;