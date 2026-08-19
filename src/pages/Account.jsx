import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import AddressManager from '../components/AddressManager';

const Account = () => {
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();
    
    const [name, setName] = useState(user?.name || '');
    const [emailMarketing, setEmailMarketing] = useState(user?.preferences?.emailMarketing ?? true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        
        if (name === user.name && emailMarketing === (user.preferences?.emailMarketing ?? true)) return;
        
        setIsUpdating(true);
        try {
            await updateProfile(name, { emailMarketing });
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="section container">
            <div style={{ 
                maxWidth: '800px', 
                margin: '0 auto', 
                padding: 'var(--spacing-lg) 0'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-xl)',
                    paddingBottom: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>My Account</h1>
                    <button 
                        onClick={handleLogout}
                        className="btn btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: 'var(--spacing-xl)',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    {/* Profile Information */}
                    <div style={{ 
                        backgroundColor: 'var(--color-surface)', 
                        padding: 'var(--spacing-lg)', 
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 'var(--spacing-lg)' }}>
                            <UserIcon size={24} color="var(--color-indigo)" />
                            <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Profile Details</h2>
                        </div>

                        {message.text && (
                            <div style={{
                                backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: message.type === 'success' ? '#22c55e' : '#ef4444',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem'
                            }}>
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={user?.email || ''}
                                    disabled
                                />
                                <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>Email cannot be changed.</p>
                            </div>

                            <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    id="emailMarketing"
                                    checked={emailMarketing}
                                    onChange={(e) => setEmailMarketing(e.target.checked)}
                                    style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                                />
                                <label htmlFor="emailMarketing" style={{ margin: 0, cursor: 'pointer', fontWeight: 400, color: 'var(--color-slate-300)' }}>
                                    Receive marketing and abandoned cart reminder emails
                                </label>
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={isUpdating || (name === user?.name && emailMarketing === (user?.preferences?.emailMarketing ?? true))}
                                style={{ alignSelf: 'flex-start', marginTop: 'var(--spacing-xs)' }}
                            >
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* Quick Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        <div style={{ 
                            backgroundColor: 'var(--color-surface)', 
                            padding: 'var(--spacing-lg)', 
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-slate-600)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--color-slate-300)', margin: 0 }}>Order History</h3>
                                <button onClick={() => navigate('/orders')} className="btn btn-outline btn-sm">View All</button>
                            </div>
                            <p style={{ fontSize: '0.875rem' }}>View your past orders, track shipments, and request cancellations.</p>
                        </div>
                        
                        <div style={{ 
                            backgroundColor: 'var(--color-surface)', 
                            padding: 'var(--spacing-lg)', 
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-slate-600)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--color-slate-300)', margin: 0 }}>My Wishlist</h3>
                                <button onClick={() => navigate('/wishlist')} className="btn btn-outline btn-sm">View All</button>
                            </div>
                            <p style={{ fontSize: '0.875rem' }}>View and manage your saved audio gear.</p>
                        </div>

                        <div style={{ 
                            backgroundColor: 'var(--color-surface)', 
                            padding: 'var(--spacing-lg)', 
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-slate-600)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--color-slate-300)', margin: 0 }}>Notifications</h3>
                                <button onClick={() => navigate('/account/notifications')} className="btn btn-outline btn-sm">View All</button>
                            </div>
                            <p style={{ fontSize: '0.875rem' }}>View your order updates and account alerts.</p>
                        </div>

                        <div style={{ 
                            backgroundColor: 'var(--color-surface)', 
                            padding: 'var(--spacing-lg)', 
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-slate-600)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--color-slate-300)', margin: 0 }}>Returns & Refunds</h3>
                                <button onClick={() => navigate('/account/returns')} className="btn btn-outline btn-sm">View All</button>
                            </div>
                            <p style={{ fontSize: '0.875rem' }}>Track your return requests and refunds.</p>
                        </div>
                        
                        <div style={{ 
                            backgroundColor: 'var(--color-surface)', 
                            padding: 'var(--spacing-lg)', 
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-slate-600)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--color-slate-300)', margin: 0 }}>Customer Support</h3>
                                <button onClick={() => navigate('/account/support')} className="btn btn-outline btn-sm">View Tickets</button>
                            </div>
                            <p style={{ fontSize: '0.875rem' }}>Get help with orders, products, and more.</p>
                        </div>

                        <div style={{ 
                            backgroundColor: 'var(--color-surface)', 
                            padding: 'var(--spacing-lg)', 
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-slate-600)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--color-slate-300)', margin: 0 }}>Auralis Rewards</h3>
                                <button onClick={() => navigate('/account/loyalty')} className="btn btn-outline btn-sm">View Points</button>
                            </div>
                            <p style={{ fontSize: '0.875rem' }}>Track your loyalty points and transaction history.</p>
                        </div>
                    </div>
                </div>

                {/* Addresses Section */}
                <div style={{ 
                    backgroundColor: 'var(--color-surface)', 
                    padding: 'var(--spacing-lg)', 
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <AddressManager />
                </div>
            </div>
        </div>
    );
};

export default Account;
