import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { adminService } from '../../services/apiService';
import { User, Shield, Lock, Key, UserPlus, CheckCircle2, AlertTriangle, Mail, Calendar, RefreshCw, Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';
import './AdminDashboard.css';
import './AdminProducts.css';
import '../../components/AdminShared.css';

const AdminProfile = () => {
    const { user } = useAuth();
    
    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [passError, setPassError] = useState(null);
    const [passSuccess, setPassSuccess] = useState(null);

    // New Admin Registration State
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
    const [showAdminPass, setShowAdminPass] = useState(false);
    const [addAdminLoading, setAddAdminLoading] = useState(false);
    const [addAdminError, setAddAdminError] = useState(null);
    const [addAdminSuccess, setAddAdminSuccess] = useState(null);

    // Active View Tab State
    const [activeTab, setActiveTab] = useState('all');

    // List of Administrators State
    const [adminsList, setAdminsList] = useState([]);
    const [listLoading, setListLoading] = useState(true);

    const fetchAdmins = async () => {
        try {
            setListLoading(true);
            const data = await adminService.getAdmins();
            setAdminsList(data || []);
        } catch (err) {
            console.error('Failed to fetch admins:', err);
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPassError(null);
        setPassSuccess(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPassError('Please fill out all password fields.');
            return;
        }

        if (newPassword.length < 6) {
            setPassError('New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPassError('New password and confirmation password do not match.');
            return;
        }

        try {
            setPassLoading(true);
            await authService.updatePassword(currentPassword, newPassword);
            setPassSuccess('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPassError(err.message || 'Failed to update password.');
        } finally {
            setPassLoading(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setAddAdminError(null);
        setAddAdminSuccess(null);

        if (!adminName.trim() || !adminEmail.trim() || !adminPassword) {
            setAddAdminError('Please fill out all administrator fields.');
            return;
        }

        if (adminPassword.length < 6) {
            setAddAdminError('Password must be at least 6 characters long.');
            return;
        }

        if (adminPassword !== adminConfirmPassword) {
            setAddAdminError('Password and confirmation password do not match.');
            return;
        }

        try {
            setAddAdminLoading(true);
            const res = await adminService.createAdmin({
                name: adminName.trim(),
                email: adminEmail.trim(),
                password: adminPassword
            });
            setAddAdminSuccess(`Admin account for ${res.name} (${res.email}) created successfully!`);
            setAdminName('');
            setAdminEmail('');
            setAdminPassword('');
            setAdminConfirmPassword('');
            fetchAdmins(); // Refresh admin team list
        } catch (err) {
            setAddAdminError(err.message || 'Failed to create admin user.');
        } finally {
            setAddAdminLoading(false);
        }
    };

    return (
        <div className="admin-page p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="admin-header mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck size={28} className="text-primary" /> Admin Profile & Access Management
                    </h1>
                    <p className="text-muted text-sm mt-1">Manage your account security and grant administrator privileges to team members.</p>
                </div>
            </div>

            {/* Current Admin Profile Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase">
                                {user?.role || 'Administrator'}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-muted text-sm mt-1">
                            <span className="flex items-center gap-1"><Mail size={14} /> {user?.email}</span>
                            <span className="flex items-center gap-1"><Shield size={14} className="text-green-600" /> Full Access</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Filter Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                        activeTab === 'all'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <ShieldCheck size={16} /> Overview
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('password')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                        activeTab === 'password'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <Key size={16} /> Change Password
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('add-admin')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                        activeTab === 'add-admin'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <UserPlus size={16} /> Add New Admin
                </button>
            </div>

            {/* Grid for Change Password & Add Admin */}
            <div className={`grid grid-cols-1 ${activeTab === 'all' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
                {/* Card 1: Change Password */}
                {(activeTab === 'all' || activeTab === 'password') && (
                <div className="card p-6">

                    <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                        <Key size={20} className="text-primary" />
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Change Password</h3>
                            <p className="text-muted text-xs">Update your credentials to maintain account security.</p>
                        </div>
                    </div>

                    {passError && (
                        <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center gap-2">
                            <AlertTriangle size={16} /> {passError}
                        </div>
                    )}

                    {passSuccess && (
                        <div className="p-3 mb-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle2 size={16} /> {passSuccess}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showCurrentPass ? 'text' : 'password'}
                                    className="form-control"
                                    style={{ paddingRight: '2.5rem' }}
                                    placeholder="Enter current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                >
                                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNewPass ? 'text' : 'password'}
                                    className="form-control"
                                    style={{ paddingRight: '2.5rem' }}
                                    placeholder="At least 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onClick={() => setShowNewPass(!showNewPass)}
                                >
                                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Re-type new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full d-inline-flex justify-content-center align-items-center gap-2 py-2.5 mt-2"
                            disabled={passLoading}
                        >
                            {passLoading ? (
                                <>
                                    <RefreshCw size={16} className="spinner" /> Updating...
                                </>
                            ) : (
                                <>
                                    <Lock size={16} /> Update Password
                                </>
                            )}
                        </button>
                    </form>
                </div>
                )}

                {/* Card 2: Create New Admin */}
                {(activeTab === 'all' || activeTab === 'add-admin') && (
                <div className="card p-6">
                    <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                        <UserPlus size={20} className="text-primary" />
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Add New Admin</h3>
                            <p className="text-muted text-xs">Grant full store administrative access to a new team member.</p>
                        </div>
                    </div>

                    {addAdminError && (
                        <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center gap-2">
                            <AlertTriangle size={16} /> {addAdminError}
                        </div>
                    )}

                    {addAdminSuccess && (
                        <div className="p-3 mb-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle2 size={16} /> {addAdminSuccess}
                        </div>
                    )}

                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Sarah Jenkins"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="e.g. sarah@auralis.com"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showAdminPass ? 'text' : 'password'}
                                        className="form-control"
                                        style={{ paddingRight: '2.5rem' }}
                                        placeholder="Min 6 chars"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            padding: '0.25rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onClick={() => setShowAdminPass(!showAdminPass)}
                                    >
                                        {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Re-type password"
                                    value={adminConfirmPassword}
                                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full d-inline-flex justify-content-center align-items-center gap-2 py-2.5 mt-2"
                            disabled={addAdminLoading}
                        >
                            {addAdminLoading ? (
                                <>
                                    <RefreshCw size={16} className="spinner" /> Creating Admin...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={16} /> Create Admin Account
                                </>
                            )}
                        </button>
                    </form>
                </div>
                )}
            </div>

            {/* Active Administrators List */}
            <div className="admin-panel mt-6">
                <div className="panel-header d-flex justify-content-between align-items-center">
                    <h2 className="d-flex align-items-center gap-2 text-lg font-bold">
                        <Users size={20} className="text-primary" /> Active Store Administrators ({adminsList.length})
                    </h2>
                    <button onClick={fetchAdmins} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                        <RefreshCw size={14} className={listLoading ? 'spinner' : ''} /> Refresh
                    </button>
                </div>
                <div className="panel-body p-0">
                    {listLoading ? (
                        <div className="p-8 text-center text-muted">
                            <RefreshCw size={24} className="spinner mx-auto mb-2" />
                            Loading administrator team...
                        </div>
                    ) : adminsList.length === 0 ? (
                        <div className="p-8 text-center text-muted">No admin accounts found.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Administrator</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminsList.map((adminUser) => (
                                        <tr key={adminUser._id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
                                                        {adminUser.name?.charAt(0).toUpperCase() || 'A'}
                                                    </div>
                                                    <span className="font-semibold text-slate-800">{adminUser.name}</span>
                                                    {adminUser._id === user?._id && (
                                                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded uppercase">You</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-slate-600">{adminUser.email}</td>
                                            <td>
                                                <span className="status-badge status-paid uppercase text-xs font-semibold">
                                                    ADMINISTRATOR
                                                </span>
                                            </td>
                                            <td className="text-slate-500 text-sm">
                                                {adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                                <span className="badge badge-success d-inline-flex align-items-center gap-1">
                                                    <CheckCircle2 size={12} /> Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
