import pool from "../config/db.js";

// IMPROVED: Enhanced date handling with better error logging
const formatDateForSql = (dateString) => {
  try {
    if (!dateString) return null;

    // If already in YYYY-MM-DD format, use directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Create a date object and ensure UTC interpretation
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date for SQL:", dateString);
      return null;
    }

    // Always use UTC methods to guarantee timezone consistency
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    // Format as YYYY-MM-DD using UTC components
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error formatting date for SQL:", e);
    return null;
  }
};

// IMPROVED: Enhanced date response formatting with better debugging
const formatDateForResponse = (dateObj) => {
  if (!dateObj) return null;

  try {
    // If it's already a string in YYYY-MM-DD format, return it directly
    if (typeof dateObj === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateObj)) {
      return dateObj;
    }

    // Create a date object (this will use local timezone)
    const date = new Date(dateObj);

    // Check if it's valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date object:", dateObj);
      return null;
    }

    // IMPORTANT: Special case for midnight UTC which causes timezone issues
    if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
      // For midnight UTC dates, use UTC methods to get the correct day
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // For other times, use local date components which should work fine
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return null;
  }
};

// IMPROVED: Consistent ID normalization with better error handling
const normalizeId = (id) => {
  if (id === null || id === undefined) return null;
  if (typeof id === "number") return id;

  try {
    const parsedId = parseInt(id, 10);
    return isNaN(parsedId) ? null : parsedId;
  } catch (e) {
    console.error("Error parsing ID:", id, e);
    return null;
  }
};

