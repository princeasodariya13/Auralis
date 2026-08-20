import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, ArchiveRestore, ShoppingCart, Users, Tag, TrendingUp, LogOut, Menu, X, RotateCcw, ShieldAlert, FileText, Headphones, Star, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import './AdminLayout.css';
import '../pages/admin/AdminDashboard.css'; // Import shared admin layout classes (.admin-panel, etc)

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="admin-layout">
            {/* Mobile Header */}
            <div className="admin-mobile-header">
                <Link to="/admin" className="admin-logo">
                    AURALIS <span className="admin-badge">ADMIN</span>
                </Link>
                <button className="mobile-toggle" onClick={toggleSidebar} aria-label="Toggle Sidebar">
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <Link to="/admin" className="admin-logo">
                        AURALIS
                        <span className="admin-badge">ADMIN</span>
                    </Link>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">Administrator</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>
                    
                    <NavLink to="/admin/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Package size={20} />
                        <span>Products</span>
                    </NavLink>

                    <NavLink to="/admin/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ArchiveRestore size={20} />
                        <span>Inventory</span>
                    </NavLink>

                    <NavLink to="/admin/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ShoppingCart size={20} />
                        <span>Orders</span>
                    </NavLink>
                    
                    <NavLink to="/admin/fulfillment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <AlertTriangle size={20} />
                        <span>Fulfillment Ops</span>
                    </NavLink>
                    <NavLink to="/admin/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={20} />
                        <span>Customers</span>
                    </NavLink>
                    <NavLink to="/admin/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ShoppingCart size={20} />
                        <span>Orders</span>
                    </NavLink>
                    <NavLink to="/admin/returns" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <RotateCcw size={20} />
                        <span>Returns</span>
                    </NavLink>
                    <NavLink to="/admin/support" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Headphones size={20} />
                        <span>Service Desk</span>
                    </NavLink>
                    <NavLink to="/admin/reviews" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Star size={20} />
                        <span>Reviews</span>
                    </NavLink>
                    <NavLink to="/admin/coupons" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Tag size={20} />
                        <span>Coupons</span>
                    </NavLink>
                    <NavLink to="/admin/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <TrendingUp size={20} />
                        <span>Analytics</span>
                    </NavLink>
                    <NavLink to="/admin/reconciliation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ShieldAlert size={20} />
                        <span>Reconciliation</span>
                    </NavLink>
                    <NavLink to="/admin/audit-logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FileText size={20} />
                        <span>Audit Logs</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                    <Link to="/" className="storefront-link">
                        Back to Storefront
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-content-wrapper">
                    <Outlet />
                </div>
            </main>
            
            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>
            )}
        </div>
    );
};

export default AdminLayout;
