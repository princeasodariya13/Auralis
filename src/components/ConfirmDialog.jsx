import PropTypes from 'prop-types';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    loading = false,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertTriangle size={24} className="confirm-icon icon-danger" />;
            case 'warning':
                return <AlertTriangle size={24} className="confirm-icon icon-warning" />;
            default:
                return <Info size={24} className="confirm-icon icon-info" />;
        }
    };

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-card-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <button className="confirm-close-btn" onClick={onCancel} aria-label="Close">
                    <X size={18} />
                </button>

                <div className="confirm-header-row">
                    <div className={`confirm-icon-wrapper type-${type}`}>
                        {getIcon()}
                    </div>
                    <div className="confirm-title-area">
                        <h3 className="confirm-title">{title}</h3>
                        <p className="confirm-message">{message}</p>
                    </div>
                </div>

                <div className="confirm-actions-row">
                    <button
                        type="button"
                        className="btn-confirm-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`btn-confirm-proceed btn-proceed-${type}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="confirm-spinner-text">Processing...</span>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

ConfirmDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    type: PropTypes.oneOf(['danger', 'warning', 'info']),
    loading: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default ConfirmDialog;
