import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper function to generate JWT and send it as a cookie
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    };

    // Remove passwordHash before sending
    const userPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences
    };

    res
        .status(statusCode)
        .cookie('jwt', token, options)
        .json({
            success: true,
            data: { user: userPayload, token }
        });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: { message: 'Please provide all fields' }});
        }
        
        if (password.length < 6) {
            return res.status(400).json({ success: false, error: { message: 'Password must be at least 6 characters' }});
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: { message: 'An account with this email already exists' }});
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            passwordHash
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        console.error(`Register Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error during registration' }});
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: { message: 'Please provide an email and password' }});
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, error: { message: 'Invalid credentials' }});
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: { message: 'Invalid credentials' }});
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error(`Login Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error during login' }});
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/v1/auth/logout
export const logout = (req, res) => {
    res.cookie('jwt', 'none', {
        expires: new Date(0), // Expire immediately
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    });

    res.status(200).json({ success: true, data: {} });
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
export const getMe = async (req, res) => {
    // req.user is set by auth middleware
    const userPayload = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        preferences: req.user.preferences
    };

    res.status(200).json({ success: true, data: { user: userPayload } });
};

// @desc    Update user password
// @route   PUT /api/v1/auth/update-password
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: { message: 'Please provide current and new password' } });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: { message: 'New password must be at least 6 characters long' } });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: { message: 'Incorrect current password' } });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update Password Error:', error);
        res.status(500).json({ success: false, error: { message: error.message || 'Failed to update password' } });
    }
};
