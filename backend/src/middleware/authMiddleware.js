import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token;
        
        // Use HttpOnly cookie
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: { message: 'Not authorized, no token' }
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user but exclude passwordHash
        const user = await User.findById(decoded.id).select('-passwordHash');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Not authorized, user not found' }
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: { message: 'Not authorized, token failed' }
        });
    }
};

// Admin middleware
export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            error: { message: 'Not authorized as an admin' }
        });
    }
};