// FIXED AND IMPROVED: Assign resources (employees and machines) to a job with enhanced conflict detection
export const assignResources = async (req, res) => {
  const { jobId, employeeIds = [], machineIds = [] } = req.body;

  // IMPROVED: Normalize IDs immediately with better error handling
  const normalizedJobId = normalizeId(jobId);
  const normalizedEmployeeIds = employeeIds
    .map((id) => normalizeId(id))
    .filter((id) => id !== null);
  const normalizedMachineIds = machineIds
    .map((id) => normalizeId(id))
    .filter((id) => id !== null);

  console.log("Received resource assignment request:", {
    jobId: normalizedJobId,
    employeeIds: normalizedEmployeeIds,
    machineIds: normalizedMachineIds,
  });

  if (
    !normalizedJobId ||
    (!normalizedEmployeeIds.length && !normalizedMachineIds.length)
  ) {
    return res.status(400).json({
      success: false,
      message: "Job ID and at least one resource to assign are required",
    });
  }

  try {
    // Begin transaction early to ensure data consistency throughout validation
    await pool.query("START TRANSACTION");

    // IMPROVED: Use DATE_FORMAT to get consistent date strings from MySQL
    const [jobResult] = await pool.query(
      `SELECT id, job_name, 
       DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
       DATE_FORMAT(finish_date, '%Y-%m-%d') AS finish_date, 
       status FROM jobs WHERE id = ?`,
      [normalizedJobId]
    );

    console.log("Job lookup result:", jobResult);

    if (jobResult.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const job = jobResult[0];

    // Debug job date fields
    console.log("Job date fields:");
    console.log(`  start_date: ${job.start_date} (${typeof job.start_date})`);
    console.log(
      `  finish_date: ${job.finish_date} (${typeof job.finish_date})`
    );

    // If job is already completed, prevent resource assignment
    if (job.status === "Completed") {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Cannot assign resources to a completed job",
      });
    }

    // IMPROVED: Clearer date handling logic - ensure we have a date
    if (!job.start_date) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Job has no scheduled date for resource assignment",
      });
    }

    // We can now use job.start_date directly since it's a formatted string
    const jobDateFormatted = job.start_date;

    console.log("Job date for conflict detection:", jobDateFormatted);

    // IMPROVED & FIXED: Check ALL employees for existing assignments on the same date
    if (normalizedEmployeeIds.length > 0) {
      // First, check if any of the employees are inactive
      const [inactiveEmployees] = await pool.query(
        `SELECT id, name FROM employees 
         WHERE id IN (${normalizedEmployeeIds.map(() => "?").join(",")}) 
         AND (active IS NULL OR active = 0 OR active = 'false' OR active = 'no' OR active = 'inactive')`,
        normalizedEmployeeIds
      );

      if (inactiveEmployees.length > 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Cannot assign inactive employees: ${inactiveEmployees
            .map((e) => e.name)
            .join(", ")}`,
          inactiveEmployees,
        });
      }

      // FIXED: Improved query to catch any conflicting assignments, regardless of the requested employee IDs
      const [busyEmployees] = await pool.query(
        `
        SELECT DISTINCT e.id, e.name, j.job_name, j.id as conflicting_job_id,
               DATE_FORMAT(j.start_date, '%Y-%m-%d') as job_date
        FROM job_employees je
        JOIN jobs j ON je.job_id = j.id
        JOIN employees e ON je.employee_id = e.id
        WHERE 
            je.employee_id IN (${normalizedEmployeeIds
              .map(() => "?")
              .join(",")})
            AND j.id != ?
            AND DATE_FORMAT(j.start_date, '%Y-%m-%d') = ?
        `,
        [...normalizedEmployeeIds, normalizedJobId, jobDateFormatted]
      );

      console.log("Employee conflict check result:", busyEmployees);

      if (busyEmployees.length > 0) {
        await pool.query("ROLLBACK");

        // Provide detailed conflict information
        const conflictDetails = busyEmployees
          .map((e) => {
            return `${e.name} (assigned to job "${e.job_name}" #${e.conflicting_job_id} on ${e.job_date})`;
          })
          .join(", ");

        return res.status(400).json({
          success: false,
          message: `Some employees are already assigned to other jobs on this date: ${conflictDetails}`,
          conflictingEmployees: busyEmployees,
        });
      }
    }

    // Check if any machines are unavailable or busy during the date range
    if (normalizedMachineIds.length > 0) {
      // Machine status check - ensure they are all active
      const [unavailableMachines] = await pool.query(
        `
        SELECT id, machine_name AS machineName, status 
        FROM machines 
        WHERE id IN (${normalizedMachineIds.map(() => "?").join(",")})
        AND status != 'Active'
        `,
        normalizedMachineIds
      );

      if (unavailableMachines.length > 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Cannot assign unavailable machines: ${unavailableMachines
            .map((m) => `${m.machineName} (${m.status})`)
            .join(", ")}`,
          unavailableMachines,
        });
      }

      // FIXED: Check if machines are already assigned to other jobs on the same date
      const [busyMachines] = await pool.query(
        `
        SELECT DISTINCT m.id, m.machine_name AS machineName, j.job_name, j.id as conflicting_job_id,
               DATE_FORMAT(j.start_date, '%Y-%m-%d') as job_date
        FROM job_machines jm
        JOIN jobs j ON jm.job_id = j.id
        JOIN machines m ON jm.machine_id = m.id
        WHERE 
            jm.machine_id IN (${normalizedMachineIds.map(() => "?").join(",")})
            AND j.id != ?
            AND DATE_FORMAT(j.start_date, '%Y-%m-%d') = ?
        `,
        [...normalizedMachineIds, normalizedJobId, jobDateFormatted]
      );

      if (busyMachines.length > 0) {
        await pool.query("ROLLBACK");

        const conflictDetails = busyMachines
          .map((m) => {
            return `${m.machineName} (assigned to job "${m.job_name}" #${m.conflicting_job_id} on ${m.job_date})`;
          })
          .join(", ");

        return res.status(400).json({
          success: false,
          message: `Some machines are already assigned to other jobs on this date: ${conflictDetails}`,
          conflictingMachines: busyMachines,
        });
      }
    }

    // Clear any existing assignments for this job to avoid duplicates
    await pool.query("DELETE FROM job_employees WHERE job_id = ?", [
      normalizedJobId,
    ]);
    await pool.query("DELETE FROM job_machines WHERE job_id = ?", [
      normalizedJobId,
    ]);

    // Assign employees if any
    if (normalizedEmployeeIds.length > 0) {
      const empValues = normalizedEmployeeIds.flatMap((empId) => [
        normalizedJobId,
        empId,
      ]);
      const empPlaceholders = normalizedEmployeeIds
        .map(() => "(?, ?)")
        .join(", ");
      const empSql = `INSERT INTO job_employees (job_id, employee_id) VALUES ${empPlaceholders}`;

      await pool.query(empSql, empValues);

      console.log(
        `Assigned ${normalizedEmployeeIds.length} employees to job ${normalizedJobId}`
      );
    }

    // Assign machines if any
    if (normalizedMachineIds.length > 0) {
      const machineValues = normalizedMachineIds.flatMap((machineId) => [
        normalizedJobId,
        machineId,
      ]);
      const machinePlaceholders = normalizedMachineIds
        .map(() => "(?, ?)")
        .join(", ");
      const machineSql = `INSERT INTO job_machines (job_id, machine_id) VALUES ${machinePlaceholders}`;

      await pool.query(machineSql, machineValues);

      console.log(
        `Assigned ${normalizedMachineIds.length} machines to job ${normalizedJobId}`
      );
    }

    // Update the job status to "In Progress" if it's not already completed
    await pool.query(
      `
      UPDATE jobs SET status = 'In Progress' 
      WHERE id = ? AND status != 'Completed'
      `,
      [normalizedJobId]
    );

    await pool.query("COMMIT");

    res.json({
      success: true,
      message: "Resources assigned successfully",
      assignedEmployees: normalizedEmployeeIds.length,
      assignedMachines: normalizedMachineIds.length,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Error assigning resources:", err);
    res.status(500).json({
      success: false,
      message: `Error assigning resources: ${err.message || "Unknown error"}`,
    });
  }
};

