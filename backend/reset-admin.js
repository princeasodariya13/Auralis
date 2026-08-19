import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const reset = async () => {
    await mongoose.connect('mongodb://localhost:27017/auralis');
    const User = mongoose.model('User', new mongoose.Schema({email: String, passwordHash: String, role: String}, {strict: false}), 'users');
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    await User.updateOne({ email: 'admin@auralis.com' }, { $set: { passwordHash: passwordHash } });
    console.log('Password reset to admin123');
    process.exit(0);
};
reset();
