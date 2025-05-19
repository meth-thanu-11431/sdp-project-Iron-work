
import pool from '../config/db.js'; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
};

const registerAdmin = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const SELECT_ADMIN_QUERY = 'SELECT * FROM admins WHERE email = ?';
        const [existingAdmins] = await pool.query(SELECT_ADMIN_QUERY, [email]);

        if (existingAdmins.length > 0) {
            return res.json({ success: false, message: "Admin already exists" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const INSERT_ADMIN_QUERY = 'INSERT INTO admins (username, email, password) VALUES (?, ?, ?)';
        const [result] = await pool.query(INSERT_ADMIN_QUERY, [username, email, hashedPassword]);

        const token = createToken(result.insertId);
        res.json({ success: true, token });

    } catch (error) {
        console.error('Error registering admin:', error);
        res.json({ success: false, message: "Error registering admin" });
    }
};

const loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const SELECT_ADMIN_QUERY = 'SELECT * FROM admins WHERE email = ?';
        const [rows] = await pool.query(SELECT_ADMIN_QUERY, [email]);

        if (rows.length === 0) {
            return res.json({ success: false, message: "Invalid email or password" });
        }

        const admin = rows[0];
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid email or password" });
        }

        const token = createToken(admin.id);
        res.json({ success: true, token });

    } catch (error) {
        console.error('Error logging in admin:', error);
        res.json({ success: false, message: "Error logging in admin" });
    }
};

export { registerAdmin, loginAdmin };