// IMPROVED: Get jobs by date range with better date handling and debugging
export const getJobsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    console.log("Getting jobs for date range:", { startDate, endDate });

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Both start date and end date are required",
      });
    }

    // Format dates for SQL comparison with timezone consistency
    const formattedStartDate = formatDateForSql(startDate);
    const formattedEndDate = formatDateForSql(endDate);

    if (!formattedStartDate || !formattedEndDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    console.log("Formatted date range for query:", {
      formattedStartDate,
      formattedEndDate,
    });

    // IMPROVED: Use DATE_FORMAT consistently to avoid timezone issues
    const query = `
      SELECT 
        id, job_name, 
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
        DATE_FORMAT(finish_date, '%Y-%m-%d') AS finish_date, 
        status, quotation_id, invoice_id, job_category, customer_id, jobID
      FROM jobs 
      WHERE (
        DATE(start_date) BETWEEN ? AND ? OR
        DATE(finish_date) BETWEEN ? AND ? OR 
        (DATE(start_date) <= ? AND DATE(finish_date) >= ?)
      )
      ORDER BY start_date DESC
    `;

    console.log("Jobs date range query:", query);

    const [jobs] = await pool.query(query, [
      formattedStartDate,
      formattedEndDate,
      formattedStartDate,
      formattedEndDate,
      formattedStartDate,
      formattedEndDate,
    ]);

    console.log(
      `Found ${jobs.length} jobs for date range ${formattedStartDate} to ${formattedEndDate}`
    );

    // No need to process dates further since they're already formatted strings
    return res.json({
      success: true,
      jobs: jobs,
    });
  } catch (err) {
    console.error("Error fetching jobs by date range:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// FIXED & IMPROVED: Get jobs for a specific date with enhanced date handling
export const getJobsByDate = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    // Format date for SQL comparison with timezone consistency
    const formattedDate = formatDateForSql(date);

    if (!formattedDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    console.log("Formatted date for jobs query:", formattedDate);

    // IMPROVED: Use DATE_FORMAT consistently for reliable date handling
    const query = `
      SELECT 
        id, job_name, 
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
        DATE_FORMAT(finish_date, '%Y-%m-%d') AS finish_date, 
        status, quotation_id, invoice_id, job_category, customer_id, jobID
      FROM jobs 
      WHERE DATE(start_date) = ?
      ORDER BY job_name
    `;

    console.log("Jobs by date query:", query);

    const [jobs] = await pool.query(query, [formattedDate]);

    console.log(`Found ${jobs.length} jobs for date ${formattedDate}`);

    // Log the first job to debug date handling
    if (jobs.length > 0) {
      console.log("First job date fields:");
      console.log(
        `  start_date: ${jobs[0].start_date} (${typeof jobs[0].start_date})`
      );
      console.log(
        `  finish_date: ${jobs[0].finish_date} (${typeof jobs[0].finish_date})`
      );
    }

    // Return formatted date strings directly
    return res.json({
      success: true,
      jobs: jobs,
    });
  } catch (err) {
    console.error("Error fetching jobs by date:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// IMPROVED: Get all assigned resources for a job with enhanced error handling
export const getAssignedResources = async (req, res) => {
  const { jobId } = req.params;
  const normalizedJobId = normalizeId(jobId);

  console.log("Getting assigned resources for job ID:", normalizedJobId);

  if (!normalizedJobId) {
    return res.status(400).json({
      success: false,
      message: "Valid job ID is required",
    });
  }

  try {
    // Get assigned employees with proper date formatting
    const employeeQuery = `
      SELECT e.id, e.name, e.position, e.active,
             COUNT(DISTINCT je.job_id) as assignments_count, 
             DATE_FORMAT(MAX(je.assigned_at), '%Y-%m-%d %H:%i:%s') as last_assigned_at
      FROM job_employees je
      JOIN employees e ON e.id = je.employee_id
      WHERE je.job_id = ?
      GROUP BY e.id
      ORDER BY e.name ASC`;

    console.log("Employee query:", employeeQuery);

    const [employees] = await pool.query(employeeQuery, [normalizedJobId]);

    console.log(
      `Found ${employees.length} employees for job ${normalizedJobId}`
    );

    // Get assigned machines with proper date formatting
    const machineQuery = `
      SELECT m.id, m.machine_name as machineName,
             m.status, COUNT(DISTINCT jm.job_id) as assignments_count,
             DATE_FORMAT(MAX(jm.assigned_at), '%Y-%m-%d %H:%i:%s') as last_assigned_at
      FROM job_machines jm
      JOIN machines m ON m.id = jm.machine_id
      WHERE jm.job_id = ?
      GROUP BY m.id
      ORDER BY m.machine_name ASC`;

    console.log("Machine query:", machineQuery);

    const [machines] = await pool.query(machineQuery, [normalizedJobId]);

    console.log(`Found ${machines.length} machines for job ${normalizedJobId}`);

    // Format and normalize data for the response
    const processedEmployees = employees.map((emp) => ({
      ...emp,
      // Normalize ID for consistency
      id: normalizeId(emp.id),
      // Standardize active field as boolean
      active:
        emp.active === 1 ||
        emp.active === true ||
        emp.active === "true" ||
        emp.active === "yes" ||
        emp.active === "active",
      // Keep last_assigned_at as is - it's already properly formatted
    }));

    const processedMachines = machines.map((machine) => ({
      ...machine,
      // Normalize ID for consistency
      id: normalizeId(machine.id),
      // Keep last_assigned_at as is - it's already properly formatted
    }));

    res.json({
      success: true,
      employees: processedEmployees || [],
      machines: processedMachines || [],
    });
  } catch (err) {
    console.error("Error fetching assigned resources:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// IMPROVED: Check employee availability with enhanced date handling and conflict detection
export const checkEmployeeAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Both start date and end date are required",
      });
    }

    // Format dates for SQL comparison with timezone consistency
    const formattedStartDate = formatDateForSql(startDate);
    const formattedEndDate = formatDateForSql(endDate);

    if (!formattedStartDate || !formattedEndDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // IMPROVED: Use DATE_FORMAT consistently for better date handling
    const query = `
      SELECT 
        e.id, 
        e.name, 
        e.position, 
        e.active,
        (
          SELECT 
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'job_id', j.id,
                'job_name', j.job_name,
                'start_date', DATE_FORMAT(j.start_date, '%Y-%m-%d'),
                'finish_date', DATE_FORMAT(j.finish_date, '%Y-%m-%d')
              )
            )
          FROM job_employees je
          JOIN jobs j ON je.job_id = j.id
          WHERE 
            je.employee_id = e.id
            AND (
              (DATE(j.start_date) BETWEEN ? AND ?) OR
              (DATE(j.finish_date) BETWEEN ? AND ?) OR
              (DATE(j.start_date) <= ? AND DATE(j.finish_date) >= ?)
            )
        ) as conflicting_jobs
      FROM employees e
      ORDER BY e.name
    `;

    const [employees] = await pool.query(query, [
      formattedStartDate,
      formattedEndDate,
      formattedStartDate,
      formattedEndDate,
      formattedStartDate,
      formattedEndDate,
    ]);

    // Process employees to determine availability with standardized active handling
    const processedEmployees = employees.map((emp) => {
      // Parse JSON string to array if not null
      const conflictingJobs = emp.conflicting_jobs
        ? JSON.parse(emp.conflicting_jobs)
        : [];

      // Standardize employee active status
      const isActive =
        emp.active === 1 ||
        emp.active === true ||
        emp.active === "true" ||
        emp.active === "yes" ||
        emp.active === "active";

      return {
        id: normalizeId(emp.id),
        name: emp.name,
        position: emp.position,
        active: isActive,
        isAvailable: isActive && conflictingJobs.length === 0,
        conflictingJobs: conflictingJobs,
      };
    });

    return res.json({
      success: true,
      employees: processedEmployees,
      availableCount: processedEmployees.filter((emp) => emp.isAvailable)
        .length,
      unavailableCount: processedEmployees.filter((emp) => !emp.isAvailable)
        .length,
    });
  } catch (err) {
    console.error("Error checking employee availability:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// IMPROVED: Check machine availability with enhanced date handling
export const checkMachineAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Both start date and end date are required",
      });
    }

    // Format dates for SQL comparison with timezone consistency
    const formattedStartDate = formatDateForSql(startDate);
    const formattedEndDate = formatDateForSql(endDate);

    if (!formattedStartDate || !formattedEndDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // IMPROVED: Use DATE_FORMAT consistently for better date handling
    const query = `
      SELECT 
        m.id, 
        m.machine_name as machineName, 
        m.status,
        (
          SELECT 
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'job_id', j.id,
                'job_name', j.job_name,
                'start_date', DATE_FORMAT(j.start_date, '%Y-%m-%d'),
                'finish_date', DATE_FORMAT(j.finish_date, '%Y-%m-%d')
              )
            )
          FROM job_machines jm
          JOIN jobs j ON jm.job_id = j.id
          WHERE 
            jm.machine_id = m.id
            AND (
              (DATE(j.start_date) BETWEEN ? AND ?) OR
              (DATE(j.finish_date) BETWEEN ? AND ?) OR
              (DATE(j.start_date) <= ? AND DATE(j.finish_date) >= ?)
            )
        ) as conflicting_jobs
      FROM machines m
      ORDER BY m.machine_name
    `;

    const [machines] = await pool.query(query, [
      formattedStartDate,
      formattedEndDate,
      formattedStartDate,
      formattedEndDate,
      formattedStartDate,
      formattedEndDate,
    ]);

    // Process machines to determine availability
    const processedMachines = machines.map((machine) => {
      // Parse JSON string to array if not null
      const conflictingJobs = machine.conflicting_jobs
        ? JSON.parse(machine.conflicting_jobs)
        : [];

      return {
        id: normalizeId(machine.id),
        machineName: machine.machineName,
        status: machine.status,
        isAvailable:
          machine.status === "Active" && conflictingJobs.length === 0,
        conflictingJobs: conflictingJobs,
      };
    });

    return res.json({
      success: true,
      machines: processedMachines,
      availableCount: processedMachines.filter((machine) => machine.isAvailable)
        .length,
      unavailableCount: processedMachines.filter(
        (machine) => !machine.isAvailable
      ).length,
    });
  } catch (err) {
    console.error("Error checking machine availability:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// IMPROVED: Get all jobs with enhanced date handling and debugging
export const getAllJobs = async (req, res) => {
  try {
    // FIXED: Use DATE_FORMAT consistently for reliable date handling
    const query = `
      SELECT 
        id, job_name, 
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
        DATE_FORMAT(finish_date, '%Y-%m-%d') AS finish_date, 
        status, quotation_id, invoice_id, job_category, customer_id, jobID
      FROM jobs
      ORDER BY start_date DESC
    `;

    const [jobs] = await pool.query(query);

    console.log(`Found ${jobs.length} jobs total`);

    // Debug log for the first few jobs to verify date formatting
    if (jobs.length > 0) {
      console.log("First job date fields:");
      for (let i = 0; i < Math.min(jobs.length, 3); i++) {
        console.log(`Job #${i + 1} (ID: ${jobs[i].id}):`);
        console.log(
          `  start_date: ${jobs[i].start_date} (${typeof jobs[i].start_date})`
        );
        console.log(
          `  finish_date: ${jobs[i].finish_date} (${typeof jobs[i]
            .finish_date})`
        );
      }
    }

    // Return jobs with properly formatted dates
    return res.json({
      success: true,
      jobs: jobs,
    });
  } catch (err) {
    console.error("Error fetching all jobs:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ADDED: Update resource assignments for a job
export const updateJobResources = async (req, res) => {
  const { jobId, employeeIdsToAdd = [], machineIdsToAdd = [] } = req.body;

  // Normalize IDs for consistent handling
  const normalizedJobId = normalizeId(jobId);
  const normalizedEmployeeIds = employeeIdsToAdd
    .map((id) => normalizeId(id))
    .filter((id) => id !== null);
  const normalizedMachineIds = machineIdsToAdd
    .map((id) => normalizeId(id))
    .filter((id) => id !== null);

  console.log("Received resource update request:", {
    jobId: normalizedJobId,
    employeeIdsToAdd: normalizedEmployeeIds,
    machineIdsToAdd: normalizedMachineIds,
  });

  if (
    !normalizedJobId ||
    (!normalizedEmployeeIds.length && !normalizedMachineIds.length)
  ) {
    return res.status(400).json({
      success: false,
      message: "Job ID and at least one resource to add are required",
    });
  }

  try {
    // Begin transaction to ensure data consistency
    await pool.query("START TRANSACTION");

    // Get the job details with proper date formatting
    const [jobResult] = await pool.query(
      `SELECT id, job_name, 
       DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
       DATE_FORMAT(finish_date, '%Y-%m-%d') AS finish_date, 
       status FROM jobs WHERE id = ?`,
      [normalizedJobId]
    );

    console.log("Job lookup result:", jobResult);

    if (jobResult.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const job = jobResult[0];

    // If job is already completed, prevent resource updates
    if (job.status === "Completed") {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Cannot update resources for a completed job",
      });
    }

    // Ensure we have a job date
    if (!job.start_date) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Job has no scheduled date for resource assignment",
      });
    }

    const jobDateFormatted = job.start_date;
    console.log("Job date for conflict detection:", jobDateFormatted);

    // Get currently assigned resources to avoid duplicates
    const [currentEmployees] = await pool.query(
      "SELECT employee_id FROM job_employees WHERE job_id = ?",
      [normalizedJobId]
    );

    const [currentMachines] = await pool.query(
      "SELECT machine_id FROM job_machines WHERE job_id = ?",
      [normalizedJobId]
    );

    // Filter out already assigned employees/machines
    const currentEmployeeIds = currentEmployees.map((e) =>
      normalizeId(e.employee_id)
    );
    const currentMachineIds = currentMachines.map((m) =>
      normalizeId(m.machine_id)
    );

    const uniqueEmployeesToAdd = normalizedEmployeeIds.filter(
      (id) => !currentEmployeeIds.includes(id)
    );

    const uniqueMachinesToAdd = normalizedMachineIds.filter(
      (id) => !currentMachineIds.includes(id)
    );

    console.log("Unique resources to add:", {
      employees: uniqueEmployeesToAdd,
      machines: uniqueMachinesToAdd,
    });

    // Check validity of new employee assignments
    if (uniqueEmployeesToAdd.length > 0) {
      // Check if any employees are inactive
      const [inactiveEmployees] = await pool.query(
        `SELECT id, name FROM employees 
         WHERE id IN (${uniqueEmployeesToAdd.map(() => "?").join(",")}) 
         AND (active IS NULL OR active = 0 OR active = 'false' OR active = 'no' OR active = 'inactive')`,
        uniqueEmployeesToAdd
      );

      if (inactiveEmployees.length > 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Cannot assign inactive employees: ${inactiveEmployees
            .map((e) => e.name)
            .join(", ")}`,
          inactiveEmployees,
        });
      }

      // Check for scheduling conflicts
      const [busyEmployees] = await pool.query(
        `
        SELECT DISTINCT e.id, e.name, j.job_name, j.id as conflicting_job_id,
               DATE_FORMAT(j.start_date, '%Y-%m-%d') as job_date
        FROM job_employees je
        JOIN jobs j ON je.job_id = j.id
        JOIN employees e ON je.employee_id = e.id
        WHERE 
            je.employee_id IN (${uniqueEmployeesToAdd.map(() => "?").join(",")})
            AND j.id != ?
            AND DATE_FORMAT(j.start_date, '%Y-%m-%d') = ?
        `,
        [...uniqueEmployeesToAdd, normalizedJobId, jobDateFormatted]
      );

      console.log("Employee conflict check result:", busyEmployees);

      if (busyEmployees.length > 0) {
        await pool.query("ROLLBACK");

        // Provide detailed conflict information
        const conflictDetails = busyEmployees
          .map((e) => {
            return `${e.name} (assigned to job "${e.job_name}" #${e.conflicting_job_id} on ${e.job_date})`;
          })
          .join(", ");

        return res.status(400).json({
          success: false,
          message: `Some employees are already assigned to other jobs on this date: ${conflictDetails}`,
          conflictingEmployees: busyEmployees,
        });
      }
    }

    // Check validity of new machine assignments
    if (uniqueMachinesToAdd.length > 0) {
      // Check if machines are active
      const [unavailableMachines] = await pool.query(
        `
        SELECT id, machine_name AS machineName, status 
        FROM machines 
        WHERE id IN (${uniqueMachinesToAdd.map(() => "?").join(",")})
        AND status != 'Active'
        `,
        uniqueMachinesToAdd
      );

      if (unavailableMachines.length > 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Cannot assign unavailable machines: ${unavailableMachines
            .map((m) => `${m.machineName} (${m.status})`)
            .join(", ")}`,
          unavailableMachines,
        });
      }

      // Check for machine scheduling conflicts
      const [busyMachines] = await pool.query(
        `
        SELECT DISTINCT m.id, m.machine_name AS machineName, j.job_name, j.id as conflicting_job_id,
               DATE_FORMAT(j.start_date, '%Y-%m-%d') as job_date
        FROM job_machines jm
        JOIN jobs j ON jm.job_id = j.id
        JOIN machines m ON jm.machine_id = m.id
        WHERE 
            jm.machine_id IN (${uniqueMachinesToAdd.map(() => "?").join(",")})
            AND j.id != ?
            AND DATE_FORMAT(j.start_date, '%Y-%m-%d') = ?
        `,
        [...uniqueMachinesToAdd, normalizedJobId, jobDateFormatted]
      );

      if (busyMachines.length > 0) {
        await pool.query("ROLLBACK");

        const conflictDetails = busyMachines
          .map((m) => {
            return `${m.machineName} (assigned to job "${m.job_name}" #${m.conflicting_job_id} on ${m.job_date})`;
          })
          .join(", ");

        return res.status(400).json({
          success: false,
          message: `Some machines are already assigned to other jobs on this date: ${conflictDetails}`,
          conflictingMachines: busyMachines,
        });
      }
    }

    // Assign additional employees if any valid ones to add
    let newEmployeesAdded = 0;
    if (uniqueEmployeesToAdd.length > 0) {
      const empValues = uniqueEmployeesToAdd.flatMap((empId) => [
        normalizedJobId,
        empId,
      ]);
      const empPlaceholders = uniqueEmployeesToAdd
        .map(() => "(?, ?)")
        .join(", ");
      const empSql = `INSERT INTO job_employees (job_id, employee_id) VALUES ${empPlaceholders}`;

      const [empResult] = await pool.query(empSql, empValues);
      newEmployeesAdded = empResult.affectedRows;

      console.log(
        `Added ${newEmployeesAdded} employees to job ${normalizedJobId}`
      );
    }

    // Assign additional machines if any valid ones to add
    let newMachinesAdded = 0;
    if (uniqueMachinesToAdd.length > 0) {
      const machineValues = uniqueMachinesToAdd.flatMap((machineId) => [
        normalizedJobId,
        machineId,
      ]);
      const machinePlaceholders = uniqueMachinesToAdd
        .map(() => "(?, ?)")
        .join(", ");
      const machineSql = `INSERT INTO job_machines (job_id, machine_id) VALUES ${machinePlaceholders}`;

      const [machineResult] = await pool.query(machineSql, machineValues);
      newMachinesAdded = machineResult.affectedRows;

      console.log(
        `Added ${newMachinesAdded} machines to job ${normalizedJobId}`
      );
    }

    // Update the job status to "In Progress" if it's not already completed
    if (newEmployeesAdded > 0 || newMachinesAdded > 0) {
      await pool.query(
        `UPDATE jobs SET status = 'In Progress' WHERE id = ? AND status != 'Completed'`,
        [normalizedJobId]
      );
    }

    await pool.query("COMMIT");

    res.json({
      success: true,
      message: "Resources updated successfully",
      addedEmployees: newEmployeesAdded,
      addedMachines: newMachinesAdded,
      totalEmployees: currentEmployeeIds.length + newEmployeesAdded,
      totalMachines: currentMachineIds.length + newMachinesAdded,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Error updating job resources:", err);
    res.status(500).json({
      success: false,
      message: `Error updating job resources: ${
        err.message || "Unknown error"
      }`,
    });
  }
};

// ADDED: Remove specific resources from a job
export const removeJobResources = async (req, res) => {
  const { jobId, employeeIds = [], machineIds = [] } = req.body;

  // Normalize IDs for consistent handling
  const normalizedJobId = normalizeId(jobId);
  const normalizedEmployeeIds = employeeIds
    .map((id) => normalizeId(id))
    .filter((id) => id !== null);
  const normalizedMachineIds = machineIds
    .map((id) => normalizeId(id))
    .filter((id) => id !== null);

  console.log("Received resource removal request:", {
    jobId: normalizedJobId,
    employeeIds: normalizedEmployeeIds,
    machineIds: normalizedMachineIds,
  });

  if (
    !normalizedJobId ||
    (!normalizedEmployeeIds.length && !normalizedMachineIds.length)
  ) {
    return res.status(400).json({
      success: false,
      message: "Job ID and at least one resource to remove are required",
    });
  }

  try {
    // Begin transaction to ensure data consistency
    await pool.query("START TRANSACTION");

    // Get the job details
    const [jobResult] = await pool.query(
      "SELECT id, job_name, status FROM jobs WHERE id = ?",
      [normalizedJobId]
    );

    if (jobResult.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const job = jobResult[0];

    // Allow removing resources even from completed jobs for data correction

    // Get currently assigned resources to verify existence
    const [currentEmployees] = await pool.query(
      "SELECT employee_id FROM job_employees WHERE job_id = ?",
      [normalizedJobId]
    );

    const [currentMachines] = await pool.query(
      "SELECT machine_id FROM job_machines WHERE job_id = ?",
      [normalizedJobId]
    );

    const currentEmployeeIds = currentEmployees.map((e) =>
      normalizeId(e.employee_id)
    );
    const currentMachineIds = currentMachines.map((m) =>
      normalizeId(m.machine_id)
    );

    // Filter to only include resources that are actually assigned
    const employeesToRemove = normalizedEmployeeIds.filter((id) =>
      currentEmployeeIds.includes(id)
    );

    const machinesToRemove = normalizedMachineIds.filter((id) =>
      currentMachineIds.includes(id)
    );

    console.log("Resources to remove:", {
      employees: employeesToRemove,
      machines: machinesToRemove,
    });

    // Remove employees if any
    let employeesRemoved = 0;
    if (employeesToRemove.length > 0) {
      const employeeCondition = employeesToRemove.map(() => "?").join(",");
      const empSql = `DELETE FROM job_employees 
                      WHERE job_id = ? AND employee_id IN (${employeeCondition})`;

      const [empResult] = await pool.query(empSql, [
        normalizedJobId,
        ...employeesToRemove,
      ]);
      employeesRemoved = empResult.affectedRows;
      console.log(
        `Removed ${employeesRemoved} employees from job ${normalizedJobId}`
      );
    }

    // Remove machines if any
    let machinesRemoved = 0;
    if (machinesToRemove.length > 0) {
      const machineCondition = machinesToRemove.map(() => "?").join(",");
      const machineSql = `DELETE FROM job_machines 
                          WHERE job_id = ? AND machine_id IN (${machineCondition})`;

      const [machineResult] = await pool.query(machineSql, [
        normalizedJobId,
        ...machinesToRemove,
      ]);
      machinesRemoved = machineResult.affectedRows;
      console.log(
        `Removed ${machinesRemoved} machines from job ${normalizedJobId}`
      );
    }

    // Get remaining resource counts
    const [remainingEmployees] = await pool.query(
      "SELECT COUNT(*) AS count FROM job_employees WHERE job_id = ?",
      [normalizedJobId]
    );

    const [remainingMachines] = await pool.query(
      "SELECT COUNT(*) AS count FROM job_machines WHERE job_id = ?",
      [normalizedJobId]
    );

    const employeeCount = remainingEmployees[0].count;
    const machineCount = remainingMachines[0].count;

    // Update job status to "Not Started" if no resources left and job is not completed
    if (
      employeeCount === 0 &&
      machineCount === 0 &&
      job.status !== "Completed"
    ) {
      await pool.query("UPDATE jobs SET status = 'Not Started' WHERE id = ?", [
        normalizedJobId,
      ]);
      console.log(
        `Updated job ${normalizedJobId} status to 'Not Started' as all resources were removed`
      );
    }

    await pool.query("COMMIT");

    res.json({
      success: true,
      message: "Resources removed successfully",
      removedEmployees: employeesRemoved,
      removedMachines: machinesRemoved,
      remainingEmployees: employeeCount,
      remainingMachines: machineCount,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Error removing job resources:", err);
    res.status(500).json({
      success: false,
      message: `Error removing job resources: ${
        err.message || "Unknown error"
      }`,
    });
  }
};

export default {
  assignResources,
  getJobsByDateRange,
  getJobsByDate,
  getAssignedResources,
  checkEmployeeAvailability,
  checkMachineAvailability,
  getAllJobs,
  updateJobResources,  // Added
  removeJobResources,
};
