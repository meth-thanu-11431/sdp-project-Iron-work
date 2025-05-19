import bcrypt from 'bcrypt';
import { createToken } from '../middleware/token.js';
import pool from '../config/db.js';
import validator from 'validator';

// Helper function to generate a nickname
const generateNickname = (name) => {
  return name.toLowerCase().replace(/\s+/g, '_') + Math.floor(1000 + Math.random() * 9000);
};

// Register Supervisor with nickname generation
const registerSupervisor = async (req, res) => {
  const { name, password, email, tel_num, nic } = req.body;
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

    // Generate a nickname using the name
    const nickname = generateNickname(name);

    // Handle profile image
    const profileImage = req.file ? req.file.filename : null;

    // Insert user into the database
    const INSERT_USER_QUERY =
      'INSERT INTO supervisors (supervisor_name, email, password, tel_num, profile_image, nickname, nic) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await pool.query(INSERT_USER_QUERY, [
      name,
      email,
      hashedPassword,
      tel_num,
      profileImage,
      nickname,
      nic
    ]);

    // Generate token for the newly registered user
    const token = createToken(result.insertId);

    res.json({ success: true, token, nickname });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Email already exists or error occurred' });
  }
};

// Login Supervisor
const loginSupervisor = async (req, res) => {
  const { email, password } = req.body;
  try {
    const SELECT_USER_QUERY = 'SELECT * FROM supervisors WHERE email = ?';
    const [rows] = await pool.query(SELECT_USER_QUERY, [email]);

    if (rows.length === 0) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const token = createToken(user.SupervisorID);

    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Error logging in user' });
  }
};

// Get Supervisors
const getSupervisors = async (req, res) => {
  try {
    const SELECT_USERS_QUERY =
      'SELECT SupervisorID, supervisor_name, nickname, email, tel_num, profile_image FROM supervisors';
    const [users] = await pool.query(SELECT_USERS_QUERY);

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Error getting users' });
  }
};

// Delete Supervisor
const deleteSupervisor = async (req, res) => {
  const { userId } = req.body;
  try {
    const DELETE_USER_QUERY = 'DELETE FROM supervisors WHERE SupervisorID = ?';
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
  const userId = req.body.userId;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }

  const profileImage = req.file.filename;

  const UPDATE_PROFILE_IMAGE_QUERY = `
    UPDATE supervisors SET profile_image = ? WHERE SupervisorID = ?
  `;

  try {
    await pool.query(UPDATE_PROFILE_IMAGE_QUERY, [profileImage, userId]);

    res.status(200).json({ success: true, message: 'Profile image updated', profile_image: profileImage });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ success: false, message: 'Error updating profile image' });
  }
};

// Get Supervisor by ID
const getSupervisorById = async (req, res) => {
  const { userId } = req.body;

  try {
    const SELECT_USER_QUERY =
      'SELECT SupervisorID, supervisor_name, nickname, email, tel_num, profile_image, join_date FROM supervisors WHERE SupervisorID = ?';
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

export {
  registerSupervisor,
  loginSupervisor,
  getSupervisors,
  deleteSupervisor,
  updateProfileImage,
  getSupervisorById
};
