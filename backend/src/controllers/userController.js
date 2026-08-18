import User from '../models/User.js';

// @desc    Update user profile
// @route   PATCH /api/v1/users/me
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' }});
        }

        // Only allow updating name for now
        if (req.body.name) {
            user.name = req.body.name;
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            data: {
                user: {
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role
                }
            }
        });
    } catch (error) {
        console.error(`Update Profile Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error updating profile' }});
    }
};
