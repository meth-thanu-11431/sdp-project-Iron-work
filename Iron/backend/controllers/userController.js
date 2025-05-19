import bcrypt from 'bcrypt';
import { createToken } from '../middleware/token.js';
import pool from '../config/db.js';
import validator from 'validator';

// Register User
const registerUser = async (req, res) => {
  const { name, password, email, tel_num } = req.body;
  try {
    // Validation checks
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Please enter a valid email' });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: 'Please enter a strong password' });
    }
    if (tel_num.length !== 10) {
      return res.json({ success: false, message: 'Please enter a valid phone number' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle profile image
    const profileImage = req.file ? req.file.filename : null; // If no file, store null

    // Insert user into the database
    const INSERT_USER_QUERY =
      'INSERT INTO customers (customer_name, email, password, tel_num, profile_image) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(INSERT_USER_QUERY, [
      name,
      email,
      hashedPassword,
      tel_num,
      profileImage,
    ]);

    // Fetch the newly created user
    const SELECT_USER_QUERY = 'SELECT CustomerID, customer_name, tel_num FROM customers WHERE CustomerID = ?';
    const [users] = await pool.query(SELECT_USER_QUERY, [result.insertId]);
    const user = users[0];

    // Generate token for the newly registered user
    const token = createToken(result.insertId);

    res.json({ success: true, token, userId: user.CustomerID, name: user.customer_name, phone: user.tel_num });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Email already exists or error occurred' });
  }
};

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const SELECT_USER_QUERY = 'SELECT * FROM customers WHERE email = ?';
    const [rows] = await pool.query(SELECT_USER_QUERY, [email]);

    if (rows.length === 0) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const token = createToken(user.CustomerID);

    // Send userID and name along with token
    res.json({ success: true, token, userId: user.CustomerID, name: user.customer_name, phone: user.tel_num });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Error logging in user' });
  }
};

// Get Users
const getUsers = async (req, res) => {
  try {
    const SELECT_USERS_QUERY =
      'SELECT CustomerID, customer_name, email, tel_num, profile_image FROM customers';
    const [users] = await pool.query(SELECT_USERS_QUERY);

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Error getting users' });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  const { userId } = req.body;
  try {
    const DELETE_USER_QUERY = 'DELETE FROM customers WHERE CustomerID = ?';
    const [result] = await pool.query(DELETE_USER_QUERY, [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
};

// Update Profile Image
const updateProfileImage = async (req, res) => {
  const userId = req.body.userId; // Get userId from the request body
  console.log('Received userId:', userId); // Debugging to check userId

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }

  const profileImage = req.file.filename; // Get the uploaded image filename

  const UPDATE_PROFILE_IMAGE_QUERY = `
    UPDATE customers SET profile_image = ? WHERE CustomerID = ?
  `;

  try {
    // Log the query and parameters to ensure it's correct
    console.log('Running query:', UPDATE_PROFILE_IMAGE_QUERY, [profileImage, userId]);

    // Execute the query to update the database with the new image filename
    await pool.query(UPDATE_PROFILE_IMAGE_QUERY, [profileImage, userId]);

    res.status(200).json({ success: true, message: 'Profile image updated', profile_image: profileImage });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ success: false, message: 'Error updating profile image' });
  }
};

// Get User by ID
const getUserById = async (req, res) => {
  const { userId } = req.body; // Get userId from the request body

  try {
    const SELECT_USER_QUERY =
      'SELECT CustomerID, customer_name, email, tel_num, profile_image, join_date FROM customers WHERE CustomerID = ?';
    const [rows] = await pool.query(SELECT_USER_QUERY, [userId]);

    if (rows.length === 0) {
      return res.json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ success: false, message: 'Error fetching user data' });
  }
};


// Update User Information (name and phone number)
const updateUserInfo = async (req, res) => {
  const { userId, customer_name, tel_num } = req.body;
  
  // Validation
  if (!customer_name || !tel_num) {
    return res.status(400).json({ success: false, message: 'Name and phone number are required' });
  }
  
  if (tel_num.length !== 10) {
    return res.status(400).json({ success: false, message: 'Phone number must be 10 digits' });
  }
  
  try {
    const UPDATE_USER_QUERY = `
      UPDATE customers 
      SET customer_name = ?, tel_num = ? 
      WHERE CustomerID = ?
    `;
    
    await pool.query(UPDATE_USER_QUERY, [customer_name, tel_num, userId]);
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      name: customer_name,
      phone: tel_num 
    });
  } catch (error) {
    console.error('Error updating user information:', error);
    res.status(500).json({ success: false, message: 'Error updating profile information' });
  }
};

// Change User Password
const changePassword = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  
  // Validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
  }
  
  try {
    // First, get the current password from database
    const SELECT_USER_QUERY = 'SELECT password FROM customers WHERE CustomerID = ?';
    const [rows] = await pool.query(SELECT_USER_QUERY, [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = rows[0];
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    const UPDATE_PASSWORD_QUERY = `
      UPDATE customers 
      SET password = ? 
      WHERE CustomerID = ?
    `;
    
    await pool.query(UPDATE_PASSWORD_QUERY, [hashedPassword, userId]);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
};

// Update Profile Image (enhanced version that accepts all user fields)
const updateUser = async (req, res) => {
  const userId = req.body.userId;
  
  try {
    let updates = {};
    let updateQueryParts = [];
    let queryParams = [];
    
    // Handle profile image if present
    if (req.file) {
      updates.profile_image = req.file.filename;
      updateQueryParts.push('profile_image = ?');
      queryParams.push(req.file.filename);
    }
    
    // Handle other fields if present
    if (req.body.customer_name) {
      updates.customer_name = req.body.customer_name;
      updateQueryParts.push('customer_name = ?');
      queryParams.push(req.body.customer_name);
    }
    
    if (req.body.tel_num) {
      if (req.body.tel_num.length !== 10) {
        return res.status(400).json({ success: false, message: 'Phone number must be 10 digits' });
      }
      updates.tel_num = req.body.tel_num;
      updateQueryParts.push('tel_num = ?');
      queryParams.push(req.body.tel_num);
    }
    
    // If no updates to make
    if (updateQueryParts.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided for update' });
    }
    
    // Add userId to params array
    queryParams.push(userId);
    
    // Create the update query
    const UPDATE_QUERY = `
      UPDATE customers 
      SET ${updateQueryParts.join(', ')} 
      WHERE CustomerID = ?
    `;
    
    // Execute the query
    await pool.query(UPDATE_QUERY, queryParams);
    
    // Return success with updated fields
    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      ...updates
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};

export { loginUser, registerUser, getUsers, deleteUser, updateProfileImage, getUserById, updateUserInfo, changePassword, updateUser };
