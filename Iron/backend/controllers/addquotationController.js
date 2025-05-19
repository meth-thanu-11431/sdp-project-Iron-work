import pool from "../config/db.js";

// Create a new quotation
export const createQuotation = async (req, res) => {
  const {
    job_description,
    job_category,
    userId,
    userName,
    phone,
    location,
    immediate,
    jobID,
  } = req.body;

  if (
    !job_description ||
    !job_category ||
    !userId ||
    !userName ||
    !phone ||
    !location ||
    !immediate ||
    !jobID
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Job description, job category, userId, userName, phone, location, immediate, and jobID are required",
    });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO quotations (customer_id, customer_name, job_description, job_category, quotation_amount, status, phone, location, immediate, jobID) VALUES (?, ?, ?, ?, 0.00, "Pending", ?, ?, ?, ?)',
      [
        userId,
        userName,
        job_description,
        job_category,
        phone,
        location,
        immediate,
        jobID,
      ]
    );
    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotationId: result.insertId,
      jobID,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error creating quotation" });
  }
};


const formatDateForSql = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return null;
    }
    
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formatting date:", e);
    return null;
  }
};


export const getQuotationMaterials = async (req, res) => {
  const { quotationId } = req.params;

  try {
    // If you have a quotation_materials table, fetch from there
    const [materials] = await pool.query(
      "SELECT * FROM quotation_materials WHERE quotation_id = ?",
      [quotationId]
    );

    return res.status(200).json({
      success: true,
      materials,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching quotation materials",
    });
  }
};

