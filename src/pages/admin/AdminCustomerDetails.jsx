import { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, DollarSign, ShoppingBag, RotateCcw, Headphones, ShoppingCart, Activity, AlertTriangle, Award } from 'lucide-react';

const AdminCustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [adjustPoints, setAdjustPoints] = useState('');
    const [adjustNotes, setAdjustNotes] = useState('');
    const [adjustLoading, setAdjustLoading] = useState(false);

    const fetchDetails = async () => {
        try {
            const res = await adminService.getCustomerDetails(id);
            setData(res);
        } catch (err) {
            setError(err.message || 'Failed to fetch customer details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleAdjustPoints = async (e) => {
        e.preventDefault();
        try {
            setAdjustLoading(true);
            await adminService.adjustCustomerLoyalty(id, { points: parseInt(adjustPoints, 10), notes: adjustNotes });
            setIsAdjusting(false);
            setAdjustPoints('');
            setAdjustNotes('');
            fetchDetails(); // Refresh to get updated balance
        } catch (err) {
            alert(err.message || 'Failed to adjust points');
        } finally {
            setAdjustLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page p-6 max-w-5xl mx-auto flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-page p-6 max-w-5xl mx-auto">
                <button onClick={() => navigate('/admin/customers')} className="flex items-center text-slate-500 hover:text-primary mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Customers
                </button>
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>
            </div>
        );
    }

    if (!data) return null;

    const { customer, metrics, recentOrders, returns, support, interests, cart } = data;

    const getSegmentBadge = (segment) => {
        switch (segment) {
            case 'VIP': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'REPEAT': return 'bg-green-100 text-green-800 border-green-200';
            case 'ONE_TIME': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'NEW': return 'bg-sky-100 text-sky-800 border-sky-200';
            case 'AT_RISK': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="admin-page p-6 max-w-6xl mx-auto space-y-6">
            <button onClick={() => navigate('/admin/customers')} className="flex items-center text-slate-500 hover:text-primary transition-colors">
                <ArrowLeft size={16} className="mr-1" /> Back to Customers
            </button>

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-400">
                        {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
                        <div className="flex items-center gap-3 text-slate-500 mt-1">
                            <span className="flex items-center gap-1 text-sm"><Mail size={14} /> {customer.email}</span>
                            <span className="flex items-center gap-1 text-sm"><Calendar size={14} /> Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <span className={`px-4 py-2 rounded-full border font-semibold ${getSegmentBadge(customer.segment)}`}>
                        {customer.segment.replace('_', ' ')} CUSTOMER
                    </span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2"><DollarSign size={16}/> Lifetime Revenue</div>
                    <div className="text-3xl font-bold text-slate-800">${metrics.lifetimeRevenue.toFixed(2)}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2"><ShoppingBag size={16}/> Paid Orders</div>
                    <div className="text-3xl font-bold text-slate-800">{metrics.paidOrderCount}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2"><Activity size={16}/> Average Order Val</div>
                    <div className="text-3xl font-bold text-slate-800">${metrics.averageOrderValue.toFixed(2)}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Award size={16}/> Loyalty Points</span>
                        <button onClick={() => setIsAdjusting(true)} className="text-xs text-primary hover:underline">Adjust</button>
                    </div>
                    <div className="text-3xl font-bold text-slate-800">{metrics.loyaltyBalance || 0}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium mb-1">Last Purchase</div>
                    <div className="text-xl font-semibold text-slate-800 mt-2">
                        {metrics.lastPurchaseDate ? new Date(metrics.lastPurchaseDate).toLocaleDateString() : 'Never'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Orders */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingBag size={18}/> Recent Orders</h3>
                            <Link to={`/admin/orders?search=${customer.email}`} className="text-sm text-primary hover:underline">View All</Link>
                        </div>
                        <div className="p-0">
                            {recentOrders.length === 0 ? (
                                <div className="p-6 text-center text-slate-500">No orders found.</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3">Order #</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {recentOrders.map(order => (
                                            <tr key={order._id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3">
                                                    <Link to={`/admin/orders/${order.orderNumber}`} className="text-primary hover:underline font-medium">
                                                        {order.orderNumber}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-3 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`text-[10px] px-2 py-1 rounded font-medium uppercase ${
                                                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {order.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 font-medium">${order.total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Products of Interest */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800">Purchased Products Summary</h3>
                        </div>
                        <div className="p-6">
                            {interests.uniqueProductsPurchased.length === 0 ? (
                                <span className="text-slate-500">No purchase history.</span>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {interests.uniqueProductsPurchased.map((product, idx) => (
                                        <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-sm">
                                            {product}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Cart Status */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                            <ShoppingCart size={18} className="text-slate-700"/> 
                            <h3 className="font-bold text-slate-800">Cart Status</h3>
                        </div>
                        <div className="p-6">
                            {cart.hasAbandonedCart ? (
                                <div>
                                    <div className="flex items-center gap-2 text-orange-600 font-medium mb-2">
                                        <AlertTriangle size={18} /> Abandoned Cart Active
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        Last updated: {new Date(cart.updatedAt).toLocaleString()}<br/>
                                        Recovery Stage: {cart.recoveryStage}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-500 text-sm">No active abandoned cart.</div>
                            )}
                        </div>
                    </div>

                    {/* Support & Returns Summary */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Headphones size={18}/> Support Activity</h3>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-600 text-sm">Total Tickets:</span>
                                <span className="font-bold text-slate-800">{support.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-sm">Open Tickets:</span>
                                <span className={`font-bold ${support.open > 0 ? 'text-red-600' : 'text-slate-800'}`}>{support.open}</span>
                            </div>
                            {support.open > 0 && (
                                <Link to={`/admin/support?search=${customer.email}`} className="text-sm text-primary hover:underline block mt-4 text-center border-t border-slate-100 pt-3">
                                    View Tickets
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><RotateCcw size={18}/> Return Activity</h3>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-600 text-sm">Total Return Requests:</span>
                                <span className="font-bold text-slate-800">{returns.total}</span>
                            </div>
                            {returns.total > 0 && (
                                <Link to={`/admin/returns?search=${customer.email}`} className="text-sm text-primary hover:underline block mt-4 text-center border-t border-slate-100 pt-3">
                                    View Returns
                                </Link>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Loyalty Adjustment Modal */}
            {isAdjusting && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Adjust Loyalty Points</h2>
                        <form onSubmit={handleAdjustPoints} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Points Adjustment (+ or -)</label>
                                <input 
                                    type="number" 
                                    required 
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g., 50 or -50"
                                    value={adjustPoints}
                                    onChange={(e) => setAdjustPoints(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Reason</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g., Goodwill credit"
                                    value={adjustNotes}
                                    onChange={(e) => setAdjustNotes(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsAdjusting(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900">Cancel</button>
                                <button type="submit" disabled={adjustLoading} className="btn btn-primary">{adjustLoading ? 'Saving...' : 'Save Adjustment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomerDetails;
