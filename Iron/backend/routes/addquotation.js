import { 
  addPayment, 
  createInvoice, 
  createQuotation, 
  getAllInvoices, 
  getAllInvoicesAdmin, 
  getAllJobs, 
  getAllQuotationsForAdmin, 
  getInvoiceById, 
  getInvoicesByUserId, 
  getInvoicesByUserId2, 
  getJobsByCustomerId, 
  saveQuotationMaterial,
  getQuotations,
  getSavedMaterials,
  createOrUpdateJob,
  getQuotationById,
  getPartiallyPaidJobs,
  getPartiallyPaidInvoices,
  updateJob, 
  updateQuotationStatus,
  updateCustomerQuotationStatus,  // Add this import
  updateQuotationAmount          // Add this import
} from '../controllers/addquotationController.js';

import authMiddleware from '../middleware/auth.js';
import express from 'express';

const quotationRouter = express.Router();

quotationRouter.post('/create', authMiddleware, createQuotation);
quotationRouter.post('/get', authMiddleware, getQuotations); // Changed from .get to .post
quotationRouter.get('/admin', getAllQuotationsForAdmin);
quotationRouter.put('/status', updateQuotationStatus);
quotationRouter.post('/invoice_create', createInvoice);
quotationRouter.post('/invoice_payment', addPayment);
quotationRouter.get('/get_all', getAllInvoicesAdmin);
quotationRouter.get('/get_invoice', authMiddleware, getInvoicesByUserId);
quotationRouter.post('/get_invoice2', getInvoicesByUserId2);
quotationRouter.post('/get_invoice_by_id', getInvoiceById);
quotationRouter.get('/get_all_jobs', getAllJobs);
quotationRouter.put('/update_job', updateJob);
quotationRouter.post('/get_job', authMiddleware, getJobsByCustomerId);
quotationRouter.get('/get_all_invoices', getAllInvoices);
// Update your routes
quotationRouter.get('/get_materials/:quotationId', getSavedMaterials);
quotationRouter.post('/save_material', saveQuotationMaterial);
quotationRouter.get('/get_partially_paid_jobs', getPartiallyPaidJobs);

// Add these routes to your quotationRouter
quotationRouter.get('/get_partially_paid_invoices', getPartiallyPaidInvoices);
quotationRouter.get('/get_one/:quotationId', getQuotationById);
quotationRouter.post('/create_or_update_job', createOrUpdateJob);


// Add these two new routes
quotationRouter.put('/customer_status', authMiddleware, updateCustomerQuotationStatus);
quotationRouter.put('/update_amount', updateQuotationAmount);

export default quotationRouter;