// Get all quotations for a customer
export const getQuotations = async (req, res) => {
  const customerId = req.body.userId;

  try {
    const [quotations] = await pool.query(
      "SELECT * FROM quotations WHERE customer_id = ? ORDER BY id DESC",
      [customerId]
    );

    return res.status(200).json({
      success: true,
      quotations, // jobID included if present in table
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching quotations" });
  }
};

// Get all quotations for the admin
export const getAllQuotationsForAdmin = async (req, res) => {
  try {
    // Now also select customer_name from quotations table
    const [quotations] = await pool.query(`
      SELECT q.*, c.customer_name 
      FROM quotations q
      JOIN customers c ON q.customer_id = c.CustomerID
      ORDER BY q.id DESC
    `);

    return res.status(200).json({
      success: true,
      quotations,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching quotations" });
  }
};

// Update quotation status
export const updateQuotationStatus = async (req, res) => {
  const { quotationId, status, job_description } = req.body;

  try {
    // Update the quotation status and optionally the job_description
    if (job_description !== undefined) {
      await pool.query(
        "UPDATE quotations SET status = ?, job_description = ? WHERE id = ?",
        [status, job_description, quotationId]
      );
    } else {
      await pool.query("UPDATE quotations SET status = ? WHERE id = ?", [
        status,
        quotationId,
      ]);
    }

    // If the status is "Approved", and we're going to create a job/invoice,
    // then we should check customer approval
    if (status === "Approved") {
      // Check if there is a pending invoice creation
      const isPendingInvoiceCreation = req.body.createInvoice === true;

      if (isPendingInvoiceCreation) {
        // Check customer status first
        const [customerStatusResult] = await pool.query(
          "SELECT customer_status FROM quotations WHERE id = ?",
          [quotationId]
        );

        // Only create job if customer has approved
        if (
          !customerStatusResult[0] ||
          customerStatusResult[0].customer_status !== "Approved"
        ) {
          return res.status(400).json({
            success: false,
            message: "Cannot create invoice - waiting for customer approval",
          });
        }

        // Fetch the quotation details along with customer_id
        const [quotation] = await pool.query(
          "SELECT job_description AS name, job_category, customer_id, quotation_amount FROM quotations WHERE id = ?",
          [quotationId]
        );

        // Check if quotation exists
        if (quotation.length > 0) {
          const jobName = quotation[0].name;
          const jobCategory = quotation[0].job_category || "";
          const customerId = quotation[0].customer_id;
          const quotationAmount = quotation[0].quotation_amount;
          const startDate = new Date(); // Set current date as start date
          const finishDate = null;
          const jobStatus = "Pending";

          // Save as job with customer_id and job_category
          await pool.query(
            "INSERT INTO jobs (quotation_id, job_name, job_category, start_date, finish_date, status, customer_id, quotation_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              quotationId,
              jobName,
              jobCategory,
              startDate,
              finishDate,
              jobStatus,
              customerId,
              quotationAmount,
            ]
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Quotation status updated successfully",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error updating quotation status" });
  }
};

export const getSavedMaterials = async (req, res) => {
  const { quotationId } = req.params;

  try {
    const [materials] = await pool.query(
      "SELECT * FROM quotation_materials WHERE quotation_id = ?",
      [quotationId]
    );

    return res.status(200).json({
      success: true,
      materials,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching saved materials",
    });
  }
};

export const saveQuotationMaterial = async (req, res) => {
  const { quotationId, material_name, quantity, unit_price, material_id } =
    req.body;

  try {
    await pool.query(
      "INSERT INTO quotation_materials (quotation_id, material_name, quantity, unit_price, material_id) VALUES (?, ?, ?, ?, ?)",
      [quotationId, material_name, quantity, unit_price, material_id]
    );

    return res.status(201).json({
      success: true,
      message: "Material added to quotation successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error saving quotation material",
    });
  }
};

export const getPartiallyPaidJobs = async (req, res) => {
  try {
    // This query joins jobs with invoices to filter by payment status
    const [jobs] = await pool.query(`
      SELECT j.*, i.payment_status, c.customer_name 
      FROM jobs j
      JOIN invoices i ON j.quotation_id = i.quotation_id
      JOIN quotations q ON j.quotation_id = q.id
      JOIN customers c ON q.customer_id = c.CustomerID
      WHERE i.payment_status = 'Partially Paid'
      ORDER BY j.id DESC
    `);

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching partially paid jobs",
    });
  }
};

// Get all partially paid invoices with quotation and customer details
export const getPartiallyPaidInvoices = async (req, res) => {
  try {
    console.log("Starting getPartiallyPaidInvoices function");
    
    // FIXED: Added immediate field from quotations to use as finish_date in jobs
    const [invoices] = await pool.query(`
      SELECT 
        i.id,
        i.quotation_id,
        i.total_amount,
        i.paid_amount,
        i.payment_status,
        i.created_at,
        q.customer_id,
        q.job_description,
        q.job_category,
        q.jobID,
        q.phone,
        q.location,
        q.immediate,      /* Added immediate field from quotations */
        c.customer_name,
        c.tel_num
      FROM invoices i
      JOIN quotations q ON i.quotation_id = q.id
      JOIN customers c ON q.customer_id = c.CustomerID
      WHERE i.payment_status = 'Partially Paid'
      ORDER BY i.created_at DESC
    `);
    
    console.log(`Found ${invoices.length} partially paid invoices`);
    
    // For each invoice, check if a job already exists
    for (let i = 0; i < invoices.length; i++) {
      try {
        // Check if job exists for this invoice/quotation
        const [existingJobs] = await pool.query(
          "SELECT * FROM jobs WHERE quotation_id = ?",
          [invoices[i].quotation_id]
        );
        
        // If job exists, add it to the invoice object
        if (existingJobs.length > 0) {
          invoices[i].existingJob = existingJobs[0];
        }
      } catch (jobError) {
        console.error(`Error checking jobs for invoice ${invoices[i].id}:`, jobError);
        // Continue without job data
      }
    }

    return res.status(200).json({
      success: true,
      invoices,
    });
  } catch (err) {
    console.error("Error in getPartiallyPaidInvoices:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching partially paid invoices: " + err.message,
    });
  }
};

// Get one quotation by ID
export const getQuotationById = async (req, res) => {
  const { quotationId } = req.params;

  try {
    const [quotations] = await pool.query(
      `SELECT q.*, c.customer_name 
       FROM quotations q
       JOIN customers c ON q.customer_id = c.CustomerID
       WHERE q.id = ?`,
      [quotationId]
    );

    if (quotations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.status(200).json({
      success: true,
      quotation: quotations[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching quotation",
    });
  }
};

// Create or update a job
export const createOrUpdateJob = async (req, res) => {
  const { 
    quotationId, 
    invoiceId,
    jobName, 
    jobCategory,
    actualStartDate, // This should go into start_date, not finish_date
    status, 
    customerId,
    quotationAmount,
    jobID
  } = req.body;

  try {
    console.log("Create or update job request:", {
      quotationId, 
      invoiceId,
      jobName,
      jobCategory,
      actualStartDate,
      status,
      customerId,
      quotationAmount,
      jobID
    });

    // First, we need to get the immediate date from the quotation table
    // to use as the finish_date in the jobs table
    const [quotationData] = await pool.query(
      "SELECT immediate FROM quotations WHERE id = ?",
      [quotationId]
    );

    if (quotationData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }
    
    // Get the immediate date from quotation to use as finish_date
    const immediateDate = quotationData[0].immediate;
    
    console.log("Got immediate date from quotation:", immediateDate);

    // Format dates for database
    const formattedStartDate = formatDateForSql(actualStartDate);
    const formattedFinishDate = formatDateForSql(immediateDate);

    if (!formattedStartDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format"
      });
    }

    // Check if a job already exists for this invoice/quotation
    const [existingJobs] = await pool.query(
      "SELECT * FROM jobs WHERE invoice_id = ? OR quotation_id = ?",
      [invoiceId, quotationId]
    );

    let jobId;
    
    if (existingJobs.length > 0) {
      // FIXED: Update existing job - actualStartDate goes to start_date, immediateDate goes to finish_date
      await pool.query(
        `UPDATE jobs 
         SET start_date = ?, 
             finish_date = ?,
             status = ? 
         WHERE id = ?`,
        [
          formattedStartDate, // Actual start date goes to start_date column
          formattedFinishDate, // Immediate date from quotation goes to finish_date column
          status, 
          existingJobs[0].id
        ]
      );
      jobId = existingJobs[0].id;
      
      console.log("Updated existing job:", {
        jobId,
        start_date: formattedStartDate,
        finish_date: formattedFinishDate,
        status
      });
    } else {
      // FIXED: Create new job - actualStartDate goes to start_date, immediateDate goes to finish_date
      const [result] = await pool.query(
        `INSERT INTO jobs 
         (quotation_id, invoice_id, job_name, job_category, start_date, finish_date, status, customer_id, quotation_amount, jobID) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quotationId,
          invoiceId,
          jobName,
          jobCategory,
          formattedStartDate, // Actual start date goes to start_date column
          formattedFinishDate, // Immediate date from quotation goes to finish_date column
          status,
          customerId,
          quotationAmount,
          jobID
        ]
      );
      
      jobId = result.insertId;
      
      console.log("Created new job:", {
        jobId,
        start_date: formattedStartDate,
        finish_date: formattedFinishDate,
        status
      });
    }

    return res.status(200).json({
      success: true,
      message: existingJobs.length > 0 ? "Job updated successfully" : "Job created successfully",
      jobId
    });
  } catch (err) {
    console.error("Error creating/updating job:", err);
    return res.status(500).json({
      success: false,
      message: "Error creating/updating job: " + err.message,
    });
  }
};


//2025.05.17 updated code
// New endpoint for customer to update quotation approval status
export const updateCustomerQuotationStatus = async (req, res) => {
  const { quotationId, customer_status } = req.body;

  if (!quotationId || !customer_status) {
    return res.status(400).json({
      success: false,
      message: "Quotation ID and customer status are required",
    });
  }

  try {
    await pool.query("UPDATE quotations SET customer_status = ? WHERE id = ?", [
      customer_status,
      quotationId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Customer status updated successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error updating customer status",
    });
  }
};

// Add to your quotation controller
export const updateQuotationAmount = async (req, res) => {
  const { quotationId, quotation_amount } = req.body;

  if (!quotationId || quotation_amount === undefined) {
    return res.status(400).json({
      success: false,
      message: "Quotation ID and amount are required",
    });
  }

  try {
    await pool.query(
      "UPDATE quotations SET quotation_amount = ? WHERE id = ?",
      [quotation_amount, quotationId]
    );

    return res.status(200).json({
      success: true,
      message: "Quotation amount updated successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error updating quotation amount",
    });
  }
};

// Create an invoice and add items to it
export const createInvoice = async (req, res) => {
  const { quotationId, invoiceAmount, materials } = req.body;

  try {
    // Verify customer has approved this quotation
    const [customerStatus] = await pool.query(
      "SELECT customer_status FROM quotations WHERE id = ?",
      [quotationId]
    );

    if (
      !customerStatus[0] ||
      customerStatus[0].customer_status !== "Approved"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot create invoice - waiting for customer approval",
      });
    }

    // Create the invoice with paid_amount and payment_status
    const [invoiceResult] = await pool.query(
      'INSERT INTO invoices (quotation_id, total_amount, paid_amount, payment_status) VALUES (?, ?, 0, "Pending")',
      [quotationId, invoiceAmount]
    );

    // Add materials to the invoice
    for (const material of materials) {
      await pool.query(
        "INSERT INTO invoice_items (invoice_id, material_name, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [
          invoiceResult.insertId,
          material.material_name,
          material.quantity,
          material.unit_price,
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error creating invoice" });
  }
};

// Get a single invoice by its ID (with items)
export const getInvoiceById = async (req, res) => {
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({
      success: false,
      message: "Invoice ID is required",
    });
  }

  try {
    // Fetch invoice details
    const [invoices] = await pool.query(
      `SELECT 
        i.id AS invoice_id,
        i.quotation_id,
        i.total_amount,
        i.paid_amount,
        i.payment_status,
        i.created_at,
        q.customer_id, 
        q.job_description
      FROM invoices i
      JOIN quotations q ON i.quotation_id = q.id
      WHERE i.id = ?`,
      [invoiceId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Fetch invoice items
    const [items] = await pool.query(
      `SELECT 
        material_name, 
        quantity, 
        unit_price 
      FROM invoice_items 
      WHERE invoice_id = ?`,
      [invoiceId]
    );

    return res.status(200).json({
      success: true,
      invoice: {
        ...invoices[0],
        items,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoice",
    });
  }
};

export const addPayment = async (req, res) => {
  const { invoiceId, paymentAmount } = req.body;

  try {
    // Get the current invoice data
    const [invoice] = await pool.query(
      "SELECT total_amount, paid_amount FROM invoices WHERE id = ?",
      [invoiceId]
    );

    if (invoice.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    const { total_amount, paid_amount } = invoice[0];
    const newPaidAmount = parseFloat(paid_amount) + parseFloat(paymentAmount);

    // Determine the new payment status
    let paymentStatus = "Partially Paid";
    if (newPaidAmount >= total_amount) {
      paymentStatus = "Completed";
    }

    // Update the invoice
    await pool.query(
      "UPDATE invoices SET paid_amount = ?, payment_status = ? WHERE id = ?",
      [newPaidAmount, paymentStatus, invoiceId]
    );

    return res.status(200).json({
      success: true,
      message: "Payment added successfully",
      newPaidAmount,
      paymentStatus,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error adding payment" });
  }
};

export const getInvoicesByUserId = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    // Fetch all invoices for the specific user with related quotation details
    const [invoices] = await pool.query(
      `SELECT 
        i.id AS invoice_id,
        i.quotation_id,
        i.total_amount,
        i.paid_amount,
        i.payment_status,
        i.created_at,
        q.customer_id, 
        q.job_description
      FROM invoices i
      JOIN quotations q ON i.quotation_id = q.id
      WHERE q.customer_id = ?  -- Change user_id to customer_id
      ORDER BY i.id DESC`,
      [userId] // Using the userId from the request body
    );

    // Fetch invoice items for each invoice
    const invoiceDetails = await Promise.all(
      invoices.map(async (invoice) => {
        const [items] = await pool.query(
          `SELECT 
            material_name, 
            quantity, 
            unit_price 
          FROM invoice_items 
          WHERE invoice_id = ?
          ORDER BY id DESC`,
          [invoice.invoice_id]
        );
        return {
          ...invoice,
          items,
        };
      })
    );

    return res.status(200).json({
      success: true,
      invoices: invoiceDetails,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoices",
    });
  }
};

export const getAllInvoicesAdmin = async (req, res) => {
  try {
    // Fetch invoice details along with customer_id
    const [invoices] = await pool.query(
      `SELECT 
        i.id AS invoice_id,
        i.quotation_id,
        i.total_amount,
        i.created_at,
        i.paid_amount,
        i.payment_status,
        q.customer_id,
        c.customer_name
      FROM invoices i
      JOIN quotations q ON i.quotation_id = q.id
      JOIN customers c ON q.customer_id = c.CustomerID
      ORDER BY i.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      invoices,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoices",
    });
  }
};

// Ensure you're expecting both 'userId' and 'invoiceId' in the request body
export const getInvoicesByUserId2 = async (req, res) => {
  const { userId, invoiceId } = req.body;

  if (!userId || !invoiceId) {
    return res.status(400).json({
      success: false,
      message: "User ID and Invoice ID are required",
    });
  }

  try {
    // Fetch invoice details based on both userId and invoiceId
    const [invoices] = await pool.query(
      `SELECT 
        i.id AS invoice_id,
        i.quotation_id,
        i.total_amount,
        i.paid_amount,
        i.payment_status,
        i.created_at,
        q.customer_id, 
        q.job_description
      FROM invoices i
      JOIN quotations q ON i.quotation_id = q.id
      WHERE q.customer_id = ? AND i.id = ?  -- Check both userId (customer_id) and invoiceId
      ORDER BY i.id DESC`,
      [userId, invoiceId] // Use both userId and invoiceId from the request body
    );

    // Fetch invoice items for each invoice
    const invoiceDetails = await Promise.all(
      invoices.map(async (invoice) => {
        const [items] = await pool.query(
          `SELECT 
            material_name, 
            quantity, 
            unit_price 
          FROM invoice_items 
          WHERE invoice_id = ?`,
          [invoice.invoice_id]
        );
        return {
          ...invoice,
          items,
        };
      })
    );

    return res.status(200).json({
      success: true,
      invoices: invoiceDetails,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoices",
    });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    // Fetch all invoices with related quotation and customer info
    const [invoices] = await pool.query(
      `SELECT 
        i.id AS invoice_id,
        i.quotation_id,
        i.total_amount,
        i.paid_amount,
        i.payment_status,
        i.created_at,
        q.customer_id, 
        q.job_description,
        c.customer_name
      FROM invoices i
      JOIN quotations q ON i.quotation_id = q.id
      JOIN customers c ON q.customer_id = c.CustomerID
      ORDER BY i.id DESC`
    );

    // Fetch invoice items for each invoice
    const invoiceDetails = await Promise.all(
      invoices.map(async (invoice) => {
        const [items] = await pool.query(
          `SELECT 
            material_name, 
            quantity, 
            unit_price 
          FROM invoice_items 
          WHERE invoice_id = ?`,
          [invoice.invoice_id]
        );
        return {
          ...invoice,
          items,
        };
      })
    );

    return res.status(200).json({
      success: true,
      invoices: invoiceDetails,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching all invoices",
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    // Modified to sort by ID in descending order
    const [jobs] = await pool.query("SELECT * FROM jobs ORDER BY id DESC");
    
    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching jobs" });
  }
};

export const updateJob = async (req, res) => {
  const { jobId, startDate, finishDate, status } = req.body;

  // Convert to 'YYYY-MM-DD' format if not already
  const formatDate = (date) => {
    if (!date) return null;
    // If already in 'YYYY-MM-DD', return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // Otherwise, try to convert
    try {
      return new Date(date).toISOString().slice(0, 10);
    } catch {
      return date;
    }
  };

  try {
    await pool.query(
      "UPDATE jobs SET start_date = ?, finish_date = ?, status = ? WHERE id = ?",
      [formatDate(startDate), formatDate(finishDate), status, jobId]
    );

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating job" });
  }
};

export const getJobsByCustomerId = async (req, res) => {
  const { userId } = req.body;

  try {
    // Fetch jobs for the specified customer_id
    const [jobs] = await pool.query(
      "SELECT * FROM jobs WHERE customer_id = ?",
      [userId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No jobs found for this customer",
      });
    }

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching jobs",
    });
  }
};

export default {
  createQuotation,
  getQuotationMaterials,
  getQuotations,
  getAllQuotationsForAdmin,
  updateQuotationStatus,
  getSavedMaterials,
  saveQuotationMaterial,
  getPartiallyPaidJobs,
  getPartiallyPaidInvoices,
  getQuotationById,
  createOrUpdateJob,     // Fixed function
  updateCustomerQuotationStatus,
  updateQuotationAmount,
  createInvoice,
  getInvoiceById,
  addPayment,
  getInvoicesByUserId,
  getAllInvoicesAdmin,
  getInvoicesByUserId2,
  getAllInvoices,
  getAllJobs,
  updateJob,
  getJobsByCustomerId
};
