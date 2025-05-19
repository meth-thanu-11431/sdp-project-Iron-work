// authMiddleware.js

import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        return res.status(401).json({ success: false, message: "Not Authorized, Please Log In Again" });
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.body.userId = token_decode.id;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export default authMiddleware;




