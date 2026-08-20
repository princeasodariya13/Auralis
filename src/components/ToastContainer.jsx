import { useToast } from '../context/ToastContext';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import './ToastContainer.css';

const ToastContainer = () => {
    const { toasts } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    {toast.type === 'success' && <CheckCircle2 size={18} />}
                    {toast.type === 'error' && <AlertCircle size={18} />}
                    {toast.type === 'info' && <Info size={18} />}
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
