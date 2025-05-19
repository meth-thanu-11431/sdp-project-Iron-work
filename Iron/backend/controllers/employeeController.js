import pool from '../config/db.js';

// Add Employee (Updated to include email, phone, address)
export const addEmployee = async (req, res) => {
  try {
    const { name, position, salary, active = 1, email, phone, address } = req.body; // Added optional fields
    
    // Ensure active is a number (0 or 1) for database consistency
    const activeValue = active ? 1 : 0;

    if (!name || !position || !salary) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    // Insert employee into the database - include all fields
    const [employeeResult] = await pool.query(
      'INSERT INTO employees (name, position, salary, active, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, position, salary, activeValue, email || null, phone || null, address || null]
    );
    const employeeId = employeeResult.insertId;

    // Insert or update the image (replace existing image if already exists)
    if (req.file) {
      await pool.query(
        `INSERT INTO employee_images (employee_id, file_path, file_type, file_name)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_type = VALUES(file_type), file_path = VALUES(file_path)`,
        [employeeId, req.file.path, req.file.mimetype, req.file.filename]
      );
    }

    res.json({
      success: true,
      message: 'Employee added successfully!',
      employee: {
        id: employeeId,
        name,
        position,
        salary,
        active: activeValue,
        email: email || null,
        phone: phone || null,
        address: address || null,
        profileImage: req.file ? req.file.filename : null,
      },
    });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add the employee. Please try again.',
      error: error.message,
    });
  }
};

// Get All Employees (include all fields)
export const getAllEmployees = async (req, res) => {
  try {
    const [employees] = await pool.query(
      'SELECT e.id, e.name, e.position, e.salary, e.active, e.email, e.phone, e.address, ei.file_name FROM employees e LEFT JOIN employee_images ei ON e.id = ei.employee_id'
    );

    const groupedEmployees = employees.reduce((acc, emp) => {
      // Debug logging to see what's coming from database
      console.log(`Employee ${emp.id} (${emp.name}) - active value from DB:`, emp.active, 
                 `type: ${typeof emp.active}`, `converts to boolean: ${Boolean(emp.active)}`);
      
      if (!acc[emp.id]) {
        // IMPORTANT: Convert to boolean VERY explicitly 
        // Database might be returning numbers, strings, or other formats
        const isActive = emp.active === 1 || emp.active === '1' || emp.active === true;
        
        acc[emp.id] = {
          id: emp.id,
          name: emp.name,
          position: emp.position,
          salary: emp.salary,
          active: isActive,
          email: emp.email || null,
          phone: emp.phone || null,
          address: emp.address || null,
          profileImage: null,
        };
        
        // Debug log the converted value
        console.log(`Employee ${emp.id} (${emp.name}) - converted active value:`, isActive);
      }

      if (emp.file_name) {
        acc[emp.id].profileImage = emp.file_name;
      }

      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Employees fetched successfully',
      employees: Object.values(groupedEmployees),
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees. Please try again.',
      error: error.message,
    });
  }
};

// Update Employee (include all fields)
export const updateEmployee = async (req, res) => {
  try {
    const { id, name, position, salary, active, email, phone, address } = req.body;

    if (!id || !name || !position || !salary) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    // Convert active to number (0 or 1) for database consistency
    const activeValue = active === true || active === 1 ? 1 : 0;

    // Log the active value being received
    console.log('Updating employee with active status:', active, 'converted to:', activeValue);

    // Update employee details - include all fields
    const [updateResult] = await pool.query(
      'UPDATE employees SET name = ?, position = ?, salary = ?, active = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name, position, salary, activeValue, email || null, phone || null, address || null, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Update image if new one is uploaded
    if (req.file) {
      await pool.query(
        `INSERT INTO employee_images (employee_id, file_path, file_type, file_name)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_type = VALUES(file_type), file_path = VALUES(file_path)`,
        [id, req.file.path, req.file.mimetype, req.file.filename]
      );
    }

    res.json({
      success: true,
      message: 'Employee updated successfully!',
      employee: {
        id,
        name,
        position,
        salary,
        active: activeValue === 1,
        email: email || null,
        phone: phone || null,
        address: address || null,
        profileImage: req.file ? req.file.filename : null,
      },
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee. Please try again.',
      error: error.message,
    });
  }
};

// Toggle Employee Active Status - No changes needed
export const toggleEmployeeActive = async (req, res) => {
  try {
    const { id, active } = req.body;
    
    // Validate inputs
    if (typeof id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }
    
    if (typeof active === 'undefined') {
      return res.status(400).json({ success: false, message: 'Active status is required.' });
    }
    
    // Ensure active is treated as a number (0 or 1)
    const activeValue = active === true || active === 1 ? 1 : 0;
    
    console.log(`Toggling employee ${id} status to ${activeValue}`);
    
    // Execute the update
    const [result] = await pool.query(
      'UPDATE employees SET active = ? WHERE id = ?',
      [activeValue, id]
    );
    
    // Check if employee exists
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    
    // Verify the update was successful by querying the current status
    const [currentStatus] = await pool.query(
      'SELECT active FROM employees WHERE id = ?',
      [id]
    );
    
    console.log('Updated employee status in database:', currentStatus[0]);
    
    // Return success with the updated value (convert to Boolean for frontend)
    res.json({ 
      success: true, 
      message: 'Employee status updated successfully.',
      updatedStatus: currentStatus[0].active === 1
    });
  } catch (error) {
    console.error('Error toggling employee status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update employee status.', 
      error: error.message 
    });
  }
};

// Delete Employee (No changes needed)
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID is required to delete employee.' });
    }

    // Delete image if exists
    await pool.query('DELETE FROM employee_images WHERE employee_id = ?', [id]);

    const [deleteResult] = await pool.query('DELETE FROM employees WHERE id = ?', [id]);

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee. Please try again.',
      error: error.message,
    });
  }
};